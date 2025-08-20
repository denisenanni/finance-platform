#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# --- Determine script location and repository root ---
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
REPO_ROOT="$SCRIPT_DIR/.."

# --- Configuration ---
# Set your Docker Hub username
DOCKER_USER="devdenise"
# Get the short Git commit hash to use as a unique tag
# We run the git command from the repo root to be safe
GIT_HASH=$(cd "$REPO_ROOT" && git rev-parse --short HEAD)

# --- Pre-flight Checks ---
# Check if Git hash was found
if [ -z "$GIT_HASH" ]; then
  echo "Error: Could not get Git hash. Are you in a git repository?"
  exit 1
fi

# Check for Docker Hub token
if [ -z "$DOCKER_TOKEN" ]; then
  echo "Error: DOCKER_TOKEN environment variable not set."
  exit 1
fi

# --- Login to Docker Hub ---
echo "Logging in to Docker Hub..."
echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin

# --- Define Image Names ---
BACKEND_IMAGE_NAME="$DOCKER_USER/financeplatform-backend"
FRONTEND_IMAGE_NAME="$DOCKER_USER/financeplatform-frontend"

# --- Build and Push Backend Image ---
echo "Building backend image: $BACKEND_IMAGE_NAME:$GIT_HASH"
# Use the repo root as the build context (.) and specify the Dockerfile path with -f
docker build -t "$BACKEND_IMAGE_NAME:$GIT_HASH" -f "$REPO_ROOT/backend/Dockerfile" "$REPO_ROOT"
docker tag "$BACKEND_IMAGE_NAME:$GIT_HASH" "$BACKEND_IMAGE_NAME:latest"

echo "Pushing backend tags ($GIT_HASH and latest)..."
docker push "$BACKEND_IMAGE_NAME:$GIT_HASH"
docker push "$BACKEND_IMAGE_NAME:latest"

# --- Build and Push Frontend Image ---
echo "Building frontend image: $FRONTEND_IMAGE_NAME:$GIT_HASH"
# Use the repo root as the build context (.) and specify the Dockerfile path with -f
docker build -t "$FRONTEND_IMAGE_NAME:$GIT_HASH" -f "$REPO_ROOT/frontend/Dockerfile" "$REPO_ROOT"
docker tag "$FRONTEND_IMAGE_NAME:$GIT_HASH" "$FRONTEND_IMAGE_NAME:latest"

echo "Pushing frontend tags ($GIT_HASH and latest)..."
docker push "$FRONTEND_IMAGE_NAME:$GIT_HASH"
docker push "$FRONTEND_IMAGE_NAME:latest"

echo "Docker images built and pushed successfully with tag '$GIT_HASH' and 'latest'."