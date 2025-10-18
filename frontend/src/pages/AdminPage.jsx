import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, suiteAPI, environmentAPI } from '../services/api';
import './AdminPage.css';

function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [suites, setSuites] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'users') {
        const res = await userAPI.getAll();
        setUsers(res.data);
      } else if (activeTab === 'suites') {
        const res = await suiteAPI.getAll();
        setSuites(res.data);
      } else if (activeTab === 'environments') {
        const res = await environmentAPI.getAll();
        setEnvironments(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userAPI.delete(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteSuite = async (id) => {
    if (!confirm('Are you sure you want to delete this suite?')) return;
    try {
      await suiteAPI.delete(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete suite');
    }
  };

  const handleDeleteEnvironment = async (id) => {
    if (!confirm('Are you sure you want to delete this environment?')) return;
    try {
      await environmentAPI.delete(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete environment');
    }
  };

  const handleCreateUser = () => {
    const username = prompt('Enter username:');
    if (!username) return;

    const password = prompt('Enter password:');
    if (!password) return;

    const email = prompt('Enter email (optional):');
    const role = confirm('Is this an admin user?') ? 'admin' : 'user';

    userAPI.create({ username, password, email, role })
      .then(() => loadData())
      .catch(error => alert(error.response?.data?.error || 'Failed to create user'));
  };

  const handleCreateSuite = () => {
    const name = prompt('Enter suite name:');
    if (!name) return;

    const description = prompt('Enter description:');
    const initCommand = prompt('Enter init command (JSON array or string):');
    const containerPort = prompt('Enter container port:');

    if (!initCommand || !containerPort) {
      alert('All fields are required');
      return;
    }

    let parsedCommand;
    try {
      parsedCommand = JSON.parse(initCommand);
    } catch {
      parsedCommand = initCommand;
    }

    suiteAPI.create({
      name,
      description,
      initCommand: parsedCommand,
      containerPort: parseInt(containerPort)
    })
      .then(() => loadData())
      .catch(error => alert(error.response?.data?.error || 'Failed to create suite'));
  };

  return (
    <div className="admin-page">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>🔥 FireAgentSpace - Admin Panel</h1>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          <div className="admin-tabs">
            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`tab ${activeTab === 'suites' ? 'active' : ''}`}
              onClick={() => setActiveTab('suites')}
            >
              Suites
            </button>
            <button
              className={`tab ${activeTab === 'environments' ? 'active' : ''}`}
              onClick={() => setActiveTab('environments')}
            >
              Environments
            </button>
          </div>

          <div className="admin-content">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : (
              <>
                {activeTab === 'users' && (
                  <div>
                    <div className="section-header">
                      <h2>Users Management</h2>
                      <button className="btn btn-primary" onClick={handleCreateUser}>
                        Add User
                      </button>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(user => (
                            <tr key={user.id}>
                              <td>{user.username}</td>
                              <td>{user.email || '-'}</td>
                              <td>
                                <span className={`role-badge role-${user.role}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td>{new Date(user.createdAt).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn-small btn-error"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'suites' && (
                  <div>
                    <div className="section-header">
                      <h2>Agent Suites Management</h2>
                      <button className="btn btn-primary" onClick={handleCreateSuite}>
                        Add Suite
                      </button>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Container Port</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suites.map(suite => (
                            <tr key={suite.id}>
                              <td>{suite.name}</td>
                              <td>{suite.description}</td>
                              <td>{suite.containerPort}</td>
                              <td>{new Date(suite.createdAt).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn-small btn-error"
                                  onClick={() => handleDeleteSuite(suite.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'environments' && (
                  <div>
                    <div className="section-header">
                      <h2>Environments Monitoring</h2>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Environment ID</th>
                            <th>Suite Name</th>
                            <th>User ID</th>
                            <th>Status</th>
                            <th>Port</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {environments.map(env => (
                            <tr key={env.id}>
                              <td>{env.id.substring(0, 8)}...</td>
                              <td>{env.suiteName}</td>
                              <td>{env.userId.substring(0, 8)}...</td>
                              <td>
                                <span className={`status-badge status-${env.status}`}>
                                  {env.status}
                                </span>
                              </td>
                              <td>{env.hostPort}</td>
                              <td>{new Date(env.createdAt).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn-small btn-error"
                                  onClick={() => handleDeleteEnvironment(env.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
