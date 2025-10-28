#!/bin/bash
set -euo pipefail

IMAGE_NAME="docker.io/ptrusr/rofl-solana-example"
IMAGE_TAG="latest"

echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" app/

echo "Build complete!"
echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"

echo ""
echo "Pushing image to registry..."
docker push "${IMAGE_NAME}:${IMAGE_TAG}"

echo "Push complete!"
