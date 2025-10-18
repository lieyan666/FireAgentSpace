#!/bin/bash

echo "╔═══════════════════════════════════════════╗"
echo "║   🔥 FireAgentSpace Initialization 🔥     ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install bcryptjs if not already installed
if [ ! -d "backend/node_modules/bcryptjs" ]; then
    echo "📦 Installing bcryptjs..."
    cd backend
    npm install bcryptjs
    cd ..
fi

# Prompt for admin password
echo "Please enter a password for the admin user:"
read -s ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Password cannot be empty"
    exit 1
fi

# Generate password hash
echo "🔐 Generating password hash..."
HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10));")

# Update db.json
echo "📝 Updating database..."
cat > data/db.json << EOF
{
  "users": [
    {
      "id": "admin-001",
      "username": "admin",
      "password": "$HASH",
      "role": "admin",
      "email": "admin@fireagentspace.com",
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
    }
  ],
  "agentSuites": [
    {
      "id": "suite-001",
      "name": "Data Analysis Suite",
      "description": "Python data analysis environment with Jupyter, pandas, numpy, and visualization tools",
      "initCommand": ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root", "--NotebookApp.token=''"],
      "containerPort": 8888,
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
    },
    {
      "id": "suite-002",
      "name": "Web Development Suite",
      "description": "Node.js web development environment with code-server (VS Code)",
      "initCommand": ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none"],
      "containerPort": 8080,
      "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
    }
  ],
  "environments": []
}
EOF

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║          ✓ Initialization Complete!       ║"
echo "╠═══════════════════════════════════════════╣"
echo "║  Admin username: admin                    ║"
echo "║  Admin password: <your password>          ║"
echo "╠═══════════════════════════════════════════╣"
echo "║  Database initialized at data/db.json     ║"
echo "║  You can now run ./start.sh               ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
