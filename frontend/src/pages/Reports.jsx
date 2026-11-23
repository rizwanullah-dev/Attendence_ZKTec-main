import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  EmptyRow,
  PageHeader,
  getErrorMessage,
  usePageTitle,
  safeArray,
  getCampaignBadgeClass,
} from '../App.jsx';

export default function Reports() {
  usePageTitle('Campaign Attendance & Punctuality Reports');
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(`${today.slice(0, 8)}01`);
  const [endDate, setEndDate] = useState(today);
  const [campaign, setCampaign] = useState('All');
  const [report, setReport] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function runReport() {
    setLoading(true);
    try {
      setError('');
      const { data } = await api.get('/reports/summary', {
        params: {
          startDate,
          endDate,
          campaign: campaign !== 'All' ? campaign : undefined,
        },
      });
      setReport(safeArray(data));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runReport();
  }, [campaign]);

  async function exportExcel() {
    try {
      const res = await api.get('/reports/summary/export', {
        params: {
          startDate,
          endDate,
          campaign: campaign !== 'All' ? campaign : undefined,
        },
        responseType: 'blob',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = `call-center-${campaign.toLowerCase()}-punctuality-${startDate}-to-${endDate}.xlsx`;
      link.click();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const reportList = safeArray(report);
  const totalHoursWorked = reportList.reduce((acc, r) => acc + (Number(r.totalHours) || 0), 0);
  const totalEarlyArrivals = reportList.reduce((acc, r) => acc + (Number(r.earlyDays) || 0), 0);
  const totalLateArrivals = reportList.reduce((acc, r) => acc + (Number(r.lateDays) || 0), 0);
  const totalEarlyMinutes = reportList.reduce((acc, r) => acc + (Number(r.totalEarlyMinutes) || 0), 0);
  const totalLateMinutes = reportList.reduce((acc, r) => acc + (Number(r.totalLateMinutes) || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Workforce Analytics & Auditing"
        title="Punctuality, Shift Adherence & Hours Report"
        description="Comprehensive audit of arrival punctuality (before time vs late minutes), check-out adherence, and total production hours across campaigns."
        actions={
          <button onClick={exportExcel} disabled={!reportList.length}>
            ↓ Export Detailed Excel (.xlsx)
          </button>
        }
      />

      {error && <div className="feedback error">{error}</div>}

      {/* Campaign Filter Tabs */}
      <div className="campaign-pills">
        {['All', 'Medicare', 'ACA', 'Final Expense'].map((c) => (
          <button
            key={c}
            className={`campaign-pill-btn ${campaign === c ? 'active' : ''}`}
            onClick={() => setCampaign(c)}
          >
            {c === 'All' ? '🏢 All Campaigns' : c === 'Medicare' ? '🩺 Medicare' : c === 'ACA' ? '🛡️ ACA' : '📜 Final Expense'}
          </button>
        ))}
      </div>

      {/* Date Range & Controls */}
      <section className="card report-controls">
        <label>
          From
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={runReport} disabled={loading}>
          {loading ? 'Running...' : 'Run Report'}
        </button>
      </section>

      {/* Report KPI Metrics */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <span>Agents Analyzed</span>
          <strong>{reportList.length}</strong>
          <small className="stat-note">In active scope</small>
        </div>
        <div className="stat-card">
          <span>Before Time Arrivals</span>
          <strong style={{ color: '#16a34a' }}>{totalEarlyArrivals} ({totalEarlyMinutes}m)</strong>
          <small className="stat-note positive">🟢 Arrived before shift</small>
        </div>
        <div className="stat-card">
          <span>Late Shift Arrivals</span>
          <strong style={{ color: '#dc2626' }}>{totalLateArrivals} ({totalLateMinutes}m)</strong>
          <small className="stat-note">🔴 Total late minutes</small>
        </div>
        <div className="stat-card">
          <span>Total Prod Hours</span>
          <strong style={{ color: 'var(--blue)' }}>{totalHoursWorked.toFixed(1)} hrs</strong>
          <small className="stat-note">Shift time logged</small>
        </div>
        <div className="stat-card">
          <span>Campaign Scope</span>
          <strong>{campaign}</strong>
          <small className="stat-note">Active filter</small>
        </div>
      </div>

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Shift Punctuality & Check-in / Check-out Log</p>
            <h2>Agent Adherence Breakdown ({campaign})</h2>
          </div>
          <span className="section-meta">{reportList.length} agents analyzed</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Campaign</th>
                <th>Role</th>
                <th>Days Present</th>
                <th>Before Time (Early)</th>
                <th>Late Arrivals</th>
                <th>Left Early</th>
                <th>Overtime</th>
                <th>Total Prod Hours</th>
              </tr>
            </thead>
            <tbody>
              {reportList.length ? (
                reportList.map((r) => (
                  <tr key={r.employeeId}>
                    <td>
                      <strong>{r.name}</strong>
                      <small className="cell-subtitle">{r.empCode} · Station: {r.station || '—'}</small>
                    </td>
                    <td>
                      <span className={`badge-campaign ${getCampaignBadgeClass(r.campaign)}`}>
                        {r.campaign || 'Medicare'}
                      </span>
                    </td>
                    <td>{r.campaignRole || 'Closer'}</td>
                    <td className="metric-positive"><strong>{r.daysPresent} days</strong></td>
                    <td>
                      {r.earlyDays > 0 ? (
                        <span className="punctuality-pill punctuality-early">
                          🟢 {r.earlyDays}d ({r.totalEarlyMinutes}m early)
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0d</span>
                      )}
                    </td>
                    <td>
                      {r.lateDays > 0 ? (
                        <span className="punctuality-pill punctuality-late">
                          🔴 {r.lateDays}d ({r.totalLateMinutes}m late)
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ 0 Late</span>
                      )}
                    </td>
                    <td>
                      {r.earlyDepartures > 0 ? (
                        <span className="departure-pill departure-early">
                          🔴 {r.earlyDepartures} days early
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {r.overtimeHours > 0 ? (
                        <span className="departure-pill departure-overtime">
                          +{r.overtimeHours} hrs
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0 hrs</span>
                      )}
                    </td>
                    <td>
                      <strong>{r.totalHours} hrs</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={9}>No records found for the selected range and campaign.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
