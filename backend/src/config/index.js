export default {
  // Server Configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Database Configuration
  dbPath: process.env.DB_PATH || './data/db.json',

  // Docker Configuration
  dockerSocketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  baseImage: process.env.BASE_IMAGE || 'fire-agentspace-basic:latest',

  // Workspace Configuration
  workspaceBasePath: process.env.WORKSPACE_PATH || './data/workspaces',

  // Port Range for Containers
  portRangeStart: parseInt(process.env.PORT_RANGE_START) || 30000,
  portRangeEnd: parseInt(process.env.PORT_RANGE_END) || 40000,

  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Rate Limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs
};
