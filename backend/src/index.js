import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import db from './services/database.js';
import createEnvironmentProxy from './proxy/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import suiteRoutes from './routes/suites.js';
import environmentRoutes from './routes/environments.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for proxy compatibility
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suites', suiteRoutes);
app.use('/api/environments', environmentRoutes);

// Proxy route for environment access
app.use('/proxy', createEnvironmentProxy());

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize and start server
async function start() {
  try {
    // Initialize database
    await db.init();

    // Start server
    app.listen(config.port, config.host, () => {
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║   🔥 FireAgentSpace Backend Server 🔥    ║');
      console.log('╠═══════════════════════════════════════════╣');
      console.log(`║  Server running on: http://${config.host}:${config.port}     ║`);
      console.log(`║  Health check:      /health               ║`);
      console.log(`║  API endpoint:      /api                  ║`);
      console.log(`║  Proxy endpoint:    /proxy/:envId         ║`);
      console.log('╚═══════════════════════════════════════════╝');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
start();
