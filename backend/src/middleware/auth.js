import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import db from '../services/database.js';

// Generate JWT token
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Authentication middleware
export function authenticate(req, res, next) {
  try {
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

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Admin role check middleware
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Environment ownership check middleware
export function checkEnvironmentOwnership(req, res, next) {
  const environmentId = req.params.id || req.params.environmentId;

  if (!environmentId) {
    return res.status(400).json({ error: 'Environment ID required' });
  }

  const environment = db.getEnvironmentById(environmentId);

  if (!environment) {
    return res.status(404).json({ error: 'Environment not found' });
  }

  // Allow admin to access any environment
  if (req.user.role === 'admin') {
    req.environment = environment;
    return next();
  }

  // Check if user owns the environment
  if (environment.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: You do not own this environment' });
  }

  req.environment = environment;
  next();
}
