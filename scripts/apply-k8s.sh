#!/bin/bash
# Function to cleanup port-forward on script exit# 1. Health Check Function
check_health() {
    echo "🔍 Performing health checks..."
    
    # Check if port-forward is working
    if curl -s http://localhost:8080 > /dev/null; then
        echo "✅ Application is responding on http://localhost:8080"
    else
        echo "⚠️  Application not responding yet, may still be starting..."
    fi
    
    # Check database connectivity
    kubectl exec -n $NAMESPACE deployment/backend -- node -e "
        const { Pool } = require('pg');
        const pool = new Pool({connectionString: process.env.DATABASE_URL});
        pool.query('SELECT NOW()', (err, res) => {
            if (err) console.log('❌ DB Error:', err.message);
            else console.log('✅ Database connected successfully');
            process.exit(0);
        });
    " 2>/dev/null || echo "⚠️  Database health check skipped"
}

# 2. Auto-open browser
open_browser() {
    sleep 3  # Wait for port-forward to be ready
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:8080
    elif command -v open > /dev/null; then
        open http://localhost:8080
    fi
}

# 3. Watch logs in background
tail_logs() {
    echo "📋 Starting log tail in background..."
    kubectl logs -f -n $NAMESPACE deployment/backend --prefix=true &
    BACKEND_LOGS_PID=$!
    kubectl logs -f -n $NAMESPACE deployment/frontend --prefix=true &
    FRONTEND_LOGS_PID=$!
}

# 4. Enhanced cleanup
cleanup() {
    echo ""
    echo "🛑 Cleaning up..."
    
    # Kill port-forward
    if [ ! -z "$PORT_FORWARD_PID" ] && kill -0 "$PORT_FORWARD_PID" 2>/dev/null; then
        echo "Stopping port-forward..."
        kill "$PORT_FORWARD_PID" 2>/dev/null
        wait "$PORT_FORWARD_PID" 2>/dev/null
    fi
    
    # Kill log tails
    [ ! -z "$BACKEND_LOGS_PID" ] && kill "$BACKEND_LOGS_PID" 2>/dev/null
    [ ! -z "$FRONTEND_LOGS_PID" ] && kill "$FRONTEND_LOGS_PID" 2>/dev/null
    
    echo "Cleanup complete. Goodbye! 👋"
    exit 0
}
# Set up trap to catch EXIT, INT (Ctrl+C), and TERM signals
trap cleanup EXIT INT TERM

echo "Checking Minikube status..."
minikube status
if [ $? -ne 0 ]; then
  echo "Minikube not running. Please start Minikube first."
  exit 1
fi

if [ -f "../frontend/.env" ]; then
    echo "📄 Loading environment variables from ../frontend/.env file..."
    export $(grep -v '^#' ../frontend/.env | xargs)
fi

# Validate required environment variables
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be set"
    echo ""
    echo "Please either:"
    echo "1. Create a .env file with:"
    echo "   GOOGLE_CLIENT_ID=your-client-id"
    echo "   GOOGLE_CLIENT_SECRET=your-client-secret"
    echo ""
    echo "2. Or set environment variables before running:"
    echo "   export GOOGLE_CLIENT_ID='your-client-id'"
    echo "   export GOOGLE_CLIENT_SECRET='your-client-secret'"
    echo "   ./deploy.sh"
    exit 1
fi

echo "✅ Google OAuth credentials loaded successfully"

LOG_FILE="deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1


NAMESPACE=financeplatform
MANIFEST_DIR="../k8s-manifests"


echo "Creating namespace '$NAMESPACE'..."
kubectl apply -f $MANIFEST_DIR/namespace.yaml

echo "Applying ConfigMaps and Secrets..."
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/postgres-init-sql-configmap.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/redis-configmap.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/nginx-configmap.yaml

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Delete existing secrets if they exist (to avoid conflicts)
kubectl delete secret backend-secrets -n $NAMESPACE --ignore-not-found
kubectl delete secret frontend-secrets -n $NAMESPACE --ignore-not-found
kubectl delete secret nginx-ssl-secret -n $NAMESPACE --ignore-not-found
kubectl delete secret google-oauth -n $NAMESPACE --ignore-not-found

kubectl create secret generic backend-secrets \
  --from-literal=postgres-password=dev123 \
  --from-literal=postgres-user=dev \
  --from-literal=postgres-db=financeplatform \
  --from-literal=database-url="postgresql://dev:dev123@postgres:5432/financeplatform" \
  --from-literal=redis-password=redis \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --namespace=$NAMESPACE

kubectl create secret generic frontend-secrets \
  --from-literal=NEXT_PUBLIC_API_URL=http://localhost:3000 \
  --from-literal=ANALYTICS_ID=your-analytics-id \
  --from-literal=nextauth-secret="$NEXTAUTH_SECRET" \
  --namespace=$NAMESPACE

  kubectl create secret generic google-oauth \
  --from-literal=client-id="$GOOGLE_CLIENT_ID" \
  --from-literal=client-secret="$GOOGLE_CLIENT_SECRET" \
  --namespace=$NAMESPACE

# Create self-signed certificate for nginx (if files don't exist)
if [ ! -f "tls.crt" ] || [ ! -f "tls.key" ]; then
    echo "Creating self-signed certificate for nginx..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout tls.key \
        -out tls.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=financeflow.local"
fi

kubectl create secret tls nginx-ssl-secret \
  --cert=tls.crt \
  --key=tls.key \
  -n $NAMESPACE

echo "Deploying PostgreSQL..."
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/postgres-deployment.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/postgres-service.yaml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --namespace $NAMESPACE --for=condition=ready pod -l app=postgres --timeout=120s

echo "Deploying Redis..."
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/redis-deployment.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/redis-service.yaml
echo "Waiting for Redis to be ready..."
kubectl wait --namespace $NAMESPACE --for=condition=ready pod -l app=redis --timeout=60s

echo "Deploying Backend API..."
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/backend-pvc.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/backend-deployment.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/backend-service.yaml
echo "Waiting for Backend to be ready..."
kubectl wait --namespace $NAMESPACE --for=condition=ready pod -l app=backend --timeout=120s

echo "Deploying Frontend..."
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/frontend-deployment.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/frontend-service.yaml
echo "Waiting for Frontend to be ready..."
kubectl wait --namespace $NAMESPACE --for=condition=ready pod -l app=frontend --timeout=120s

echo "Deploying Nginx..."
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/nginx-deployment.yaml
kubectl apply -n $NAMESPACE -f $MANIFEST_DIR/nginx-service.yaml
echo "Waiting for Nginx to be ready..."
kubectl wait --namespace $NAMESPACE --for=condition=ready pod -l app=nginx --timeout=60s

echo ""
echo "🎉 All components deployed successfully!"
echo ""

# Show deployment status
echo "📊 Deployment Status:"
kubectl get pods -n $NAMESPACE
echo ""

tail_logs

echo "🚀 Starting FinanceFlow development access..."
kubectl port-forward -n $NAMESPACE svc/nginx 8080:80 &
PORT_FORWARD_PID=$!

kubectl port-forward -n $NAMESPACE svc/backend 4000:3001 &
BACKEND_PID=$!

kubectl port-forward -n $NAMESPACE svc/pgadmin 8081:80 &
PGADMIN_PID=$!

# Wait a moment for port-forward to establish
sleep 15


check_health
open_browser


echo ""
echo "✅ FinanceFlow is now accessible at: http://localhost:8080"
echo "📝 Logs are being written to: $LOG_FILE"
echo ""
echo "Additional access methods:"
echo "  Backend API: minikube service backend -n $NAMESPACE"
echo "  Frontend:    minikube service frontend -n $NAMESPACE"  
echo "  Nginx:       minikube service nginx -n $NAMESPACE"
echo ""
echo "🔍 Useful commands while running:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -f deployment/backend -n $NAMESPACE"
echo "  kubectl logs -f deployment/frontend -n $NAMESPACE"
echo ""
echo "🛑 Press Ctrl+C to stop the port-forward and exit cleanly"
echo ""

# Keep the script running and wait for the port-forward process
# This will block until the port-forward is killed or script is interrupted
wait $PORT_FORWARD_PID