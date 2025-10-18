#!/bin/bash

echo "╔═══════════════════════════════════════════╗"
echo "║   🔥 FireAgentSpace Setup & Start 🔥      ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if base image exists
if ! docker images | grep -q "fire-agentspace-basic"; then
    echo "⚠️  Base Docker image not found. Building it now..."
    cd docker
    chmod +x build.sh
    ./build.sh
    cd ..

    if [ $? -ne 0 ]; then
        echo "❌ Failed to build Docker image"
        exit 1
    fi
else
    echo "✓ Docker base image found"
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
else
    echo "✓ Backend dependencies installed"
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "✓ Frontend dependencies installed"
fi

# Check if db.json exists
if [ ! -f "data/db.json" ]; then
    echo "❌ Error: data/db.json not found. Please create it first."
    exit 1
else
    echo "✓ Database file found"
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║          Starting Services...             ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Start backend in background
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "🚀 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║          ✓ Services Started!              ║"
echo "╠═══════════════════════════════════════════╣"
echo "║  Backend:  http://localhost:3000          ║"
echo "║  Frontend: http://localhost:5173          ║"
echo "╠═══════════════════════════════════════════╣"
echo "║  Press Ctrl+C to stop all services        ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Handle Ctrl+C to stop both processes
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT

# Wait for processes
wait
