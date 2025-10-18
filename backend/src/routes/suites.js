import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../services/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all agent suites (available to all users)
router.get('/', (req, res) => {
  const suites = db.getAgentSuites();
  res.json(suites);
});

// Get suite by ID (available to all users)
router.get('/:id', (req, res) => {
  const suite = db.getAgentSuiteById(req.params.id);
  if (!suite) {
    return res.status(404).json({ error: 'Agent suite not found' });
  }
  res.json(suite);
});

// Create agent suite (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, initCommand, containerPort } = req.body;

    if (!name || !initCommand || !containerPort) {
      return res.status(400).json({
        error: 'Name, initCommand, and containerPort are required'
      });
    }

    const suite = {
      id: uuidv4(),
      name,
      description: description || '',
      initCommand: Array.isArray(initCommand) ? initCommand : [initCommand],
      containerPort: parseInt(containerPort),
      createdAt: new Date().toISOString()
    };

    await db.createAgentSuite(suite);
    res.status(201).json(suite);
  } catch (error) {
    console.error('Create suite error:', error);
    res.status(500).json({ error: 'Failed to create agent suite' });
  }
});

// Update agent suite (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, initCommand, containerPort } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (initCommand) {
      updates.initCommand = Array.isArray(initCommand) ? initCommand : [initCommand];
    }
    if (containerPort) updates.containerPort = parseInt(containerPort);

    const suite = await db.updateAgentSuite(req.params.id, updates);
    if (!suite) {
      return res.status(404).json({ error: 'Agent suite not found' });
    }

    res.json(suite);
  } catch (error) {
    console.error('Update suite error:', error);
    res.status(500).json({ error: 'Failed to update agent suite' });
  }
});

// Delete agent suite (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteAgentSuite(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Agent suite not found' });
    }

    res.json({ message: 'Agent suite deleted successfully' });
  } catch (error) {
    console.error('Delete suite error:', error);
    res.status(500).json({ error: 'Failed to delete agent suite' });
  }
});

export default router;
