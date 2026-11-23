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
      <div className="login-art">
        <div className="login-art-content">
          <span className="brand-mark">A</span>
          <h1>
            Attendance, <em>made clear.</em>
          </h1>
          <p>One calm workspace for your people, devices, and daily operations.</p>
          <div className="login-quote">“A better view of every working day.”</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>Attendly</strong>
            <small>Operations console</small>
          </div>
        </div>
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in to your workspace</h2>
        <p className="page-description">Use your work account to continue.</p>
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
          {loading ? 'Signing in…' : 'Continue →'}
        </button>

        <button type="button" className="demo-button" onClick={handleDemoLogin}>
          ✨ Explore in Demo Mode (No backend needed)
        </button>

        <small className="login-help">
          Testing frontend-only? Click the demo button to view all pages with sample data.
        </small>
      </form>
    </div>
  );
}
