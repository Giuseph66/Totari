#!/bin/bash

# Setup script for Totari mobile app

echo "Installing dependencies for Totari mobile app..."

# Install npm dependencies
npm install

echo "Dependencies installed successfully!"

echo "To run the app:"
echo "1. Copy env.example to .env and update the values"
echo "2. Run 'npx expo start' to start the development server"

echo "To run tests:"
echo "1. Run 'npm test' to execute tests"