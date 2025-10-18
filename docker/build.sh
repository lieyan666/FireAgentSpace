#!/bin/bash

# Build the FireAgentSpace basic image
echo "Building fire-agentspace-basic:latest image..."

cd "$(dirname "$0")"

docker build -t fire-agentspace-basic:latest -f Dockerfile.basic .

if [ $? -eq 0 ]; then
    echo "✓ Image built successfully!"
    echo "Image name: fire-agentspace-basic:latest"
    docker images | grep fire-agentspace-basic
else
    echo "✗ Build failed!"
    exit 1
fi
