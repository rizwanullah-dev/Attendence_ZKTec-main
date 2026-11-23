import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  EmptyRow,
  Feedback,
  PageHeader,
  formatCount,
  getErrorMessage,
  getToday,
  usePageTitle,
  safeArray,
  formatExactTime,
  formatExactDateTime,
  getCampaignBadgeClass,
  formatPunchType,
} from '../App.jsx';

export default function Dashboard() {
  usePageTitle('Call Center Floor & Punctuality Dashboard');
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [punctualityFilter, setPunctualityFilter] = useState('all');
  const [floorData, setFloorData] = useState({ counts: {}, roster: [] });
  const [punctualityData, setPunctualityData] = useState({ metrics: {}, tracker: [] });
  const [punches, setPunches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    setError('');
    const campParam = activeCampaign !== 'All' ? { campaign: activeCampaign } : {};

    Promise.all([
      api.get('/attendance/floor-status', { params: campParam }),
      api.get('/attendance/punctuality-today', { params: campParam }),
      api.get('/attendance', {
        params: {
          ...campParam,
          startDate: `${getToday()}T00:00:00`,
          endDate: `${getToday()}T23:59:59`,
          pageSize: 20,
        },
      }),
    ])
      .then(([floorRes, punctRes, punchRes]) => {
        setFloorData(floorRes.data || { counts: {}, roster: [] });
        setPunctualityData(punctRes.data || { metrics: {}, tracker: [] });
        setPunches(safeArray(punchRes.data?.records || punchRes.data));
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30-sec live floor auto-refresh
    return () => clearInterval(interval);
  }, [activeCampaign]);

  const counts = floorData.counts || {};
  const byCampaign = counts.byCampaign || {};
  const rosterList = safeArray(floorData.roster);
  const punchList = safeArray(punches);
  const pMetrics = punctualityData.metrics || {};
  const trackerList = safeArray(punctualityData.tracker);

  // Filtered tracker list based on user sub-filter (all, early, late, not_checked_out, checked_out)
  const filteredTracker = trackerList.filter((item) => {
    if (punctualityFilter === 'early') return item.adherence?.checkIn?.status === 'early';
    if (punctualityFilter === 'late') return item.adherence?.checkIn?.status === 'late';
    if (punctualityFilter === 'not_checked_out') return Boolean(item.checkInTime && !item.checkOutTime);
    if (punctualityFilter === 'checked_out') return Boolean(item.checkOutTime);
    return true;
  });

  const getPunctualityPill = (checkInAdherence) => {
    if (!checkInAdherence) return <span className="punctuality-pill punctuality-absent">Not Clocked In</span>;
    const { status, label } = checkInAdherence;
    if (status === 'early') {
      return <span className="punctuality-pill punctuality-early">🟢 {label}</span>;
    }
    if (status === 'on_time') {
      return <span className="punctuality-pill punctuality-ontime">🔵 {label}</span>;
    }
    if (status === 'late') {
      return <span className="punctuality-pill punctuality-late">🔴 {label}</span>;
    }
    return <span className="punctuality-pill punctuality-absent">⚪ Absent</span>;
  };

  const getDeparturePill = (checkOutAdherence) => {
    if (!checkOutAdherence) return <span className="departure-pill departure-completed">—</span>;
    const { status, label } = checkOutAdherence;
    if (status === 'active') {
      return <span className="departure-pill departure-active">🟡 {label}</span>;
    }
    if (status === 'overtime') {
      return <span className="departure-pill departure-overtime">🟢 {label}</span>;
    }
    if (status === 'early_departure') {
      return <span className="departure-pill departure-early">🔴 {label}</span>;
    }
    return <span className="departure-pill departure-completed">✓ {label}</span>;
  };

  return (
    <>
      <PageHeader
        eyebrow="Call Center Operations"
        title="Floor & Punctuality Dashboard"
        description="Monitor real-time check-in, check-out, before-time arrivals, late minutes, and campaign workforce adherence."
        actions={<button onClick={loadData}>↻ Refresh Live Status</button>}
      />

      {error && <Feedback error={error} />}

      {/* Campaign Filter Bar */}
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

      {/* Punctuality & Attendance Metric Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <span>Scheduled Roster</span>
          <strong>{formatCount(pMetrics.total || trackerList.length)}</strong>
          <small className="stat-note">Configured agents</small>
        </div>
        <div className="stat-card">
          <span>Before Time (Early)</span>
          <strong style={{ color: '#16a34a' }}>{formatCount(pMetrics.early || 0)}</strong>
          <small className="stat-note positive">🟢 Arrived before shift</small>
        </div>
        <div className="stat-card">
          <span>On Time (Grace)</span>
          <strong style={{ color: '#0284c7' }}>{formatCount(pMetrics.onTime || 0)}</strong>
          <small className="stat-note">Within 10m grace</small>
        </div>
        <div className="stat-card">
          <span>Late Shift Arrivals</span>
          <strong style={{ color: '#dc2626' }}>{formatCount(pMetrics.late || 0)}</strong>
          <small className="stat-note">🔴 After grace period</small>
        </div>
        <div className="stat-card">
          <span>Not Checked Out</span>
          <strong style={{ color: '#d97706' }}>{formatCount(pMetrics.notCheckedOut || 0)}</strong>
          <small className="stat-note">🟡 Active on shift</small>
        </div>
      </div>

      {/* Three Primary Campaign KPI Cards */}
      {activeCampaign === 'All' && (
        <div className="kpi-campaign-grid">
          <div className="kpi-campaign-card medicare">
            <span className="badge-campaign badge-medicare">🩺 Medicare</span>
            <div className="kpi-campaign-stats">
              <div>
                <p>Floor Status</p>
                <strong>{byCampaign.Medicare?.active || 0} / {byCampaign.Medicare?.total || 0}</strong>
              </div>
              <span>Active Agents</span>
            </div>
          </div>

          <div className="kpi-campaign-card aca">
            <span className="badge-campaign badge-aca">🛡️ ACA Health</span>
            <div className="kpi-campaign-stats">
              <div>
                <p>Floor Status</p>
                <strong>{byCampaign.ACA?.active || 0} / {byCampaign.ACA?.total || 0}</strong>
              </div>
              <span>Active Agents</span>
            </div>
          </div>

          <div className="kpi-campaign-card fe">
            <span className="badge-campaign badge-fe">📜 Final Expense</span>
            <div className="kpi-campaign-stats">
              <div>
                <p>Floor Status</p>
                <strong>{byCampaign['Final Expense']?.active || 0} / {byCampaign['Final Expense']?.total || 0}</strong>
              </div>
              <span>Active Agents</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Section: Shift Adherence, Check-in & Check-out Tracker */}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Shift Adherence & Hours</p>
            <h2>Agent Check-in & Check-out Punctuality Tracker (Today)</h2>
          </div>
          <span className="section-meta">{filteredTracker.length} agents listed</span>
        </div>

        {/* Quick Filter Buttons to see who came early, late, or not checked out */}
        <div className="filter-subpills">
          <button
            className={`filter-subpill-btn ${punctualityFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPunctualityFilter('all')}
          >
            Show All ({trackerList.length})
          </button>
          <button
            className={`filter-subpill-btn ${punctualityFilter === 'early' ? 'active' : ''}`}
            onClick={() => setPunctualityFilter('early')}
          >
            🟢 Before Time ({pMetrics.early || 0})
          </button>
          <button
            className={`filter-subpill-btn ${punctualityFilter === 'late' ? 'active' : ''}`}
            onClick={() => setPunctualityFilter('late')}
          >
            🔴 Late Arrivals ({pMetrics.late || 0})
          </button>
          <button
            className={`filter-subpill-btn ${punctualityFilter === 'not_checked_out' ? 'active' : ''}`}
            onClick={() => setPunctualityFilter('not_checked_out')}
          >
            🟡 Not Checked Out ({pMetrics.notCheckedOut || 0})
          </button>
          <button
            className={`filter-subpill-btn ${punctualityFilter === 'checked_out' ? 'active' : ''}`}
            onClick={() => setPunctualityFilter('checked_out')}
          >
            🏁 Checked Out ({pMetrics.checkedOut || 0})
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent Name & Code</th>
                <th>Campaign</th>
                <th>Shift Schedule</th>
                <th>Exact Check-in</th>
                <th>Arrival Punctuality</th>
                <th>Exact Check-out</th>
                <th>Departure / Adherence</th>
                <th>Hours on Floor</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracker.length ? (
                filteredTracker.map((item) => (
                  <tr key={item.employeeId}>
                    <td>
                      <strong>{item.name}</strong>
                      <small className="cell-subtitle">
                        {item.empCode} · {item.campaignRole} {item.station !== '—' ? `(${item.station})` : ''}
                      </small>
                    </td>
                    <td>
                      <span className={`badge-campaign ${getCampaignBadgeClass(item.campaign)}`}>
                        {item.campaign}
                      </span>
                    </td>
                    <td>
                      <small style={{ fontFamily: 'monospace' }}>
                        {item.shiftStart?.slice(0, 5)} - {item.shiftEnd?.slice(0, 5)}
                      </small>
                    </td>
                    <td>
                      <div className="exact-time-badge">
                        <strong>{formatExactTime(item.checkInTime)}</strong>
                        <small>{item.checkInTime ? 'Logged In' : 'No Check-in'}</small>
                      </div>
                    </td>
                    <td>{getPunctualityPill(item.adherence?.checkIn)}</td>
                    <td>
                      <div className="exact-time-badge">
                        <strong>{formatExactTime(item.checkOutTime)}</strong>
                        <small>{item.checkOutTime ? 'Shift Ended' : 'Pending Logout'}</small>
                      </div>
                    </td>
                    <td>{getDeparturePill(item.adherence?.checkOut)}</td>
                    <td>
                      <strong>{item.adherence?.durationHours || 0} hrs</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={8}>No agents found matching this punctuality filter.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Latest Real-Time Punches Stream */}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Real-time Stream</p>
            <h2>Latest Punches (Exact Timestamp with Seconds)</h2>
          </div>
          <span className="section-meta">{punchList.length} logs</span>
        </div>

        <div className="activity-list">
          {punchList.length ? (
            punchList.map((p) => (
              <div className="activity-item" key={p.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{p.Employee?.name || `Agent User: ${p.deviceUserId}`}</strong>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                    <span className={`badge-campaign ${getCampaignBadgeClass(p.campaign || p.Employee?.campaign)}`}>
                      {p.campaign || p.Employee?.campaign || 'Medicare'}
                    </span>
                    <small>
                      {formatPunchType(p.punchType)}
                      {p.notes ? ` · Note: ${p.notes}` : ''}
                    </small>
                  </div>
                </div>
                <time style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {formatExactTime(p.timestamp)}
                  </strong>
                  <small style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {new Date(p.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </small>
                </time>
              </div>
            ))
          ) : (
            <Feedback empty>No activity logged today yet.</Feedback>
          )}
        </div>
      </section>
    </>
  );
}
