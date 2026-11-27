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
  usePageTitle('Command Center · Unified Systems');
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [punctualityFilter, setPunctualityFilter] = useState('all');
  const [floorData, setFloorData] = useState({ counts: {}, roster: [] });
  const [punctualityData, setPunctualityData] = useState({ metrics: {}, tracker: [] });
  const [punches, setPunches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

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
        setLastRefreshed(new Date().toLocaleTimeString());
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
    if (status === 'early') return <span className="punctuality-pill punctuality-early">🟢 {label}</span>;
    if (status === 'on_time') return <span className="punctuality-pill punctuality-ontime">🔵 {label}</span>;
    if (status === 'late') return <span className="punctuality-pill punctuality-late">🔴 {label}</span>;
    return <span className="punctuality-pill punctuality-absent">⚪ Absent</span>;
  };

  const getDeparturePill = (checkOutAdherence) => {
    if (!checkOutAdherence) return <span className="departure-pill departure-completed">—</span>;
    const { status, label } = checkOutAdherence;
    if (status === 'active') return <span className="departure-pill departure-active">🟡 {label}</span>;
    if (status === 'overtime') return <span className="departure-pill departure-overtime">🟢 {label}</span>;
    if (status === 'early_departure') return <span className="departure-pill departure-early">🔴 {label}</span>;
    return <span className="departure-pill departure-completed">⚪ Completed</span>;
  };

  return (
    <div>
      {/* Real-time Hardware Heartbeat Status */}
      <div className="command-heartbeat-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="pulse-dot"></span>
          <div>
            <strong style={{ fontSize: '13px', color: '#f8fafc', letterSpacing: '0.02em' }}>
              ZKTeco Hardware Network: CONNECTED & LIVE
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
              TCP Port 4370 Biometric Polling & Push Active · Unified Systems Terminal Hub
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Telemetry synced: <strong style={{ color: '#38bdf8' }}>{lastRefreshed}</strong>
          </span>
          <button className="button-secondary" onClick={loadData}>
            ↻ Sync Now
          </button>
        </div>
      </div>

      <PageHeader
        eyebrow="Unified Systems · Executive Command Center"
        title="Call Center Floor & Biometric Operations"
        description="Live hardware time-capture, campaign shift adherence, and break compliance for Unified Systems agents."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge-campaign badge-medicare">Medicare: {byCampaign['Medicare Advantage'] || 0}</span>
            <span className="badge-campaign badge-aca">ACA: {byCampaign['ACA Intake'] || 0}</span>
            <span className="badge-campaign badge-fe">Final Exp: {byCampaign['Final Expense'] || 0}</span>
          </div>
        }
      />

      <Feedback error={error} />

      {/* Hero Metric Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <span>Active On Call Floor</span>
          <strong style={{ color: '#34d399' }}>{formatCount(counts.activeOnFloor || 0)}</strong>
          <small className="stat-note positive">
            ● {counts.totalAgents ? Math.round(((counts.activeOnFloor || 0) / counts.totalAgents) * 100) : 0}% floor utilization
          </small>
        </div>
        <div className="stat-card">
          <span>Punctuality Adherence</span>
          <strong style={{ color: '#38bdf8' }}>{pMetrics.adherenceRate || 0}%</strong>
          <small className="stat-note">
            🟢 {pMetrics.onTimeOrEarly || 0} on schedule · 🔴 {pMetrics.lateArrivals || 0} late
          </small>
        </div>
        <div className="stat-card">
          <span>AUX & Break Monitor</span>
          <strong style={{ color: '#fbbf24' }}>
            {(counts.onBreak || 0) + (counts.onLunch || 0) + (counts.inCoaching || 0)}
          </strong>
          <small className="stat-note">
            ☕ {counts.onBreak || 0} tea · 🍽️ {counts.onLunch || 0} lunch · 🎯 {counts.inCoaching || 0} coaching
          </small>
        </div>
        <div className="stat-card">
          <span>Total Scheduled Roster</span>
          <strong>{formatCount(counts.totalAgents || 0)}</strong>
          <small className="stat-note">Active agents today across all queues</small>
        </div>
      </div>

      {/* Campaign Shift Filter Tabs */}
      <div className="campaign-pills">
        {['All', 'Medicare Advantage', 'ACA Intake', 'Final Expense'].map((c) => (
          <button
            key={c}
            className={`campaign-pill-btn ${activeCampaign === c ? 'active' : ''}`}
            onClick={() => setActiveCampaign(c)}
          >
            {c === 'All' ? '🌐 All Campaigns' : c}
          </button>
        ))}
      </div>

      {/* Main Grid: Punctuality & Shift Roster + Real-Time Biometric Punch Stream */}
      <div className="content-grid" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)' }}>
        {/* Left Panel: Floor Roster & Shift Adherence */}
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Real-Time Shift Tracker</p>
              <h2>Agent Attendance & Clock-In Adherence</h2>
            </div>
            <span className="section-meta">{filteredTracker.length} Records</span>
          </div>

          <div className="filter-subpills">
            {[
              ['all', 'All Roster'],
              ['early', '🟢 Early / On Time'],
              ['late', '🔴 Late Check-Ins'],
              ['not_checked_out', '🟡 Still On Shift'],
              ['checked_out', '⚪ Clocked Out'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`filter-subpill-btn ${punctualityFilter === key ? 'active' : ''}`}
                onClick={() => setPunctualityFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent & Campaign</th>
                  <th>Scheduled Shift</th>
                  <th>Clock In</th>
                  <th>Clock In Status</th>
                  <th>Clock Out Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && !filteredTracker.length ? (
                  <EmptyRow colSpan={5}>Retrieving telemetry from floor devices…</EmptyRow>
                ) : !filteredTracker.length ? (
                  <EmptyRow colSpan={5}>No agent records matching this filter.</EmptyRow>
                ) : (
                  filteredTracker.map((row) => (
                    <tr key={row.employeeId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="avatar">{row.employeeName ? row.employeeName.slice(0, 2).toUpperCase() : 'AG'}</span>
                          <div>
                            <strong>{row.employeeName}</strong>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                              <span className="cell-subtitle">{row.empCode}</span>
                              <span className={`badge-campaign ${getCampaignBadgeClass(row.campaign)}`}>
                                {row.campaign}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="exact-time-badge">
                          <strong>{row.shiftSchedule?.name || 'Standard'}</strong>
                          <small>
                            {row.shiftSchedule?.startTime || '09:00'} – {row.shiftSchedule?.endTime || '18:00'}
                          </small>
                        </span>
                      </td>
                      <td>
                        <span className="exact-time-badge">
                          <strong>{formatExactTime(row.checkInTime)}</strong>
                          <small>{row.checkInTime ? formatExactDateTime(row.checkInTime).split('·')[0] : 'No punch'}</small>
                        </span>
                      </td>
                      <td>{getPunctualityPill(row.adherence?.checkIn)}</td>
                      <td>{getDeparturePill(row.adherence?.checkOut)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Live ZKTeco Terminal Stream */}
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Biometric Live Stream</p>
              <h2>Hardware Punches</h2>
            </div>
            <span className="pulse-dot"></span>
          </div>

          <p className="page-description" style={{ marginBottom: '16px', fontSize: '12px' }}>
            Raw TCP punch stream from ZKTeco terminals with instant millisecond timestamps.
          </p>

          <div className="activity-list">
            {!punchList.length ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                Awaiting next live biometric punch…
              </p>
            ) : (
              punchList.slice(0, 10).map((punch) => (
                <div key={punch.id || Math.random()} className="activity-item">
                  <div className="activity-dot" style={{
                    background: punch.punchType?.includes('in') ? '#10b981' : punch.punchType?.includes('break') ? '#f59e0b' : '#38bdf8'
                  }}></div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#f1f5f9' }}>
                      {punch.Employee?.name || `Terminal User #${punch.deviceUserId}`}
                    </strong>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                      <span className="type-badge" style={{ fontSize: '10px', padding: '2px 7px' }}>
                        {formatPunchType(punch.punchType)}
                      </span>
                      {punch.Device?.name && (
                        <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                          {punch.Device.name}
                        </small>
                      )}
                    </div>
                  </div>
                  <time style={{ fontFamily: 'Space Grotesk, monospace', fontSize: '11px', color: '#94a3b8' }}>
                    {formatExactTime(punch.punchTime)}
                  </time>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
