#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Set your Docker Hub username
DOCKER_USER="devdenise"

if [ -z "$DOCKER_TOKEN" ]; then
  echo "Error: DOCKER_TOKEN environment variable not set."
  exit 1
fi

echo "$DOCKER_TOKEN" | docker login -u "devdenise" --password-stdin

# Define image names and tags
BACKEND_IMAGE="$DOCKER_USER/financeplatform-backend:latest"
FRONTEND_IMAGE="$DOCKER_USER/financeplatform-frontend:latest"

# Check if Dockerfiles have changed (optional - you might want to remove this check for now)
if git diff --quiet Dockerfile ../backend/Dockerfile ../frontend/Dockerfile; then
  echo "No changes detected in Dockerfiles. Skipping image build."
  exit 0
fi

# Build backend image
echo "Building backend image..."
cd ../backend
if [[ ! -f "package.json" ]]; then
  echo "Error: package.json not found in backend directory"
  exit 1
fi

docker build -t $BACKEND_IMAGE .
echo "Pushing backend image..."
docker push $BACKEND_IMAGE

# Build frontend image
echo "Building frontend image..."
cd ../frontend
if [[ ! -f "package.json" ]]; then
  echo "Error: package.json not found in frontend directory"
  exit 1
fi

docker build -t $FRONTEND_IMAGE .
echo "Pushing frontend image..."
docker push $FRONTEND_IMAGE

echo "Docker images built and pushed successfully."