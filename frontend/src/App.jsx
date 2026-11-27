import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import Devices from './pages/Devices.jsx';
import BreakMonitor from './pages/BreakMonitor.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Shifts from './pages/Shifts.jsx';
import Leaves from './pages/Leaves.jsx';
import Payroll from './pages/Payroll.jsx';
import EmployeePortal from './pages/EmployeePortal.jsx';
import ITOps from './pages/ITOps.jsx';
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
    document.title = `${title} · Unified Systems`;
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

function RoleRouteGuard({ allowedRoles, children }) {
  const user = getStoredUser();
  const role = (user?.role || 'admin').toLowerCase();
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'employee' || role === 'agent') return <Navigate to="/my-portal" replace />;
    if (role === 'it' || role === 'tech') return <Navigate to="/it-ops" replace />;
    if (role === 'hr') return <Navigate to="/employees" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function HomeRouteRedirect() {
  const user = getStoredUser();
  const role = (user?.role || 'admin').toLowerCase();
  if (role === 'employee' || role === 'agent') return <Navigate to="/my-portal" replace />;
  if (role === 'it' || role === 'tech') return <Navigate to="/it-ops" replace />;
  if (role === 'hr') return <Navigate to="/employees" replace />;
  return <Dashboard />;
}

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = getStoredUser();
  const demoActive = isDemoMode();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  const userRole = (user?.role || 'admin').toLowerCase();

  // Strict role-based navigation links:
  // ONLY relevant items are included per role, zero cross-module clutter.
  let links = [];
  if (userRole === 'employee' || userRole === 'agent') {
    links = [
      ['/my-portal', '👤', 'My Attendance & Punches'],
      ['/leaves', '📅', 'Apply for Leave'],
      ['/payroll', '💵', 'My Payslip & Salary'],
    ];
  } else if (userRole === 'it' || userRole === 'tech') {
    links = [
      ['/it-ops', '💻', 'IT Hardware Console'],
      ['/devices', '⌁', 'ZKTeco Terminals Fleet'],
      ['/attendance', '✓', 'Raw Punch Stream'],
    ];
  } else if (userRole === 'hr') {
    links = [
      ['/employees', '◉', 'Employee Management'],
      ['/leaves', '📅', 'Leave Approvals'],
      ['/payroll', '💵', 'Payroll & Deductions'],
      ['/reports', '▥', 'Attendance Reports'],
    ];
  } else {
    // Admin / Floor Operations Leadership
    links = [
      ['/', '⌂', 'Floor Command Center'],
      ['/attendance', '✓', 'Live Punches & AUX'],
      ['/breaks', '☕', 'Break Time Monitor'],
      ['/leaderboard', '🏆', 'Adherence Leaderboard'],
      ['/shifts', '⏱', 'Campaign Shift Schedules'],
      ['/employees', '◉', 'Employee Management'],
      ['/leaves', '📅', 'FlowHCM Leaves'],
      ['/payroll', '💵', 'FlowHCM Payroll'],
      ['/reports', '▥', 'Campaign Reports'],
      ['/devices', '⌁', 'Biometric Devices'],
    ];
  }

  function switchRole(newRole) {
    const updated = { ...(user || { name: 'Unified User', email: 'user@unifiedsystems.com' }), role: newRole };
    localStorage.setItem('user', JSON.stringify(updated));
    window.location.reload();
  }

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
          <img
            src="/unified_systems_logo.png"
            alt="Unified Systems"
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="brand-text-fallback">
            <strong>Unified Systems</strong>
            <small style={{ color: '#38bdf8', fontWeight: 600 }}>
              {userRole === 'employee' || userRole === 'agent' ? 'Agent Self-Service (ESS)' :
               userRole === 'hr' ? 'HR Operations & People' :
               userRole === 'it' || userRole === 'tech' ? 'IT Infrastructure Console' :
               'Floor Command Center'}
            </small>
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
              <strong>{user?.name || user?.email?.split('@')[0] || 'User'}</strong>
              <small>{humanize(user?.role || 'admin')} Portal</small>
            </span>
          </div>
          <button className="logout-button" onClick={logout}>
            ↪ Switch Role / Sign out
          </button>
        </div>
      </aside>
      <main className="main">
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
                <HomeRouteRedirect />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/employees"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'hr']}>
                <Layout>
                  <Employees />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/attendance"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'hr', 'it']}>
                <Layout>
                  <Attendance />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/breaks"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin']}>
                <Layout>
                  <BreakMonitor />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <Protected>
              <Layout>
                <Leaderboard />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/shifts"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'hr']}>
                <Layout>
                  <Shifts />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/my-portal"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['employee', 'agent', 'admin']}>
                <Layout>
                  <EmployeePortal />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/it-ops"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['it', 'tech', 'admin']}>
                <Layout>
                  <ITOps />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/leaves"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'hr', 'employee', 'agent']}>
                <Layout>
                  <Leaves />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/payroll"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'hr', 'employee', 'agent']}>
                <Layout>
                  <Payroll />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/reports"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'hr']}>
                <Layout>
                  <Reports />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route
          path="/devices"
          element={
            <Protected>
              <RoleRouteGuard allowedRoles={['admin', 'it']}>
                <Layout>
                  <Devices />
                </Layout>
              </RoleRouteGuard>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export { Layout };
