import React, { useState } from 'react';
import { PageHeader, Feedback, formatCount, getStoredUser } from '../App.jsx';

const INITIAL_LEAVES = [
  { id: 1, empName: 'Sarah Chen', empCode: 'US-101', type: 'Annual Leave', from: '2026-11-30', to: '2026-12-02', days: 3, reason: 'Family vacation', status: 'Approved' },
  { id: 2, empName: 'Marcus Vance', empCode: 'US-102', type: 'Medical / Sick', from: '2026-11-28', to: '2026-11-28', days: 1, reason: 'Fever & medical checkup', status: 'Pending' },
  { id: 3, empName: 'Amina El-Sayed', empCode: 'US-103', type: 'Casual Leave', from: '2026-12-05', to: '2026-12-06', days: 2, reason: 'Personal errands', status: 'Pending' },
  { id: 4, empName: 'David Kim', empCode: 'US-104', type: 'Casual Leave', from: '2026-11-25', to: '2026-11-25', days: 1, reason: 'Urgent home repair', status: 'Approved' },
  { id: 5, empName: 'Elena Rostova', empCode: 'US-105', type: 'Maternity / Special', from: '2026-12-10', to: '2026-12-24', days: 14, reason: 'Scheduled leave', status: 'Approved' },
];

export default function Leaves() {
  const user = getStoredUser();
  const isEmployee = user?.role === 'employee' || user?.role === 'agent';
  const myCode = user?.empCode || 'US-101';

  // If Employee, strictly isolate to their own leaves; if HR/Admin, show organization queue
  const [leaves, setLeaves] = useState(
    isEmployee ? INITIAL_LEAVES.filter(l => l.empCode === myCode) : INITIAL_LEAVES
  );
  const [filter, setFilter] = useState('ALL');
  const [newLeave, setNewLeave] = useState({ empName: user?.name || '', empCode: myCode, type: 'Casual Leave', from: '', to: '', reason: '' });
  const [showModal, setShowModal] = useState(false);

  const filtered = leaves.filter(item => {
    if (filter === 'ALL') return true;
    return item.status.toUpperCase() === filter;
  });

  function handleAction(id, newStatus) {
    if (isEmployee) return;
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newLeave.from) return;
    const item = {
      id: Date.now(),
      ...newLeave,
      empName: user?.name || newLeave.empName || 'Sarah Chen',
      empCode: myCode,
      days: 1,
      status: 'Pending'
    };
    setLeaves([item, ...leaves]);
    setShowModal(false);
    setNewLeave({ empName: user?.name || '', empCode: myCode, type: 'Casual Leave', from: '', to: '', reason: '' });
  }

  return (
    <div>
      <PageHeader
        eyebrow="FlowHCM Leave Module"
        title={isEmployee ? "My Leave Requests" : "Leave Approvals & Absence Management"}
        description={isEmployee 
          ? "Submit and track your personal vacation, casual, and medical leave requests."
          : "Unified Systems employee absence requests, entitlement balances, and manager multi-tier approvals."}
        actions={
          <button className="button-label" onClick={() => setShowModal(true)}>
            + Submit Leave Request
          </button>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <span>{isEmployee ? "My Total Requests" : "Total Requests"}</span>
          <strong>{formatCount(leaves.length)}</strong>
          <small className="stat-note">Current payroll cycle</small>
        </div>
        <div className="stat-card">
          <span>{isEmployee ? "Awaiting HR Review" : "Pending Approvals"}</span>
          <strong style={{ color: '#d97706' }}>{formatCount(leaves.filter(l => l.status === 'Pending').length)}</strong>
          <small className="stat-note">{isEmployee ? "Submitted to supervisor" : "Requires HR action"}</small>
        </div>
        <div className="stat-card">
          <span>Approved Leaves</span>
          <strong style={{ color: '#10b981' }}>{formatCount(leaves.filter(l => l.status === 'Approved').length)}</strong>
          <small className="stat-note">Biometrics credited</small>
        </div>
        <div className="stat-card">
          <span>{isEmployee ? "My Leave Balance" : "Avg Entitlement Remaining"}</span>
          <strong style={{ color: '#38bdf8' }}>{isEmployee ? "14 Days" : "14.2 Days"}</strong>
          <small className="stat-note positive">Standard annual quota</small>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <div className="campaign-pills" style={{ marginBottom: 0 }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(tab => (
              <button
                key={tab}
                className={`campaign-pill-btn ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="section-meta">{filtered.length} Applications</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {!isEmployee && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  {!isEmployee && (
                    <td>
                      <strong>{row.empName}</strong>
                      <span className="cell-subtitle">{row.empCode}</span>
                    </td>
                  )}
                  <td><span className="type-badge">{row.type}</span></td>
                  <td>
                    <strong>{row.from}</strong> {row.to && row.to !== row.from ? `to ${row.to}` : ''}
                  </td>
                  <td><strong>{row.days}</strong></td>
                  <td style={{ maxWidth: '240px', color: '#94a3b8' }}>{row.reason}</td>
                  <td>
                    <span className={`status-pill ${row.status === 'Approved' ? 'online' : row.status === 'Rejected' ? 'offline' : 'departure-active'}`}>
                      {row.status}
                    </span>
                  </td>
                  {!isEmployee && (
                    <td>
                      {row.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="button-secondary"
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                            onClick={() => handleAction(row.id, 'Approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="button-secondary"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            onClick={() => handleAction(row.id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <small style={{ color: '#64748b' }}>Processed</small>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999,
          display: 'grid', placeItems: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', margin: 0, background: '#101927', border: '1px solid #1e2c45' }}>
            <h3 style={{ color: '#f8fafc', margin: '0 0 6px' }}>Submit Leave Application</h3>
            <p className="page-description">Creates a request synced to Unified Systems biometric roster.</p>
            <form onSubmit={handleCreate} className="form-grid" style={{ marginTop: '16px' }}>
              {!isEmployee && (
                <label>
                  Employee Full Name
                  <input
                    required
                    placeholder="e.g. John Doe"
                    value={newLeave.empName}
                    onChange={e => setNewLeave({ ...newLeave, empName: e.target.value })}
                  />
                </label>
              )}
              <label>
                Leave Category
                <select
                  value={newLeave.type}
                  onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
                >
                  <option>Casual Leave</option>
                  <option>Medical / Sick</option>
                  <option>Annual Leave</option>
                  <option>Maternity / Paternity</option>
                  <option>Emergency AUX Leave</option>
                </select>
              </label>
              <label>
                From Date
                <input
                  type="date"
                  required
                  value={newLeave.from}
                  onChange={e => setNewLeave({ ...newLeave, from: e.target.value })}
                />
              </label>
              <label>
                To Date
                <input
                  type="date"
                  value={newLeave.to}
                  onChange={e => setNewLeave({ ...newLeave, to: e.target.value })}
                />
              </label>
              <label>
                Reason
                <input
                  placeholder="Provide brief context"
                  value={newLeave.reason}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                />
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" className="button-label" style={{ flex: 1 }}>Submit Application</button>
                <button type="button" className="button-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
