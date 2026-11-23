import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { EmptyRow, PageHeader, formatDate, getErrorMessage, usePageTitle, safeArray } from '../App.jsx';

export default function Devices() {
  usePageTitle('Devices');
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({ name: '', model: '40i', ip: '', port: 4370, location: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function load() {
    api
      .get('/devices')
      .then((r) => setDevices(safeArray(r.data)))
      .catch((e) => setError(getErrorMessage(e)));
  }

  useEffect(load, []);

  async function addDevice(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/devices', form);
      if (res.data) {
        setDevices((prev) => [...safeArray(prev), res.data]);
        setSuccess('Device added successfully.');
      }
      setForm({ name: '', model: '40i', ip: '', port: 4370, location: '' });
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function syncNow(id) {
    setError('');
    setSuccess('');
    try {
      await api.post(`/devices/${id}/sync-now`);
      setSuccess('Sync triggered successfully.');
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const deviceList = safeArray(devices);

  return (
    <>
      <PageHeader
        eyebrow="Infrastructure"
        title="Devices"
        description="Connect and monitor ZKTeco terminals across your workplace."
      />
      {error && <div className="feedback error">{error}</div>}
      {success && <div className="feedback" style={{ color: 'var(--green)', padding: '12px' }}>{success}</div>}
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">New connection</p>
            <h2>Add ZKTeco device</h2>
          </div>
        </div>
        <form className="device-form" onSubmit={addDevice}>
          <input placeholder="Device name" value={form.name} onChange={update('name')} required />
          <select value={form.model} onChange={update('model')}>
            <option value="40i">ZKTeco 40i</option>
            <option value="50i">ZKTeco 50i</option>
          </select>
          <input placeholder="IP address" value={form.ip} onChange={update('ip')} required />
          <input placeholder="Port" type="number" value={form.port} onChange={update('port')} />
          <input placeholder="Location" value={form.location} onChange={update('location')} />
          <button type="submit">Add device</button>
        </form>
      </section>
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Network</p>
            <h2>Connected devices</h2>
          </div>
          <span className="section-meta">{deviceList.length} configured</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Last sync</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {deviceList.length ? (
                deviceList.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.name}</strong>
                      <small className="cell-subtitle">
                        {d.model} · {d.location || 'No location'}
                      </small>
                    </td>
                    <td>
                      {d.ip}:{d.port}
                    </td>
                    <td>
                      <span className={`status-pill ${d.status === 'online' ? 'online' : 'offline'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>{formatDate(d.lastSyncAt)}</td>
                    <td>
                      <button className="button-secondary" onClick={() => syncNow(d.id)}>
                        ↻ Sync
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={5}>Add your first device to begin syncing.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
