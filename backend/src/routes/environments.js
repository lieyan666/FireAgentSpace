import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../services/database.js';
import dockerService from '../services/docker.js';
import { authenticate, requireAdmin, checkEnvironmentOwnership } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all environments (admin: all, user: own only)
router.get('/', (req, res) => {
  try {
    const environments = req.user.role === 'admin'
      ? db.getEnvironments()
      : db.getEnvironmentsByUserId(req.user.id);

    res.json(environments);
  } catch (error) {
    console.error('Get environments error:', error);
    res.status(500).json({ error: 'Failed to get environments' });
  }
});

// Get environment by ID
router.get('/:id', checkEnvironmentOwnership, (req, res) => {
  res.json(req.environment);
});

// Create environment
router.post('/', async (req, res) => {
  try {
    const { suiteId } = req.body;

    if (!suiteId) {
      return res.status(400).json({ error: 'Suite ID is required' });
    }

    // Check if suite exists
    const suite = db.getAgentSuiteById(suiteId);
    if (!suite) {
      return res.status(404).json({ error: 'Agent suite not found' });
    }

    // Check if user already has an environment for this suite
    const existingEnv = db.getEnvironmentByUserAndSuite(req.user.id, suiteId);
    if (existingEnv) {
      return res.status(409).json({
        error: 'You already have an environment for this suite',
        environmentId: existingEnv.id
      });
    }

    // Check if base image exists
    const imageExists = await dockerService.imageExists(dockerService.docker.modem.baseImage);
    if (!imageExists) {
      return res.status(500).json({
        error: 'Base image not found. Please build the fire-agentspace-basic image first.'
      });
    }

    // Generate environment ID
    const environmentId = uuidv4();

    // Create Docker container
    const { containerId, hostPort, workspacePath, containerPort } =
      await dockerService.createContainer(environmentId, suite);

    // Create environment record
    const environment = {
      id: environmentId,
      userId: req.user.id,
      suiteId,
      suiteName: suite.name,
      dockerContainerId: containerId,
      status: 'running',
      hostPort,
      containerPort,
      workspacePath,
      createdAt: new Date().toISOString()
    };

    await db.createEnvironment(environment);

    res.status(201).json(environment);
  } catch (error) {
    console.error('Create environment error:', error);
    res.status(500).json({ error: 'Failed to create environment: ' + error.message });
  }
});

// Start environment
router.post('/:id/start', checkEnvironmentOwnership, async (req, res) => {
  try {
    const environment = req.environment;

    if (environment.status === 'running') {
      return res.json({ message: 'Environment is already running', environment });
    }

    await dockerService.startContainer(environment.dockerContainerId);
    const updatedEnv = await db.updateEnvironment(environment.id, { status: 'running' });

    res.json(updatedEnv);
  } catch (error) {
    console.error('Start environment error:', error);
    res.status(500).json({ error: 'Failed to start environment: ' + error.message });
  }
});

// Stop environment
router.post('/:id/stop', checkEnvironmentOwnership, async (req, res) => {
  try {
    const environment = req.environment;

    if (environment.status === 'stopped') {
      return res.json({ message: 'Environment is already stopped', environment });
    }

    await dockerService.stopContainer(environment.dockerContainerId);
    const updatedEnv = await db.updateEnvironment(environment.id, { status: 'stopped' });

    res.json(updatedEnv);
  } catch (error) {
    console.error('Stop environment error:', error);
    res.status(500).json({ error: 'Failed to stop environment: ' + error.message });
  }
});

// Delete environment
router.delete('/:id', checkEnvironmentOwnership, async (req, res) => {
  try {
    const environment = req.environment;

    // Remove Docker container
    await dockerService.removeContainer(environment.dockerContainerId);

    // Delete workspace
    await dockerService.deleteWorkspace(environment.workspacePath);

    // Remove from database
    await db.deleteEnvironment(environment.id);

    res.json({ message: 'Environment deleted successfully' });
  } catch (error) {
    console.error('Delete environment error:', error);
    res.status(500).json({ error: 'Failed to delete environment: ' + error.message });
  }
});

// Get environment status
router.get('/:id/status', checkEnvironmentOwnership, async (req, res) => {
  try {
    const environment = req.environment;
    const status = await dockerService.getContainerStatus(environment.dockerContainerId);

    // Update status in database if different
    if (status !== environment.status) {
      await db.updateEnvironment(environment.id, { status });
    }

    res.json({ status });
  } catch (error) {
    console.error('Get environment status error:', error);
    res.status(500).json({ error: 'Failed to get environment status' });
  }
});

export default router;
