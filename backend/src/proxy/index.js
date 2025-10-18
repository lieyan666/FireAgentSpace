import { createProxyMiddleware } from 'http-proxy-middleware';
import db from '../services/database.js';
import { verifyToken } from '../middleware/auth.js';

// Proxy middleware for environment access
export function createEnvironmentProxy() {
  return async (req, res, next) => {
    try {
      // Extract environment ID from URL: /proxy/:environmentId/*
      const pathMatch = req.path.match(/^\/proxy\/([^\/]+)(\/.*)?$/);

      if (!pathMatch) {
        return res.status(400).json({ error: 'Invalid proxy path' });
      }

      const environmentId = pathMatch[1];
      const remainingPath = pathMatch[2] || '/';

      // Get token from header or cookie
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.cookies?.token;

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify token
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Get environment
      const environment = db.getEnvironmentById(environmentId);
      if (!environment) {
        return res.status(404).json({ error: 'Environment not found' });
      }

      // Check ownership (admin can access any environment)
      if (decoded.role !== 'admin' && environment.userId !== decoded.id) {
        return res.status(403).json({
          error: 'Access denied: You do not own this environment'
        });
      }

      // Check if environment is running
      if (environment.status !== 'running') {
        return res.status(503).json({
          error: 'Environment is not running',
          status: environment.status
        });
      }

      // Create proxy for this specific environment
      const proxy = createProxyMiddleware({
        target: `http://localhost:${environment.hostPort}`,
        changeOrigin: true,
        pathRewrite: {
          [`^/proxy/${environmentId}`]: ''
        },
        ws: true, // Enable WebSocket proxy
        onError: (err, req, res) => {
          console.error('Proxy error:', err);
          res.status(502).json({
            error: 'Bad gateway: Failed to connect to environment',
            details: err.message
          });
        },
        onProxyReq: (proxyReq, req, res) => {
          // Log proxy request
          console.log(`[Proxy] ${req.method} ${req.path} -> http://localhost:${environment.hostPort}${remainingPath}`);
        }
      });

      return proxy(req, res, next);
    } catch (error) {
      console.error('Proxy middleware error:', error);
      res.status(500).json({ error: 'Proxy error: ' + error.message });
    }
  };
}

export default createEnvironmentProxy;
