import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { suiteAPI, environmentAPI } from '../services/api';
import './DashboardPage.css';

function DashboardPage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [suites, setSuites] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suitesRes, envsRes] = await Promise.all([
        suiteAPI.getAll(),
        environmentAPI.getAll()
      ]);
      setSuites(suitesRes.data);
      setEnvironments(envsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnvironment = async (suiteId) => {
    try {
      await environmentAPI.create(suiteId);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create environment');
    }
  };

  const handleStartEnvironment = async (id) => {
    try {
      await environmentAPI.start(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to start environment');
    }
  };

  const handleStopEnvironment = async (id) => {
    try {
      await environmentAPI.stop(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to stop environment');
    }
  };

  const handleDeleteEnvironment = async (id) => {
    if (!confirm('Are you sure you want to delete this environment?')) {
      return;
    }

    try {
      await environmentAPI.delete(id);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete environment');
    }
  };

  const handleOpenEnvironment = (env) => {
    const token = localStorage.getItem('token');
    const url = `/proxy/${env.id}/?token=${token}`;
    window.open(url, '_blank');
  };

  const hasEnvironmentForSuite = (suiteId) => {
    return environments.some(env => env.suiteId === suiteId);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>🔥 FireAgentSpace</h1>
            <div className="header-actions">
              <span className="user-info">
                {user?.username} {isAdmin() && <span className="admin-badge">Admin</span>}
              </span>
              {isAdmin() && (
                <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                  Admin Panel
                </button>
              )}
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {error && <div className="error-message">{error}</div>}

          {/* Available Suites */}
          <section className="dashboard-section">
            <h2>Available Agent Suites</h2>
            <div className="suites-grid">
              {suites.map(suite => (
                <div key={suite.id} className="card suite-card">
                  <h3>{suite.name}</h3>
                  <p>{suite.description}</p>
                  <div className="suite-actions">
                    {hasEnvironmentForSuite(suite.id) ? (
                      <button className="btn btn-secondary" disabled>
                        Already Created
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleCreateEnvironment(suite.id)}
                      >
                        Create Environment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* My Environments */}
          <section className="dashboard-section">
            <h2>My Environments</h2>
            {environments.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any environments yet.</p>
                <p>Create one from the available suites above.</p>
              </div>
            ) : (
              <div className="environments-grid">
                {environments.map(env => (
                  <div key={env.id} className="card env-card">
                    <div className="env-header">
                      <h3>{env.suiteName}</h3>
                      <span className={`status-badge status-${env.status}`}>
                        {env.status}
                      </span>
                    </div>
                    <div className="env-info">
                      <p><strong>ID:</strong> {env.id.substring(0, 8)}...</p>
                      <p><strong>Port:</strong> {env.hostPort}</p>
                      <p><strong>Created:</strong> {new Date(env.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="env-actions">
                      {env.status === 'running' ? (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenEnvironment(env)}
                          >
                            Open
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleStopEnvironment(env.id)}
                          >
                            Stop
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() => handleStartEnvironment(env.id)}
                        >
                          Start
                        </button>
                      )}
                      <button
                        className="btn btn-error"
                        onClick={() => handleDeleteEnvironment(env.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
