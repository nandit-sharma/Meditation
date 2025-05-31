#!/bin/bash

echo "Installing dependencies..."
npm install

echo "Creating data directory and file..."
mkdir -p data
touch data/data.json
chmod 666 data/data.json

echo "Starting server..."
node server.js 