import React, { useState } from 'react';
import api from '../api/client';
import { getErrorMessage, saveSession } from '../App.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setError('');
    setLoading(true);
    try {
      localStorage.removeItem('demo_mode');
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data);
      localStorage.setItem('backend_connected', 'true');
      window.location.hash = '#/';
      window.location.reload();
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin() {
    saveSession({
      token: 'demo-token-attendly',
      user: { id: 1, name: 'Admin (Demo)', email: 'admin@example.com', role: 'admin' },
    });
    localStorage.setItem('demo_mode', 'true');
    window.location.hash = '#/';
    window.location.reload();
  }

  return (
    <div className="login-page">
      <div className="login-art" style={{
        backgroundImage: `linear-gradient(145deg, rgba(10, 24, 48, 0.88), rgba(6, 18, 36, 0.94)), url('/unified_systems_banner.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="login-art-content">
          <img
            src="/unified_systems_logo.png"
            alt="Unified Systems"
            style={{ maxWidth: '280px', height: 'auto', marginBottom: '24px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          />
          <h1>
            Workforce, <em>Empowered.</em>
          </h1>
          <p>Unified Systems official Human Capital Management & Call Center Floor Operations.</p>
          <div className="login-quote">“Precision time-tracking, shift adherence, and intelligent payroll.”</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-brand">
          <img
            src="/unified_systems_logo.png"
            alt="Unified Systems"
            style={{ maxHeight: '42px', width: 'auto', borderRadius: '4px' }}
          />
        </div>
        <p className="eyebrow">Unified Systems Portal</p>
        <h2>Sign in to your console</h2>
        <p className="page-description">Enter your credentials to access operations.</p>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <div className="form-grid">
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              placeholder="Your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? 'Authenticating…' : 'Sign In to Unified Systems →'}
        </button>

        <button type="button" className="button-secondary" style={{ width: '100%', marginTop: '12px', padding: '10px' }} onClick={handleDemoLogin}>
          ⚡ Fast Access (Floor Supervisor Mode)
        </button>
      </form>
    </div>
  );
}
