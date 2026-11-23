import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  EmptyRow,
  Feedback,
  PageHeader,
  getErrorMessage,
  usePageTitle,
  safeArray,
  formatExactTime,
  getCampaignBadgeClass,
} from '../App.jsx';

export default function BreakMonitor() {
  usePageTitle('Break Time & AUX Monitor');
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadData() {
    setLoading(true);
    setError('');
    const params = activeCampaign !== 'All' ? { campaign: activeCampaign } : {};

    api
      .get('/attendance/break-monitor', { params })
      .then((res) => {
        setRecords(safeArray(res.data?.records));
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // 15 sec auto refresh for live break status
    return () => clearInterval(interval);
  }, [activeCampaign]);

  const recordList = safeArray(records);
  const onTeaCount = recordList.filter((r) => r.currentAuxState === 'on_tea_break').length;
  const onLunchCount = recordList.filter((r) => r.currentAuxState === 'on_lunch').length;
  const inCoachingCount = recordList.filter((r) => r.currentAuxState === 'in_coaching' || r.currentAuxState === 'in_meeting').length;
  const overdueCount = recordList.filter((r) => r.isOverdue || r.teaOverrun > 0 || r.lunchOverrun > 0).length;

  const getAuxBadge = (state) => {
    switch (state) {
      case 'on_tea_break':
        return <span className="status-pill status-break">☕ Tea Break (15m)</span>;
      case 'on_lunch':
        return <span className="status-pill status-lunch">🍔 Lunch Break (45m)</span>;
      case 'in_coaching':
        return <span className="status-pill status-coaching">📋 In Coaching</span>;
      case 'in_meeting':
        return <span className="status-pill status-meeting">👥 Team Huddle</span>;
      case 'available':
        return <span className="status-pill online">🟢 On Calls / Available</span>;
      case 'logged_out':
        return <span className="status-pill offline">⚪ Logged Out</span>;
      default:
        return <span className="status-pill unknown">{state}</span>;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Call Center Operations"
        title="Break Time & AUX Monitor"
        description="Live tracking of agent AUX states, break durations, tea/lunch limits, and real-time overruns."
        actions={<button onClick={loadData}>↻ Refresh Breaks</button>}
      />

      {error && <Feedback error={error} />}

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

      {/* AUX Metric Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <span>On Tea Break</span>
          <strong style={{ color: '#d97706' }}>{onTeaCount}</strong>
          <small className="stat-note">Limit: 15 mins</small>
        </div>
        <div className="stat-card">
          <span>On Lunch Break</span>
          <strong style={{ color: '#2563eb' }}>{onLunchCount}</strong>
          <small className="stat-note">Limit: 45 mins</small>
        </div>
        <div className="stat-card">
          <span>In Coaching / Huddle</span>
          <strong style={{ color: '#7c3aed' }}>{inCoachingCount}</strong>
          <small className="stat-note">Offline training</small>
        </div>
        <div className="stat-card">
          <span>Break Exceeded / Overdue</span>
          <strong style={{ color: '#dc2626' }}>{overdueCount}</strong>
          <small className="stat-note">⚠️ Over allowed minutes</small>
        </div>
      </div>

      {/* Real-time Break Table */}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Real-time Adherence</p>
            <h2>Agent AUX & Break Overrun Tracking</h2>
          </div>
          <span className="section-meta">{recordList.length} agents tracked</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Campaign</th>
                <th>Current AUX Status</th>
                <th>Active AUX Since</th>
                <th>Total Tea Used</th>
                <th>Total Lunch Used</th>
                <th>Overrun Warning</th>
              </tr>
            </thead>
            <tbody>
              {recordList.length ? (
                recordList.map((r) => (
                  <tr key={r.employeeId} style={{ backgroundColor: r.isOverdue ? '#fef2f2' : undefined }}>
                    <td>
                      <strong>{r.name}</strong>
                      <small className="cell-subtitle">
                        {r.empCode} · {r.campaignRole} {r.station ? `(${r.station})` : ''}
                      </small>
                    </td>
                    <td>
                      <span className={`badge-campaign ${getCampaignBadgeClass(r.campaign)}`}>
                        {r.campaign}
                      </span>
                    </td>
                    <td>{getAuxBadge(r.currentAuxState)}</td>
                    <td>
                      {r.currentAuxSince ? (
                        <div className="exact-time-badge">
                          <strong>{formatExactTime(r.currentAuxSince)}</strong>
                          <small>{r.currentBreakElapsedMin} mins ago</small>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong style={{ color: r.totalTeaMinutes > 15 ? '#dc2626' : 'inherit' }}>
                        {r.totalTeaMinutes} / 15m
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: r.totalLunchMinutes > 45 ? '#dc2626' : 'inherit' }}>
                        {r.totalLunchMinutes} / 45m
                      </strong>
                    </td>
                    <td>
                      {r.isOverdue || r.teaOverrun > 0 || r.lunchOverrun > 0 ? (
                        <span className="departure-pill departure-early" style={{ fontWeight: 'bold' }}>
                          ⚠️ Overdue +{r.teaOverrun + r.lunchOverrun}m
                        </span>
                      ) : (
                        <span className="departure-pill departure-completed">✓ Adherent</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={7}>No agent break records found for today.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}