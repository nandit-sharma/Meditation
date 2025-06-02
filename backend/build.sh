#!/bin/bash

echo "Building application..."
cp -r ../*.html ../*.js ../*.css .
npm install
echo "Build complete!"

echo "Creating data directory and file..."
mkdir -p data
touch data/data.json
chmod 666 data/data.json

echo "Starting server..."
node server.js 