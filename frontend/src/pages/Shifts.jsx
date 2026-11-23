import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  EmptyRow,
  Feedback,
  PageHeader,
  getErrorMessage,
  usePageTitle,
  safeArray,
  getCampaignBadgeClass,
} from '../App.jsx';

export default function Shifts() {
  usePageTitle('Campaign Shift & Schedule Manager');
  const [employees, setEmployees] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk shift update state
  const [bulkShift, setBulkShift] = useState({
    campaign: 'Medicare',
    shiftStart: '19:00:00',
    shiftEnd: '04:00:00',
  });

  // Individual edit state
  const [editingId, setEditingId] = useState(null);
  const [editTimes, setEditTimes] = useState({ shiftStart: '', shiftEnd: '' });

  function loadEmployees() {
    setLoading(true);
    setError('');
    const params = activeCampaign !== 'All' ? { campaign: activeCampaign } : {};

    api
      .get('/employees', { params })
      .then((res) => setEmployees(safeArray(res.data)))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEmployees();
  }, [activeCampaign]);

  async function handleBulkShift(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/employees/bulk-shift', bulkShift);
      setSuccess(`✓ Successfully updated shift schedule for ${res.data.updatedCount} agents in ${bulkShift.campaign}!`);
      loadEmployees();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function handleSaveIndividual(empId) {
    setError('');
    setSuccess('');
    try {
      await api.put(`/employees/${empId}`, {
        shiftStart: editTimes.shiftStart,
        shiftEnd: editTimes.shiftEnd,
      });
      setSuccess('✓ Shift updated successfully for agent.');
      setEditingId(null);
      loadEmployees();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const list = safeArray(employees);

  return (
    <>
      <PageHeader
        eyebrow="Workforce Management"
        title="Shift Schedule Manager"
        description="Configure standard day, evening, and overnight US call center shifts per campaign or per agent."
        actions={<button onClick={loadEmployees}>↻ Refresh Rosters</button>}
      />

      {error && <Feedback error={error} />}
      {success && <div className="feedback success" style={{ marginBottom: '16px' }}>{success}</div>}

      {/* Campaign Shift Presets & Bulk Update Form */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick Batch Assignment</p>
            <h2>Bulk Shift Configuration by Campaign</h2>
          </div>
        </div>

        <form className="device-form" onSubmit={handleBulkShift} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>Target Campaign</label>
            <select
              value={bulkShift.campaign}
              onChange={(e) => setBulkShift({ ...bulkShift, campaign: e.target.value })}
              required
            >
              <option value="Medicare">🩺 Medicare</option>
              <option value="ACA">🛡️ ACA Health</option>
              <option value="Final Expense">📜 Final Expense</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>Shift Start (HH:mm:ss)</label>
            <input
              type="time"
              step="1"
              value={bulkShift.shiftStart}
              onChange={(e) => setBulkShift({ ...bulkShift, shiftStart: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>Shift End (HH:mm:ss)</label>
            <input
              type="time"
              step="1"
              value={bulkShift.shiftEnd}
              onChange={(e) => setBulkShift({ ...bulkShift, shiftEnd: e.target.value })}
              required
            />
          </div>

          <div>
            <button type="submit" style={{ width: '100%', height: '42px' }}>
              Apply to Campaign
            </button>
          </div>
        </form>

        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <small style={{ color: '#64748b' }}>Common Shift Presets:</small>
          <button
            type="button"
            className="filter-subpill-btn"
            onClick={() => setBulkShift({ ...bulkShift, shiftStart: '19:00:00', shiftEnd: '04:00:00' })}
          >
            🌙 Night Shift (19:00 - 04:00)
          </button>
          <button
            type="button"
            className="filter-subpill-btn"
            onClick={() => setBulkShift({ ...bulkShift, shiftStart: '20:00:00', shiftEnd: '05:00:00' })}
          >
            🌙 Late Night (20:00 - 05:00)
          </button>
          <button
            type="button"
            className="filter-subpill-btn"
            onClick={() => setBulkShift({ ...bulkShift, shiftStart: '09:00:00', shiftEnd: '18:00:00' })}
          >
            ☀️ Day Shift (09:00 - 18:00)
          </button>
        </div>
      </section>

      {/* Campaign Filter Tabs */}
      <div className="campaign-pills">
        {['All', 'Medicare', 'ACA', 'Final Expense'].map((c) => (
          <button
            key={c}
            className={`campaign-pill-btn ${activeCampaign === c ? 'active' : ''}`}
            onClick={() => setActiveCampaign(c)}
          >
            {c === 'All' ? '🏢 All Campaigns' : c === 'Medicare' ? '🩺 Medicare' : c === 'ACA' ? '🛡️ ACA' : '📜 Final Expense'}
          </button>
        ))}
      </div>

      {/* Agent Shift List */}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Individual Schedules</p>
            <h2>Agent Shift Adherence Parameters</h2>
          </div>
          <span className="section-meta">{list.length} agents</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Campaign</th>
                <th>Role & Station</th>
                <th>Shift Start</th>
                <th>Shift End</th>
                <th>Shift Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((emp) => {
                  const isEditing = editingId === emp.id;
                  const isOvernight = (emp.shiftStart || '19:00') > (emp.shiftEnd || '04:00');

                  return (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.name}</strong>
                        <small className="cell-subtitle">{emp.empCode}</small>
                      </td>
                      <td>
                        <span className={`badge-campaign ${getCampaignBadgeClass(emp.campaign)}`}>
                          {emp.campaign}
                        </span>
                      </td>
                      <td>
                        {emp.campaignRole || 'Agent'} {emp.station ? `· St: ${emp.station}` : ''}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="time"
                            step="1"
                            value={editTimes.shiftStart}
                            onChange={(e) => setEditTimes({ ...editTimes, shiftStart: e.target.value })}
                            style={{ padding: '4px', fontSize: '13px' }}
                          />
                        ) : (
                          <strong style={{ fontFamily: 'monospace' }}>{emp.shiftStart || '19:00:00'}</strong>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="time"
                            step="1"
                            value={editTimes.shiftEnd}
                            onChange={(e) => setEditTimes({ ...editTimes, shiftEnd: e.target.value })}
                            style={{ padding: '4px', fontSize: '13px' }}
                          />
                        ) : (
                          <strong style={{ fontFamily: 'monospace' }}>{emp.shiftEnd || '04:00:00'}</strong>
                        )}
                      </td>
                      <td>
                        {isOvernight ? (
                          <span className="status-pill status-break">🌙 Overnight Shift</span>
                        ) : (
                          <span className="status-pill online">☀️ Standard Day</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleSaveIndividual(emp.id)}
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ padding: '4px 10px', fontSize: '12px', background: '#64748b' }}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(emp.id);
                              setEditTimes({
                                shiftStart: emp.shiftStart || '19:00:00',
                                shiftEnd: emp.shiftEnd || '04:00:00',
                              });
                            }}
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            ✎ Edit Shift
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow colSpan={7}>No agents found.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}