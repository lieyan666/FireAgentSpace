import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import config from '../config/index.js';
import db from './database.js';

class DockerService {
  constructor() {
    this.docker = new Docker({ socketPath: config.dockerSocketPath });
  }

  // Get next available port
  getNextAvailablePort() {
    const allocatedPorts = db.getAllocatedPorts();
    for (let port = config.portRangeStart; port <= config.portRangeEnd; port++) {
      if (!allocatedPorts.includes(port)) {
        return port;
      }
    }
    throw new Error('No available ports in range');
  }

  // Create workspace directory
  async createWorkspace(environmentId) {
    const workspacePath = path.join(config.workspaceBasePath, environmentId);
    try {
      await fs.mkdir(workspacePath, { recursive: true });
      console.log(`✓ Workspace created: ${workspacePath}`);
      return workspacePath;
    } catch (error) {
      console.error(`Failed to create workspace:`, error);
      throw error;
    }
  }

  // Create and start container
  async createContainer(environmentId, suite) {
    try {
      // Get available port
      const hostPort = this.getNextAvailablePort();

      // Create workspace
      const workspacePath = await this.createWorkspace(environmentId);
      const absoluteWorkspacePath = path.resolve(workspacePath);

      // Container configuration
      const containerConfig = {
        Image: config.baseImage,
        name: `fire-agent-${environmentId}`,
        Cmd: suite.initCommand,
        ExposedPorts: {
          [`${suite.containerPort}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${suite.containerPort}/tcp`]: [{ HostPort: hostPort.toString() }]
          },
          Binds: [`${absoluteWorkspacePath}:/workspace`],
          AutoRemove: false,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        },
        Env: [
          `WORKSPACE_PATH=/workspace`,
          `ENVIRONMENT_ID=${environmentId}`
        ],
        Labels: {
          'fire-agentspace.environment-id': environmentId,
          'fire-agentspace.managed': 'true'
        }
      };

      // Create container
      const container = await this.docker.createContainer(containerConfig);
      console.log(`✓ Container created: ${container.id.substring(0, 12)}`);

      // Start container
      await container.start();
      console.log(`✓ Container started: ${container.id.substring(0, 12)}`);

      return {
        containerId: container.id,
        hostPort,
        workspacePath,
        containerPort: suite.containerPort
      };
    } catch (error) {
      console.error('Failed to create container:', error);
      throw error;
    }
  }

  // Start container
  async startContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();
      console.log(`✓ Container started: ${containerId.substring(0, 12)}`);
      return true;
    } catch (error) {
      if (error.statusCode === 304) {
        // Container already started
        console.log(`Container already running: ${containerId.substring(0, 12)}`);
        return true;
      }
      console.error('Failed to start container:', error);
      throw error;
    }
  }

  // Stop container
  async stopContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      console.log(`✓ Container stopped: ${containerId.substring(0, 12)}`);
      return true;
    } catch (error) {
      if (error.statusCode === 304) {
        // Container already stopped
        console.log(`Container already stopped: ${containerId.substring(0, 12)}`);
        return true;
      }
      console.error('Failed to stop container:', error);
      throw error;
    }
  }

  // Remove container
  async removeContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);

      // Try to stop first
      try {
        await container.stop();
      } catch (e) {
        // Already stopped, continue
      }

      // Remove container
      await container.remove();
      console.log(`✓ Container removed: ${containerId.substring(0, 12)}`);
      return true;
    } catch (error) {
      console.error('Failed to remove container:', error);
      throw error;
    }
  }

  // Get container status
  async getContainerStatus(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Running ? 'running' : 'stopped';
    } catch (error) {
      console.error('Failed to get container status:', error);
      return 'unknown';
    }
  }

  // Delete workspace
  async deleteWorkspace(workspacePath) {
    try {
      await fs.rm(workspacePath, { recursive: true, force: true });
      console.log(`✓ Workspace deleted: ${workspacePath}`);
      return true;
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw error;
    }
  }

  // Check if image exists
  async imageExists(imageName) {
    try {
      const images = await this.docker.listImages();
      return images.some(img =>
        img.RepoTags && img.RepoTags.some(tag => tag === imageName)
      );
    } catch (error) {
      console.error('Failed to check image:', error);
      return false;
    }
  }
}

// Singleton instance
const dockerService = new DockerService();

export default dockerService;
