import React, { useState } from 'react';
import { PageHeader, formatExactTime, formatCount } from '../App.jsx';

const MY_LOGS = [
  { id: 1, date: 'Today (Nov 27)', type: 'check_in', time: '2026-11-27T08:52:14', status: 'early', note: '8 mins early', terminal: 'Main Lobby 40i' },
  { id: 2, date: 'Today (Nov 27)', type: 'tea_out', time: '2026-11-27T11:15:02', status: 'on_break', note: 'Morning tea break (12m)', terminal: 'Floor Gate 50i' },
  { id: 3, date: 'Today (Nov 27)', type: 'tea_in', time: '2026-11-27T11:27:10', status: 'on_floor', note: 'Returned to queue on time', terminal: 'Floor Gate 50i' },
  { id: 4, date: 'Yesterday (Nov 26)', type: 'check_in', time: '2026-11-26T08:58:30', status: 'on_time', note: 'On schedule', terminal: 'Main Lobby 40i' },
  { id: 5, date: 'Yesterday (Nov 26)', type: 'lunch_out', time: '2026-11-26T13:00:20', status: 'on_break', note: 'Lunch break (30m)', terminal: 'Floor Gate 50i' },
  { id: 6, date: 'Yesterday (Nov 26)', type: 'lunch_in', time: '2026-11-26T13:29:45', status: 'on_floor', note: 'Returned on schedule', terminal: 'Floor Gate 50i' },
  { id: 7, date: 'Yesterday (Nov 26)', type: 'check_out', time: '2026-11-26T18:05:12', status: 'completed', note: 'Shift complete (+5m OT)', terminal: 'Main Lobby 40i' },
];

export default function EmployeePortal() {
  const [selectedMonth, setSelectedMonth] = useState('November 2026');
  const [logs] = useState(MY_LOGS);

  return (
    <div>
      <PageHeader
        eyebrow="FlowHCM Employee Self-Service (ESS)"
        title="My Daily Attendance & Biometric Punches"
        description="Unified Systems Agent Portal: View your live ZKTeco punch timestamps, shift adherence, and leave balances."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="badge-campaign badge-medicare">Assigned: Medicare Advantage</span>
            <span className="status-pill online">● Active On Floor</span>
          </div>
        }
      />

      {/* Agent Personal KPI summary */}
      <div className="stat-grid">
        <div className="stat-card">
          <span>This Month Present</span>
          <strong style={{ color: '#34d399' }}>21 / 22 Days</strong>
          <small className="stat-note positive">95.4% Attendance score</small>
        </div>
        <div className="stat-card">
          <span>Punctuality Score</span>
          <strong style={{ color: '#38bdf8' }}>98.2%</strong>
          <small className="stat-note positive">0 late arrivals this week</small>
        </div>
        <div className="stat-card">
          <span>Leave Entitlement Balance</span>
          <strong style={{ color: '#fbbf24' }}>14 Days Left</strong>
          <small className="stat-note">Casual: 5 · Sick: 6 · Annual: 3</small>
        </div>
        <div className="stat-card">
          <span>Accumulated Overtime</span>
          <strong style={{ color: '#a78bfa' }}>6.5 Hours</strong>
          <small className="stat-note positive">Approved for payroll cycle</small>
        </div>
      </div>

      {/* Today's Live Clock-In Status */}
      <div className="card" style={{ background: 'linear-gradient(145deg, #101927 0%, #152238 100%)', border: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="eyebrow">Today's Assigned Shift</span>
            <h2 style={{ margin: '4px 0 0', color: '#f8fafc', fontSize: '20px' }}>
              US-Morning Shift: 09:00 AM – 06:00 PM
            </h2>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '13px' }}>
              First hardware punch today: <strong style={{ color: '#34d399' }}>08:52:14 AM</strong> (Main Lobby 40i Terminal) · Status: <strong>Early Clock-In (8 mins ahead)</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="#/leaves" className="button-label" style={{ textDecoration: 'none' }}>
              + Apply For Leave
            </a>
            <a href="#/payroll" className="button-secondary" style={{ textDecoration: 'none' }}>
              📄 View My Payslip
            </a>
          </div>
        </div>
      </div>

      {/* Raw Biometric Punch History */}
      <div className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Biometric Transparency Log</p>
            <h2>My Recent Device Punches (Live ZKTeco Feed)</h2>
          </div>
          <span className="section-meta">Verified Hardware Logs</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch Event</th>
                <th>Exact Timestamp</th>
                <th>Device / Terminal</th>
                <th>Adherence Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.date}</strong></td>
                  <td>
                    <span className="type-badge" style={{
                      background: row.type.includes('in') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: row.type.includes('in') ? '#34d399' : '#38bdf8'
                    }}>
                      {row.type === 'check_in' ? 'Shift Clock In' :
                       row.type === 'check_out' ? 'Shift Clock Out' :
                       row.type === 'tea_out' ? 'Tea Break Exit' :
                       row.type === 'tea_in' ? 'Tea Break Return' :
                       row.type === 'lunch_out' ? 'Lunch Break Exit' : 'Lunch Break Return'}
                    </span>
                  </td>
                  <td>
                    <span className="exact-time-badge">
                      <strong>{formatExactTime(row.time)}</strong>
                      <small>{row.time.slice(0, 10)}</small>
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{row.terminal}</span>
                  </td>
                  <td style={{ color: '#cbd5e1' }}>{row.note}</td>
                  <td>
                    <span className={`status-pill ${row.status === 'early' || row.status === 'on_time' || row.status === 'completed' || row.status === 'on_floor' ? 'online' : 'departure-active'}`}>
                      {row.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
