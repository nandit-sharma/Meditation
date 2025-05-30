#!/bin/bash

echo "Installing dependencies..."
npm install

echo "Creating data directory and file..."
mkdir -p data
touch data.json
chmod 666 data.json

echo "Starting server..."
node server.js 