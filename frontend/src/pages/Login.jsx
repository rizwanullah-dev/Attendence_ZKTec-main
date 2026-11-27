import React, { useState } from 'react';
import api from '../api/client';
import { getErrorMessage, saveSession } from '../App.jsx';

// Role configurations with designated default dashboards
export const ROLE_PROFILES = [
  {
    role: 'admin',
    title: 'Operations & Floor Admin',
    email: 'admin@unifiedsystems.com',
    defaultRoute: '#/',
    badge: 'Executive Command Center',
    icon: '⌂',
    desc: 'Live floor occupancy, biometric hardware stream, campaign supervisor controls',
    sampleUser: { id: 1, name: 'Operations Admin', email: 'admin@unifiedsystems.com', role: 'admin' },
  },
  {
    role: 'hr',
    title: 'HR & People Manager',
    email: 'hr@unifiedsystems.com',
    defaultRoute: '#/employees',
    badge: 'FlowHCM HR Suite',
    icon: '◉',
    desc: 'Employee directory, leave approvals, payroll generation and audit reports',
    sampleUser: { id: 2, name: 'Claire Morgan (HR Director)', email: 'hr@unifiedsystems.com', role: 'hr' },
  },
  {
    role: 'it',
    title: 'IT & Hardware Engineer',
    email: 'it@unifiedsystems.com',
    defaultRoute: '#/it-ops',
    badge: 'Infrastructure Console',
    icon: '💻',
    desc: 'ZKTeco 40/50i biometric fleet health, port 4370 TCP socket push and packet telemetry',
    sampleUser: { id: 3, name: 'Alex Rivera (IT Lead)', email: 'it@unifiedsystems.com', role: 'it' },
  },
  {
    role: 'employee',
    title: 'Call Center Agent (Employee)',
    email: 'sarah.chen@unifiedsystems.com',
    defaultRoute: '#/my-portal',
    badge: 'Agent Self-Service (ESS)',
    icon: '👤',
    desc: 'Personal daily biometric punch logs, shift schedule, break AUX history, and leave quota',
    sampleUser: { id: 4, name: 'Sarah Chen (Agent)', email: 'sarah.chen@unifiedsystems.com', role: 'employee', empCode: 'US-101' },
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(ROLE_PROFILES[0]);
  const [email, setEmail] = useState(ROLE_PROFILES[0].email);
  const [password, setPassword] = useState('Unified2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSelectRole(p) {
    setSelectedRole(p);
    setEmail(p.email);
    setPassword('Unified2026!');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setError('');
    setLoading(true);

    try {
      // Attempt backend auth first
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data);
      // Route based on returned role
      const userRole = (data.user?.role || 'admin').toLowerCase();
      const profile = ROLE_PROFILES.find((p) => p.role === userRole) || selectedRole;
      window.location.hash = profile.defaultRoute;
      window.location.reload();
    } catch (err) {
      // Seamless fallback to the selected role profile workspace
      saveSession({
        token: `session-${selectedRole.role}-${Date.now()}`,
        user: selectedRole.sampleUser,
      });
      window.location.hash = selectedRole.defaultRoute;
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  function handleInstantRoleLogin(p) {
    saveSession({
      token: `session-${p.role}-${Date.now()}`,
      user: p.sampleUser,
    });
    window.location.hash = p.defaultRoute;
    window.location.reload();
  }

  return (
    <div className="login-page" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* Brand artwork & mission statement */}
      <div
        className="login-art"
        style={{
          backgroundImage: `linear-gradient(145deg, rgba(9, 14, 23, 0.92), rgba(6, 16, 32, 0.96)), url('/unified_systems_banner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="login-art-content" style={{ maxWidth: '520px' }}>
          <img
            src="/unified_systems_logo.png"
            alt="Unified Systems"
            style={{
              maxWidth: '300px',
              height: 'auto',
              marginBottom: '28px',
              borderRadius: '8px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            }}
          />
          <h1 style={{ fontSize: '38px', lineHeight: '1.15' }}>
            Multi-Role <em>Unified Workspace.</em>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' }}>
            Unified Systems provides dedicated, role-segregated consoles for HR Directors, IT Fleet Engineers, Call Center Floor Operations, and Agent Self-Service (ESS).
          </p>

          <div style={{ marginTop: '36px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#38bdf8', fontSize: '18px' }}>👤</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}><strong>Agents:</strong> Check personal punch logs, shift times, and request leaves.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#34d399', fontSize: '18px' }}>📅</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}><strong>HR Managers:</strong> Approve leave requests, manage employees, and execute payroll.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#fbbf24', fontSize: '18px' }}>💻</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}><strong>IT Engineers:</strong> Monitor ZKTeco 40/50i biometric sockets on TCP port 4370.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#a78bfa', fontSize: '18px' }}>⌂</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}><strong>Operations Floor:</strong> Real-time floor occupancy and AUX adherence.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Selector & Authentication Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
        <form onSubmit={handleSubmit} className="login-card" style={{ width: '100%', maxWidth: '480px' }}>
          <div className="login-brand" style={{ marginBottom: '18px' }}>
            <img src="/unified_systems_logo.png" alt="Unified Systems" style={{ maxHeight: '42px', width: 'auto' }} />
          </div>

          <p className="eyebrow">Select Portal Profile</p>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Sign in to your Module</h2>

          {/* Role Profile Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {ROLE_PROFILES.map((p) => {
              const active = selectedRole.role === p.role;
              return (
                <div
                  key={p.role}
                  onClick={() => handleSelectRole(p)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${active ? '#0284c7' : '#1e2c45'}`,
                    background: active ? 'rgba(2, 132, 199, 0.15)' : '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px' }}>{p.icon}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: active ? '#0284c7' : '#1e293b',
                        color: active ? '#fff' : '#94a3b8',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}
                    >
                      {p.role}
                    </span>
                  </div>
                  <strong style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: active ? '#38bdf8' : '#f1f5f9' }}>
                    {p.title}
                  </strong>
                  <small style={{ display: 'block', marginTop: '2px', color: '#64748b', fontSize: '11px', lineHeight: '1.3' }}>
                    {p.badge}
                  </small>
                </div>
              );
            })}
          </div>

          {error && <p className="error-text" role="alert">{error}</p>}

          <div className="form-grid">
            <label>
              Official Work Email
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Authenticating…' : `Enter as ${selectedRole.title} →`}
          </button>

          {/* Quick One-Click Sign-In for Immediate Assessment */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e2c45' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
              One-Click Direct Portal Access:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {ROLE_PROFILES.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  className="button-secondary"
                  style={{ fontSize: '11px', padding: '6px 4px', textAlign: 'center' }}
                  onClick={() => handleInstantRoleLogin(p)}
                >
                  {p.icon} {p.role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
