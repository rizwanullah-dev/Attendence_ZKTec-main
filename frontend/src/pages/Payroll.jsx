import React, { useState } from 'react';
import { PageHeader, formatCount } from '../App.jsx';

const PAYROLL_DATA = [
  { id: 1, empCode: 'US-101', name: 'Sarah Chen', campaign: 'Medicare Advantage', baseSalary: 85000, daysWorked: 22, lateMins: 0, overtimeHrs: 6.5, deductions: 0, netSalary: 91500, status: 'Calculated' },
  { id: 2, empCode: 'US-102', name: 'Marcus Vance', campaign: 'ACA Intake', baseSalary: 62000, daysWorked: 21, lateMins: 45, overtimeHrs: 0, deductions: 1200, netSalary: 60800, status: 'Calculated' },
  { id: 3, empCode: 'US-103', name: 'Amina El-Sayed', campaign: 'Final Expense', baseSalary: 70000, daysWorked: 22, lateMins: 15, overtimeHrs: 4.0, deductions: 400, netSalary: 73600, status: 'Calculated' },
  { id: 4, empCode: 'US-104', name: 'David Kim', campaign: 'Medicare Advantage', baseSalary: 65000, daysWorked: 20, lateMins: 90, overtimeHrs: 2.0, deductions: 2400, netSalary: 64600, status: 'Calculated' },
  { id: 5, empCode: 'US-105', name: 'Elena Rostova', campaign: 'Quality Assurance', baseSalary: 75000, daysWorked: 22, lateMins: 0, overtimeHrs: 0, deductions: 0, netSalary: 75000, status: 'Calculated' },
];

export default function Payroll() {
  const [cycle, setCycle] = useState('November 2026 (Monthly)');
  const [data, setData] = useState(PAYROLL_DATA);
  const [processed, setProcessed] = useState(false);

  const totalPayout = data.reduce((sum, item) => sum + item.netSalary, 0);
  const totalDeductions = data.reduce((sum, item) => sum + item.deductions, 0);
  const totalOvertime = data.reduce((sum, item) => sum + item.overtimeHrs, 0);

  function runSyncBiometrics() {
    setProcessed(true);
    setTimeout(() => {
      alert('Unified Systems: Biometric punches and shift allowances synced successfully!');
    }, 400);
  }

  return (
    <div>
      <PageHeader
        eyebrow="FlowHCM Module"
        title="Automated Payroll & Deductions"
        description="Single-click payroll calculation directly driven by ZKTeco hardware punches, late arrivals, and approved leaves."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="button-secondary" onClick={runSyncBiometrics}>
              ⚡ Sync ZKTeco Biometrics
            </button>
            <button className="button-label" onClick={() => alert('Exporting Official Unified Systems Payroll Report (Excel)...')}>
              📥 Export Bank Payroll File
            </button>
          </div>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <span>Total Net Payout</span>
          <strong style={{ color: '#0369a1' }}>${formatCount(totalPayout)}</strong>
          <small className="stat-note positive">Active cycle disbursement</small>
        </div>
        <div className="stat-card">
          <span>Biometric Deductions</span>
          <strong style={{ color: '#cf4051' }}>${formatCount(totalDeductions)}</strong>
          <small className="stat-note">Late penalties & unapproved leaves</small>
        </div>
        <div className="stat-card">
          <span>Overtime Hours</span>
          <strong style={{ color: '#159570' }}>{totalOvertime} hrs</strong>
          <small className="stat-note positive">Verified biometric extra hours</small>
        </div>
        <div className="stat-card">
          <span>Active Agents</span>
          <strong>{data.length} Staff</strong>
          <small className="stat-note">Unified Systems Call Center</small>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <div>
            <strong>Cycle: </strong>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>{cycle}</span>
          </div>
          <span className="section-meta">Calculated based on standard 8-hr floor shifts</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Campaign</th>
                <th>Base Pay</th>
                <th>Days Worked</th>
                <th>Late (Mins)</th>
                <th>OT Hours</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span className="cell-subtitle">{row.empCode}</span>
                  </td>
                  <td>
                    <span className="badge-campaign badge-general">{row.campaign}</span>
                  </td>
                  <td>${formatCount(row.baseSalary)}</td>
                  <td><strong>{row.daysWorked}</strong> days</td>
                  <td>
                    <span style={{ color: row.lateMins > 0 ? '#b91c1c' : '#15803d', fontWeight: 600 }}>
                      {row.lateMins} m
                    </span>
                  </td>
                  <td>
                    <span style={{ color: row.overtimeHrs > 0 ? '#15803d' : '#64748b', fontWeight: 600 }}>
                      +{row.overtimeHrs} h
                    </span>
                  </td>
                  <td style={{ color: '#cf4051', fontWeight: 600 }}>-${formatCount(row.deductions)}</td>
                  <td>
                    <strong style={{ color: '#0f172a', fontSize: '15px' }}>${formatCount(row.netSalary)}</strong>
                  </td>
                  <td>
                    <span className="status-pill online">
                      {row.status}
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
