import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import Devices from './pages/Devices.jsx';
import { isDemoMode } from './api/client';

export const isLoggedIn = () => Boolean(localStorage.getItem('token'));
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.error || error?.message || fallback;
export const formatDate = (value, options) =>
  value ? new Date(value).toLocaleString(undefined, options) : '—';
export const humanize = (value) =>
  String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const formatExactTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

export const formatExactDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return `${dateStr} · ${timeStr}`;
};

export const getCampaignBadgeClass = (campaign) => {
  const c = String(campaign || '').toLowerCase();
  if (c.includes('medicare')) return 'badge-medicare';
  if (c.includes('aca')) return 'badge-aca';
  if (c.includes('final') || c.includes('expense')) return 'badge-fe';
  return 'badge-general';
};

export const formatPunchType = (type) => {
  const map = {
    check_in: 'Shift Clock In',
    shift_in: 'Shift Clock In',
    check_out: 'Shift Clock Out',
    shift_out: 'Shift Clock Out',
    break_start: 'Tea Break Out',
    break_end: 'Tea Break In',
    lunch_start: 'Lunch Break Out',
    lunch_end: 'Lunch Break In',
    coaching: 'Coaching / Training',
    meeting: 'Meeting / Huddle',
  };
  return map[type] || humanize(type);
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};
export const saveSession = (data) => {
  localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
};
export const getToday = () => new Date().toISOString().slice(0, 10);
export const getMonthStart = () => `${getToday().slice(0, 8)}01`;
export const isValidDateRange = (start, end) => Boolean(start && end && start <= end);
export const formatCount = (value) => new Intl.NumberFormat().format(Number(value) || 0);
export const formatStatus = humanize;
export const statusClass = (value) => `status-${String(value || 'unknown').toLowerCase()}`;
export const safeArray = (value) => (Array.isArray(value) ? value : []);
export const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
export const getUserRole = () => getStoredUser()?.role || 'viewer';
export const getUserName = () =>
  getStoredUser()?.name || getStoredUser()?.email?.split('@')[0] || 'there';
export const initials = (value = '') =>
  value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';
export const getUserInitials = () => initials(getUserName());
export const getApiUrl = () => import.meta.env.VITE_API_URL || '/api';
export const usePageTitle = (title) =>
  useEffect(() => {
    document.title = `${title} · Attendly`;
  }, [title]);
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('demo_mode');
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="feedback error" style={{ margin: '40px auto', maxWidth: '520px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'A component error occurred.'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            ↻ Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = getStoredUser();
  const demoActive = isDemoMode();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  const links = [
    ['/', '⌂', 'Floor Dashboard'],
    ['/attendance', '✓', 'Live Punches & AUX'],
    ['/employees', '◉', 'Agent Roster'],
    ['/reports', '▥', 'Campaign Reports'],
    ['/devices', '⌁', 'Biometric Devices'],
  ];

  function logout() {
    clearSession();
    window.location.hash = '#/login';
    window.location.reload();
  }

  return (
    <div className="layout">
      <button
        className="menu-toggle"
        aria-label="Toggle navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        ☰
      </button>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">CC</span>
          <div>
            <strong>CallCenter Ops</strong>
            <small>Medicare · ACA · Final Exp</small>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {links.map(([path, icon, label]) => (
            <NavLink key={path} to={path} end={path === '/'}>
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{initials(user?.name || user?.email || 'A')}</span>
            <span>
              <strong>{user?.name || user?.email?.split('@')[0] || 'Admin'}</strong>
              <small>{humanize(user?.role || 'viewer')}</small>
            </span>
          </div>
          <button className="logout-button" onClick={logout}>
            ↪ Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        {demoActive && (
          <div className="demo-banner">
            <span>💡 <strong>Offline Preview Mode</strong>: Backend is currently inactive; displaying mock data.</span>
          </div>
        )}
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow = 'Workspace', title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Feedback({ loading, error, empty, children }) {
  if (loading) return <div className="feedback">Loading…</div>;
  if (error) return <div className="feedback error" role="alert">{error}</div>;
  if (empty) return <div className="feedback">{children || 'No records found.'}</div>;
  return null;
}

export function EmptyRow({ colSpan, children = 'No records found.' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        {children}
      </td>
    </tr>
  );
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Layout>
                <Dashboard />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/employees"
          element={
            <Protected>
              <Layout>
                <Employees />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/attendance"
          element={
            <Protected>
              <Layout>
                <Attendance />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/reports"
          element={
            <Protected>
              <Layout>
                <Reports />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/devices"
          element={
            <Protected>
              <Layout>
                <Devices />
              </Layout>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export { Layout };
