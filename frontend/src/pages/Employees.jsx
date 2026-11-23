import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  EmptyRow,
  PageHeader,
  getErrorMessage,
  usePageTitle,
  safeArray,
  getCampaignBadgeClass,
} from '../App.jsx';

export default function Employees() {
  usePageTitle('Agent Roster & Campaign Teams');
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    empCode: '',
    campaign: 'Medicare',
    campaignRole: 'Closer',
    station: '',
    deviceUserId: '',
    email: '',
    phone: '',
    shiftStart: '19:00:00',
    shiftEnd: '04:00:00',
  });

  function load() {
    api
      .get('/employees', {
        params: {
          search,
          campaign: activeCampaign !== 'All' ? activeCampaign : undefined,
        },
      })
      .then((r) => setEmployees(safeArray(r.data)))
      .catch((e) => setError(getErrorMessage(e)));
  }

  useEffect(load, [search, activeCampaign]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', form);
      setForm({
        name: '',
        empCode: '',
        campaign: 'Medicare',
        campaignRole: 'Closer',
        station: '',
        deviceUserId: '',
        email: '',
        phone: '',
        shiftStart: '19:00:00',
        shiftEnd: '04:00:00',
      });
      setShowAdd(false);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function handleImport(e) {
    if (!e.target.files.length) return;
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append('files', f));
      const { data } = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary(data);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const employeeList = safeArray(employees);

  return (
    <>
      <PageHeader
        eyebrow="Workforce Management"
        title="Agent Roster & Teams"
        description="Organize your call center staff across Medicare, ACA, and Final Expense campaigns."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? '✕ Close Form' : '＋ Add Agent'}
            </button>
            <label className="button-label">
              📁 Import Roster (CSV)
              <input
                className="visually-hidden"
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
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
            {c === 'All' ? '🏢 All Campaigns' : c === 'Medicare' ? '🩺 Medicare' : c === 'ACA' ? '🛡️ ACA' : '📜 Final Expense'}
          </button>
        ))}
      </div>

      {showAdd && (
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Onboarding</p>
              <h2>Add Call Center Agent</h2>
            </div>
          </div>
          <form className="device-form" onSubmit={handleAdd}>
            <input
              placeholder="Agent Full Name (e.g. Alex Morgan)"
              value={form.name}
              onChange={update('name')}
              required
            />
            <input
              placeholder="Agent Code (e.g. MED-101, ACA-04)"
              value={form.empCode}
              onChange={update('empCode')}
              required
            />
            <select value={form.campaign} onChange={update('campaign')} required>
              <option value="Medicare">🩺 Medicare Campaign</option>
              <option value="ACA">🛡️ ACA Health Campaign</option>
              <option value="Final Expense">📜 Final Expense Campaign</option>
              <option value="QA / Support">🔍 Quality Assurance (QA)</option>
              <option value="Leadership">👔 Supervisor / Leadership</option>
            </select>
            <select value={form.campaignRole} onChange={update('campaignRole')}>
              <option value="Closer">Closer / Senior Agent</option>
              <option value="Qualifier / Opener">Qualifier / Opener</option>
              <option value="Team Lead">Team Lead (TL)</option>
              <option value="QA Specialist">QA Specialist</option>
              <option value="Supervisor">Floor Supervisor</option>
              <option value="Trainee">Trainee / Probation</option>
            </select>
            <input
              placeholder="Station / Desk (e.g. Desk 14)"
              value={form.station}
              onChange={update('station')}
            />
            <input
              placeholder="Biometric Device User ID (e.g. 101)"
              value={form.deviceUserId}
              onChange={update('deviceUserId')}
            />
            <input
              placeholder="Shift Start (e.g. 19:00:00)"
              type="time"
              value={form.shiftStart}
              onChange={update('shiftStart')}
            />
            <input
              placeholder="Shift End (e.g. 04:00:00)"
              type="time"
              value={form.shiftEnd}
              onChange={update('shiftEnd')}
            />
            <input
              placeholder="Email (optional)"
              type="email"
              value={form.email}
              onChange={update('email')}
            />
            <button type="submit">Save Agent</button>
          </form>
        </section>
      )}

      <section className="card toolbar">
        <div className="search-box">
          ⌕
          <input
            aria-label="Search agents"
            placeholder="Search by agent name, code, or campaign"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {summary && (
          <span className="success-text">
            ✓ {summary.created} added · {summary.updated} updated
          </span>
        )}
        <span className="section-meta">{employeeList.length} active agents</span>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Code</th>
                <th>Campaign</th>
                <th>Role</th>
                <th>Station</th>
                <th>Shift Hours</th>
                <th>Device ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeList.length ? (
                employeeList.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.name}</strong>
                      <small className="cell-subtitle">{e.email || 'No email specified'}</small>
                    </td>
                    <td><strong>{e.empCode}</strong></td>
                    <td>
                      <span className={`badge-campaign ${getCampaignBadgeClass(e.campaign)}`}>
                        {e.campaign || 'Medicare'}
                      </span>
                    </td>
                    <td>{e.campaignRole || 'Closer'}</td>
                    <td>{e.station || '—'}</td>
                    <td>
                      <small style={{ fontFamily: 'monospace' }}>
                        {e.shiftStart?.slice(0, 5)} - {e.shiftEnd?.slice(0, 5)}
                      </small>
                    </td>
                    <td>{e.deviceUserId || '—'}</td>
                    <td>
                      <span className="status-pill online">{e.status || 'active'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={8}>No agents found. Click "Add Agent" or "Import Roster" above.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
