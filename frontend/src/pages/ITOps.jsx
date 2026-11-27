import React, { useState } from 'react';
import { PageHeader, formatExactDateTime } from '../App.jsx';

const HARDWARE_DEVICES = [
  { id: 1, name: 'Main Lobby Reader', model: 'ZKTeco 40', ip: '192.168.1.201', port: 4370, protocol: 'TCP Standalone', location: 'Main Entrance Gate', status: 'online', latency: '4ms', firmware: 'Ver 6.60', lastHeartbeat: new Date().toISOString() },
  { id: 2, name: 'Call Center Floor 1 Gate', model: 'ZKTeco 50i', ip: '192.168.1.202', port: 4370, protocol: 'TCP Standalone', location: 'Floor A (Medicare / ACA)', status: 'online', latency: '6ms', firmware: 'Ver 7.12', lastHeartbeat: new Date().toISOString() },
  { id: 3, name: 'Executive Suite Gate', model: 'ZKTeco 40', ip: '192.168.1.203', port: 4370, protocol: 'TCP Standalone', location: 'Management Floor 2', status: 'online', latency: '9ms', firmware: 'Ver 6.60', lastHeartbeat: new Date().toISOString() },
  { id: 4, name: 'Warehouse / Server Room', model: 'ZKTeco 50i', ip: '192.168.1.204', port: 4370, protocol: 'TCP Standalone', location: 'Data Center Basement', status: 'offline', latency: 'Timeout', firmware: 'Ver 6.55', lastHeartbeat: '2026-11-26T22:14:00' },
];

export default function ITOps() {
  const [devices, setDevices] = useState(HARDWARE_DEVICES);
  const [testing, setTesting] = useState(false);

  function pingAll() {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      alert('IT Operations: Device ping and handshake completed. 3 of 4 terminals actively streaming punches.');
    }, 600);
  }

  return (
    <div>
      <PageHeader
        eyebrow="FlowHCM IT Infrastructure"
        title="Hardware & Network Device Console"
        description="Unified Systems IT Admin: ZKTeco biometric terminals, socket listeners, and live TCP sync diagnostics."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="button-secondary" onClick={pingAll} disabled={testing}>
              {testing ? 'Testing Socket Ports…' : '⚡ Run Socket Diagnostics'}
            </button>
            <a href="#/devices" className="button-label" style={{ textDecoration: 'none' }}>
              + Register New Terminal
            </a>
          </div>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <span>Active Terminals</span>
          <strong style={{ color: '#34d399' }}>3 / 4 Online</strong>
          <small className="stat-note positive">75% fleet availability</small>
        </div>
        <div className="stat-card">
          <span>TCP Socket Status</span>
          <strong style={{ color: '#38bdf8' }}>Port 4370 Open</strong>
          <small className="stat-note">Persistent ZKLib connection</small>
        </div>
        <div className="stat-card">
          <span>Biometric Poll Rate</span>
          <strong>Every 5 Mins</strong>
          <small className="stat-note">Real-time push + polling safety</small>
        </div>
        <div className="stat-card">
          <span>Network Health</span>
          <strong style={{ color: '#fbbf24' }}>Avg Latency 5ms</strong>
          <small className="stat-note">Local LAN subnets verified</small>
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Terminal Management</p>
            <h2>Connected ZKTeco 40 & 50i Terminals</h2>
          </div>
          <span className="section-meta">{devices.length} Configured Terminals</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Device Name</th>
                <th>Hardware Model</th>
                <th>IP & Port</th>
                <th>Physical Location</th>
                <th>Ping Latency</th>
                <th>Last Push Heartbeat</th>
                <th>Connection Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    <span className="cell-subtitle">FW: {d.firmware}</span>
                  </td>
                  <td><span className="type-badge">{d.model}</span></td>
                  <td>
                    <code style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{d.ip}:{d.port}</code>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{d.location}</td>
                  <td>
                    <span style={{ color: d.status === 'online' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {d.latency}
                    </span>
                  </td>
                  <td>{formatExactDateTime(d.lastHeartbeat)}</td>
                  <td>
                    <span className={`status-pill ${d.status === 'online' ? 'online' : 'offline'}`}>
                      {d.status}
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
