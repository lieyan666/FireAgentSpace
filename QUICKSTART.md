# 🚀 Quick Start Guide

## Step 1: Initialize the Project

Run the initialization script to set up the admin password and database:

```bash
./init.sh
```

This will prompt you to enter a password for the admin user and create the initial `data/db.json` file.

## Step 2: Start the Application

Run the start script to launch both backend and frontend:

```bash
./start.sh
```

This script will:
1. Check if Docker is running
2. Build the base Docker image if needed
3. Install dependencies if needed
4. Start the backend server (port 3000)
5. Start the frontend server (port 5173)

## Step 3: Access the Platform

Open your browser and go to:
```
http://localhost:5173
```

Login with:
- **Username:** `admin`
- **Password:** `<your password>`

## What's Next?

### For Users
1. Browse available agent suites
2. Create your first environment
3. Start and access your environment

### For Admins
1. Go to Admin Panel
2. Create additional users
3. Add custom agent suites
4. Monitor all environments

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Build Docker Image
```bash
cd docker
./build.sh
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Create Database
Create `data/db.json` manually or use the init script.

### 4. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Troubleshooting

### Docker not running
```bash
# Start Docker Desktop or Docker daemon
sudo systemctl start docker  # Linux
```

### Port conflicts
Change ports in:
- Backend: `backend/src/config/index.js`
- Frontend: `frontend/vite.config.js`

### Permission issues
```bash
chmod +x init.sh start.sh docker/build.sh
```

## Project Structure

```
FireAgentSpace/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   ├── proxy/        # Reverse proxy
│   │   └── index.js      # Entry point
│   └── package.json
├── frontend/             # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── services/     # API calls
│   │   ├── context/      # React context
│   │   └── styles/       # CSS styles
│   └── package.json
├── docker/               # Docker files
│   ├── Dockerfile.basic  # Base image
│   └── build.sh          # Build script
├── data/                 # Data storage
│   ├── db.json           # Database
│   └── workspaces/       # User workspaces
├── init.sh               # Initialization script
├── start.sh              # Start script
└── README.md             # Full documentation
```

## API Endpoints

- **Auth:** `/api/auth/login`, `/api/auth/register`
- **Users:** `/api/users/*`
- **Suites:** `/api/suites/*`
- **Environments:** `/api/environments/*`
- **Proxy:** `/proxy/:environmentId/*`

For full API documentation, see [README.md](README.md).

## Support

For issues and questions, please check the main README.md or create an issue.

---

**Happy coding with FireAgentSpace! 🔥**
