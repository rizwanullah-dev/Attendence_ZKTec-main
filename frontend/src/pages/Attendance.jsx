import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  EmptyRow,
  PageHeader,
  getErrorMessage,
  usePageTitle,
  safeArray,
  formatExactDateTime,
  getCampaignBadgeClass,
  formatPunchType,
} from '../App.jsx';

export default function Attendance() {
  usePageTitle('Live Punches & AUX Activity');
  const [records, setRecords] = useState([]);
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [deviceId, setDeviceId] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [showManualPunch, setShowManualPunch] = useState(false);

  // Manual call center punch state
  const [punchForm, setPunchForm] = useState({
    campaign: 'Medicare',
    employeeId: '',
    punchType: 'check_in',
    timestamp: new Date().toISOString().slice(0, 19),
    notes: '',
  });

  function load() {
    api
      .get('/attendance', {
        params: {
          pageSize: 60,
          campaign: activeCampaign !== 'All' ? activeCampaign : undefined,
        },
      })
      .then((r) => setRecords(safeArray(r.data?.records || r.data)))
      .catch((e) => setError(getErrorMessage(e)));
  }

  useEffect(() => {
    load();
    api.get('/devices').then((r) => setDevices(safeArray(r.data))).catch(() => {});
    api.get('/employees').then((r) => setEmployees(safeArray(r.data))).catch(() => {});
  }, [activeCampaign]);

  async function handleImport(e) {
    if (!e.target.files.length) return;
    try {
      const form = new FormData();
      Array.from(e.target.files).forEach((f) => form.append('files', f));
      if (deviceId) form.append('deviceId', deviceId);
      const { data } = await api.post('/attendance/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary(data);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function handleManualPunch(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/attendance', {
        employeeId: punchForm.employeeId ? Number(punchForm.employeeId) : null,
        campaign: punchForm.campaign,
        punchType: punchForm.punchType,
        timestamp: punchForm.timestamp ? new Date(punchForm.timestamp).toISOString() : new Date().toISOString(),
        deviceId: deviceId ? Number(deviceId) : null,
        notes: punchForm.notes || undefined,
      });
      setShowManualPunch(false);
      setPunchForm({
        ...punchForm,
        employeeId: '',
        notes: '',
        timestamp: new Date().toISOString().slice(0, 19),
      });
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const recordList = safeArray(records);
  const deviceList = safeArray(devices);
  const employeeList = safeArray(employees);

  // Filter agents available in form according to campaign selection
  const filteredEmployeesForForm = punchForm.campaign
    ? employeeList.filter((e) => !e.campaign || e.campaign === punchForm.campaign)
    : employeeList;

  return (
    <>
      <PageHeader
        eyebrow="Time & Attendance"
        title="Live Punches & AUX Activity"
        description="Monitor punch timestamps down to the second, manage call center AUX states, and import biometric logs."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowManualPunch(!showManualPunch)}>
              {showManualPunch ? '✕ Close Form' : '＋ Record Agent Punch'}
            </button>
            <label className="button-label">
              📁 Import Punch File
              <input
                className="visually-hidden"
                type="file"
                multiple
                accept=".csv,.txt,.dat,.xlsx,.xls"
                onChange={handleImport}
              />
            </label>
          </div>
        }
      />

      {error && <div className="feedback error">{error}</div>}

      {/* Campaign Filter Tabs */}
      <div className="campaign-pills">
        {['All', 'Medicare', 'ACA', 'Final Expense'].map((c) => (
          <button
            key={c}
            className={`campaign-pill-btn ${activeCampaign === c ? 'active' : ''}`}
            onClick={() => setActiveCampaign(c)}
          >
            {c === 'All' ? 'All Campaigns' : c === 'Medicare' ? '🩺 Medicare' : c === 'ACA' ? '🛡️ ACA' : '📜 Final Expense'}
          </button>
        ))}
      </div>

      {/* Manual Call Center Punch Box */}
      {showManualPunch && (
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AUX & Punch Entry</p>
              <h2>Record Call Center Punch</h2>
            </div>
          </div>
          <form className="device-form" onSubmit={handleManualPunch}>
            <select
              value={punchForm.campaign}
              onChange={(e) => setPunchForm({ ...punchForm, campaign: e.target.value, employeeId: '' })}
              required
            >
              <option value="Medicare">🩺 Medicare Campaign</option>
              <option value="ACA">🛡️ ACA Health Campaign</option>
              <option value="Final Expense">📜 Final Expense Campaign</option>
            </select>

            <select
              value={punchForm.employeeId}
              onChange={(e) => setPunchForm({ ...punchForm, employeeId: e.target.value })}
              required
            >
              <option value="">Select Agent</option>
              {filteredEmployeesForForm.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.empCode}) — {emp.campaignRole || 'Closer'}
                </option>
              ))}
            </select>

            <select
              value={punchForm.punchType}
              onChange={(e) => setPunchForm({ ...punchForm, punchType: e.target.value })}
              required
            >
              <option value="check_in">🟢 Shift Clock In (Login)</option>
              <option value="break_start">☕ Tea / Smoke Break Out (15m)</option>
              <option value="break_end">☕ Tea Break In (Back on Calls)</option>
              <option value="lunch_start">🍔 Lunch Break Out (30-45m)</option>
              <option value="lunch_end">🍔 Lunch Break In (Back on Calls)</option>
              <option value="coaching">📋 Coaching / One-on-One</option>
              <option value="meeting">👥 Team Meeting / Huddle</option>
              <option value="check_out">🔴 Shift Clock Out (Logout)</option>
            </select>

            <input
              type="datetime-local"
              step="1"
              value={punchForm.timestamp}
              onChange={(e) => setPunchForm({ ...punchForm, timestamp: e.target.value })}
              required
            />

            <input
              placeholder="Notes (e.g. Overtime, Approved AUX, Late)"
              value={punchForm.notes}
              onChange={(e) => setPunchForm({ ...punchForm, notes: e.target.value })}
            />

            <button type="submit">Submit Punch</button>
          </form>
        </section>
      )}

      {/* Manual File Import Banner */}
      <section className="card import-panel">
        <div>
          <p className="eyebrow">Device / Manual Sync</p>
          <h2>Upload Biometric Punch Export</h2>
          <p className="page-description">Supports standard ZKTeco .dat exports, CSV, or Excel punch logs.</p>
        </div>
        <div className="inline-form">
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="">Select biometric device (optional)</option>
            {deviceList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.model})
              </option>
            ))}
          </select>
          {summary && <span className="success-text">✓ {summary.recordsSaved} punches synced</span>}
        </div>
      </section>

      {/* Exact Time Punch Feed */}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Activity History</p>
            <h2>Punches Feed ({activeCampaign})</h2>
          </div>
          <span className="section-meta">{recordList.length} total logs</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Campaign</th>
                <th>Punch / AUX Type</th>
                <th>Exact Punch Time (HH:mm:ss)</th>
                <th>Notes / Details</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {recordList.length ? (
                recordList.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.Employee?.name || `Agent User: ${r.deviceUserId}`}</strong>
                      {r.Employee?.empCode && (
                        <small className="cell-subtitle">{r.Employee.empCode} · {r.Employee?.campaignRole || 'Agent'}</small>
                      )}
                    </td>
                    <td>
                      <span className={`badge-campaign ${getCampaignBadgeClass(r.campaign || r.Employee?.campaign)}`}>
                        {r.campaign || r.Employee?.campaign || 'Medicare'}
                      </span>
                    </td>
                    <td>
                      <span className="type-badge">
                        {formatPunchType(r.punchType)}
                      </span>
                    </td>
                    <td>
                      <div className="exact-time-badge">
                        <strong>{formatExactDateTime(r.timestamp)}</strong>
                        <small>Local Punch Time</small>
                      </div>
                    </td>
                    <td>{r.notes || '—'}</td>
                    <td>
                      <span className="status-pill online">{r.source}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={6}>No punch activity recorded for this campaign.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
