# 🔥 FireAgentSpace

**FireAgentSpace** is a multi-user cloud development platform that allows users to run pre-configured AI Agent development suites in isolated Docker containers.

## 📋 Project Overview

FireAgentSpace provides:
- **Multi-user support** with role-based access control (Admin/User)
- **Isolated Docker environments** for each user and agent suite
- **Persistent workspaces** for data storage
- **Built-in reverse proxy** for secure container access
- **Modern React dashboard** for environment management

## 🏗️ Architecture

```
FireAgentSpace/
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── config/    # Configuration
│   │   ├── models/    # Data models
│   │   ├── routes/    # API routes
│   │   ├── middleware/# Auth & middleware
│   │   ├── services/  # Business logic
│   │   ├── proxy/     # Reverse proxy
│   │   └── index.js   # Entry point
│   └── package.json
├── frontend/          # React dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── styles/
│   └── package.json
├── docker/            # Docker images
│   ├── Dockerfile.basic
│   └── build.sh
└── data/              # Data storage
    ├── db.json        # JSON database
    └── workspaces/    # User workspaces
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** (with Docker daemon running)
- **npm** or **yarn**

### 1. Build the Base Docker Image

First, build the `fire-agentspace-basic` image:

```bash
cd docker
chmod +x build.sh
./build.sh
```

This will create a base image with:
- Ubuntu 24.04 (with Chinese mirrors)
- Python 3 with virtual environment
- Jupyter Lab and data analysis packages (pandas, numpy, matplotlib, etc.)
- Node.js LTS
- code-server (VS Code in browser)

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Initialize Database

Create initial admin user. Edit `data/db.json` and hash a password for the admin user:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
```

Copy the hash and replace the password in `data/db.json`:

```json
{
  "users": [
    {
      "id": "admin-001",
      "username": "admin",
      "password": "<paste-hash-here>",
      "role": "admin",
      "email": "admin@fireagentspace.com",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "agentSuites": [...],
  "environments": []
}
```

### 5. Start the Backend Server

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3000`

### 6. Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### 7. Access the Platform

1. Open `http://localhost:5173` in your browser
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Start creating environments!

## 📖 Usage Guide

### For Users

1. **View Available Suites:** Browse pre-configured agent suites
2. **Create Environment:** Click "Create Environment" for any suite (one per suite per user)
3. **Manage Environments:**
   - **Start:** Start a stopped environment
   - **Stop:** Stop a running environment
   - **Open:** Access the environment's web interface
   - **Delete:** Remove the environment and its data

### For Admins

Access the Admin Panel to:
- **Manage Users:** Create, view, and delete users
- **Manage Suites:** Create, view, and delete agent suites
- **Monitor Environments:** View all environments across all users

### Creating Custom Agent Suites

Admins can create custom suites with:
- **Name:** Display name
- **Description:** What the suite does
- **Init Command:** Command to run in container (e.g., `["jupyter", "lab", "--ip=0.0.0.0"]`)
- **Container Port:** Port the service listens on

## 🔧 Configuration

Backend configuration is in `backend/src/config/index.js`:

```javascript
{
  port: 3000,                    // API server port
  jwtSecret: 'change-me',        // JWT secret for auth
  portRangeStart: 30000,         // Start of port range for containers
  portRangeEnd: 40000,           // End of port range
  workspaceBasePath: './data/workspaces'  // Workspace storage path
}
```

## 🛡️ Security Features

- **JWT Authentication:** Secure token-based auth
- **Role-based Access Control:** Admin vs User permissions
- **Environment Ownership Check:** Users can only access their own environments
- **Reverse Proxy with Auth:** All environment access is authenticated
- **Rate Limiting:** Protection against abuse

## 🐳 Docker Architecture

Each environment runs in an isolated Docker container with:
- **Base Image:** `fire-agentspace-basic:latest`
- **Port Mapping:** Dynamic port allocation (30000-40000)
- **Volume Mount:** Persistent workspace at `/workspace`
- **Auto-restart:** Containers restart unless stopped by user
- **Resource Isolation:** Each container is isolated from others

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Agent Suites
- `GET /api/suites` - List all suites
- `POST /api/suites` - Create suite (admin only)
- `DELETE /api/suites/:id` - Delete suite (admin only)

### Environments
- `GET /api/environments` - List environments
- `POST /api/environments` - Create environment
- `POST /api/environments/:id/start` - Start environment
- `POST /api/environments/:id/stop` - Stop environment
- `DELETE /api/environments/:id` - Delete environment

### Proxy
- `/proxy/:environmentId/*` - Reverse proxy to environment

## 🎨 UI Design

- **Primary Color:** `#018eee` (Blue)
- **Design Philosophy:** Modern, clean, minimal
- **Responsive:** Works on desktop and mobile
- **Dark Mode:** Automatically adapts to system preference

## 🔍 Troubleshooting

### Container Won't Start
- Check if Docker daemon is running: `docker ps`
- Check if base image exists: `docker images | grep fire-agentspace-basic`
- Check container logs: `docker logs <container-id>`

### Port Already in Use
- The platform automatically allocates ports from the configured range
- If all ports are in use, delete unused environments or expand the port range

### Database Issues
- The JSON database is stored in `data/db.json`
- Backup this file regularly
- If corrupted, restore from backup or recreate

## 📝 Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production

Frontend:
```bash
cd frontend
npm run build
# Built files will be in frontend/dist/
```

Backend:
```bash
# Backend is ready for production as-is
# Just ensure NODE_ENV=production
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, Node.js, Express, and Docker
- Uses Jupyter Lab and code-server for development environments
- Inspired by cloud workspace platforms like Gitpod and CodeSandbox

---

**Made with 🔥 by FireAgentSpace Team**
