#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Installing server dependencies..."
cd server
npm install
cd ..

echo "Installing client dependencies..."
cd client
npm install
cd ..

echo "Build complete!"
