import fs from 'fs/promises';
import path from 'path';
import config from '../config/index.js';

class Database {
  constructor() {
    this.dbPath = path.resolve(config.dbPath);
    this.data = null;
  }

  async init() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf8');
      this.data = JSON.parse(data);
      console.log('✓ Database loaded successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Database file not found, creating new one...');
        this.data = { users: [], agentSuites: [], environments: [] };
        await this.save();
      } else {
        console.error('Failed to load database:', error);
        throw error;
      }
    }
  }

  async save() {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save database:', error);
      throw error;
    }
  }

  // User operations
  getUsers() {
    return this.data.users;
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(username) {
    return this.data.users.find(u => u.username === username);
  }

  async createUser(user) {
    this.data.users.push(user);
    await this.save();
    return user;
  }

  async updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    await this.save();
    return this.data.users[index];
  }

  async deleteUser(id) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    await this.save();
    return true;
  }

  // Agent Suite operations
  getAgentSuites() {
    return this.data.agentSuites;
  }

  getAgentSuiteById(id) {
    return this.data.agentSuites.find(s => s.id === id);
  }

  async createAgentSuite(suite) {
    this.data.agentSuites.push(suite);
    await this.save();
    return suite;
  }

  async updateAgentSuite(id, updates) {
    const index = this.data.agentSuites.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.data.agentSuites[index] = { ...this.data.agentSuites[index], ...updates };
    await this.save();
    return this.data.agentSuites[index];
  }

  async deleteAgentSuite(id) {
    const index = this.data.agentSuites.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.data.agentSuites.splice(index, 1);
    await this.save();
    return true;
  }

  // Environment operations
  getEnvironments() {
    return this.data.environments;
  }

  getEnvironmentById(id) {
    return this.data.environments.find(e => e.id === id);
  }

  getEnvironmentsByUserId(userId) {
    return this.data.environments.filter(e => e.userId === userId);
  }

  getEnvironmentByUserAndSuite(userId, suiteId) {
    return this.data.environments.find(e => e.userId === userId && e.suiteId === suiteId);
  }

  async createEnvironment(environment) {
    this.data.environments.push(environment);
    await this.save();
    return environment;
  }

  async updateEnvironment(id, updates) {
    const index = this.data.environments.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.data.environments[index] = { ...this.data.environments[index], ...updates };
    await this.save();
    return this.data.environments[index];
  }

  async deleteEnvironment(id) {
    const index = this.data.environments.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.data.environments.splice(index, 1);
    await this.save();
    return true;
  }

  // Utility: Get allocated ports
  getAllocatedPorts() {
    return this.data.environments.map(e => e.hostPort).filter(Boolean);
  }
}

// Singleton instance
const db = new Database();

export default db;
