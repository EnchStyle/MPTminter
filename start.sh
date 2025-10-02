#!/bin/bash

# MPT Minter - Quick Start Script

echo "🚀 Starting MPT Minter Development Server..."
echo ""

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🔥 Starting Vite development server..."
npm run dev