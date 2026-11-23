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

export default function Leaderboard() {
  usePageTitle('Agent Punctuality & Performance Leaderboard');
  const [activeCampaign, setActiveCampaign] = useState('All');
  const [days, setDays] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadData() {
    setLoading(true);
    setError('');
    const params = {
      days,
      campaign: activeCampaign !== 'All' ? activeCampaign : undefined,
    };

    api
      .get('/attendance/leaderboard', { params })
      .then((res) => {
        setLeaderboard(safeArray(res.data?.leaderboard));
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [activeCampaign, days]);

  const list = safeArray(leaderboard);

  return (
    <>
      <PageHeader
        eyebrow="Call Center Analytics"
        title="Agent Punctuality & Adherence Leaderboard"
        description="Ranking agents across Medicare, ACA, and Final Expense by punctuality adherence score, before-time arrivals, and total floor hours."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days (Month)</option>
              <option value={90}>Last 90 Days (Quarter)</option>
            </select>
            <button onClick={loadData}>↻ Refresh Rankings</button>
          </div>
        }
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

      {/* Top 3 Podium Highlights */}
      {list.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {list.slice(0, 3).map((agent, idx) => (
            <div
              key={agent.employeeId}
              className="card"
              style={{
                textAlign: 'center',
                borderTop: idx === 0 ? '4px solid #eab308' : idx === 1 ? '4px solid #94a3b8' : '4px solid #b45309',
                padding: '20px',
              }}
            >
              <span style={{ fontSize: '32px' }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </span>
              <h3 style={{ margin: '8px 0 4px 0' }}>{agent.name}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>
                {agent.empCode} · {agent.campaignRole}
              </p>
              <span className={`badge-campaign ${getCampaignBadgeClass(agent.campaign)}`}>
                {agent.campaign}
              </span>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div>
                  <small style={{ color: '#64748b', display: 'block' }}>Punctuality Score</small>
                  <strong style={{ fontSize: '18px', color: '#16a34a' }}>{agent.punctualityScore}%</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block' }}>Early Days</small>
                  <strong style={{ fontSize: '18px', color: '#0284c7' }}>{agent.earlyDays}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block' }}>Floor Hours</small>
                  <strong style={{ fontSize: '18px' }}>{agent.totalFloorHours}h</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Full Floor Standings</p>
            <h2>Punctuality & Production Rankings ({activeCampaign})</h2>
          </div>
          <span className="section-meta">{list.length} agents ranked</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Agent</th>
                <th>Campaign</th>
                <th>Punctuality Score</th>
                <th>Days Present</th>
                <th>Before Time (Early)</th>
                <th>On-Time (Grace)</th>
                <th>Late Days</th>
                <th>Total Late Mins</th>
                <th>Total Floor Hours</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((agent, index) => (
                  <tr key={agent.employeeId}>
                    <td>
                      <strong style={{ fontSize: '15px' }}>
                        {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                      </strong>
                    </td>
                    <td>
                      <strong>{agent.name}</strong>
                      <small className="cell-subtitle">
                        {agent.empCode} · {agent.campaignRole || 'Agent'}
                      </small>
                    </td>
                    <td>
                      <span className={`badge-campaign ${getCampaignBadgeClass(agent.campaign)}`}>
                        {agent.campaign}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            maxWidth: '80px',
                          }}
                        >
                          <div
                            style={{
                              width: `${agent.punctualityScore}%`,
                              height: '100%',
                              backgroundColor: agent.punctualityScore >= 90 ? '#16a34a' : agent.punctualityScore >= 75 ? '#0284c7' : '#dc2626',
                            }}
                          />
                        </div>
                        <strong>{agent.punctualityScore}%</strong>
                      </div>
                    </td>
                    <td>{agent.daysPresent}</td>
                    <td>
                      <span className="punctuality-pill punctuality-early" style={{ padding: '2px 8px' }}>
                        🟢 {agent.earlyDays} days
                      </span>
                    </td>
                    <td>
                      <span className="punctuality-pill punctuality-ontime" style={{ padding: '2px 8px' }}>
                        🔵 {agent.onTimeDays} days
                      </span>
                    </td>
                    <td>
                      {agent.lateDays > 0 ? (
                        <span className="punctuality-pill punctuality-late" style={{ padding: '2px 8px' }}>
                          🔴 {agent.lateDays} days
                        </span>
                      ) : (
                        <span className="punctuality-pill punctuality-early" style={{ padding: '2px 8px' }}>
                          ✓ 0 late
                        </span>
                      )}
                    </td>
                    <td>
                      {agent.totalMinutesLate > 0 ? (
                        <strong style={{ color: '#dc2626' }}>{agent.totalMinutesLate} mins</strong>
                      ) : (
                        '0 min'
                      )}
                    </td>
                    <td>
                      <strong>{agent.totalFloorHours} hrs</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={10}>No performance data found for the selected timeframe.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}