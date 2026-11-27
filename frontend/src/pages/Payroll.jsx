import React, { useState } from 'react';
import { PageHeader, formatCount, getStoredUser } from '../App.jsx';

const PAYROLL_DATA = [
  { id: 1, empCode: 'US-101', name: 'Sarah Chen', campaign: 'Medicare Advantage', baseSalary: 85000, daysWorked: 22, lateMins: 0, overtimeHrs: 6.5, deductions: 0, netSalary: 91500, status: 'Calculated' },
  { id: 2, empCode: 'US-102', name: 'Marcus Vance', campaign: 'ACA Intake', baseSalary: 62000, daysWorked: 21, lateMins: 45, overtimeHrs: 0, deductions: 1200, netSalary: 60800, status: 'Calculated' },
  { id: 3, empCode: 'US-103', name: 'Amina El-Sayed', campaign: 'Final Expense', baseSalary: 70000, daysWorked: 22, lateMins: 15, overtimeHrs: 4.0, deductions: 400, netSalary: 73600, status: 'Calculated' },
  { id: 4, empCode: 'US-104', name: 'David Kim', campaign: 'Medicare Advantage', baseSalary: 65000, daysWorked: 20, lateMins: 90, overtimeHrs: 2.0, deductions: 2400, netSalary: 64600, status: 'Calculated' },
  { id: 5, empCode: 'US-105', name: 'Elena Rostova', campaign: 'Quality Assurance', baseSalary: 75000, daysWorked: 22, lateMins: 0, overtimeHrs: 0, deductions: 0, netSalary: 75000, status: 'Calculated' },
];

export default function Payroll() {
  const user = getStoredUser();
  const isEmployee = user?.role === 'employee' || user?.role === 'agent';
  const myCode = user?.empCode || 'US-101';

  const [cycle] = useState('November 2026 (Monthly)');
  // If Employee, only show their own payroll record; if HR/Admin show entire floor
  const [data] = useState(
    isEmployee ? PAYROLL_DATA.filter(p => p.empCode === myCode) : PAYROLL_DATA
  );

  const totalPayout = data.reduce((sum, item) => sum + item.netSalary, 0);
  const totalDeductions = data.reduce((sum, item) => sum + item.deductions, 0);
  const totalOvertime = data.reduce((sum, item) => sum + item.overtimeHrs, 0);

  function runSyncBiometrics() {
    alert('Unified Systems: Biometric punches and shift allowances synced successfully!');
  }

  return (
    <div>
      <PageHeader
        eyebrow="FlowHCM Payroll Module"
        title={isEmployee ? "My Salary & Payslip Details" : "Automated Payroll & Deductions"}
        description={isEmployee 
          ? "View your personal earnings, verified biometric overtime, and attendance deduction breakdown."
          : "Single-click payroll calculation directly driven by ZKTeco hardware punches, late arrivals, and approved leaves."}
        actions={
          isEmployee ? (
            <button className="button-label" onClick={() => alert('Downloading official Unified Systems PDF Payslip...')}>
              📄 Download Official Payslip (PDF)
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="button-secondary" onClick={runSyncBiometrics}>
                ⚡ Sync ZKTeco Biometrics
              </button>
              <button className="button-label" onClick={() => alert('Exporting Official Unified Systems Payroll Report (Excel)...')}>
                📥 Export Bank Payroll File
              </button>
            </div>
          )
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <span>{isEmployee ? "Net Disbursed Amount" : "Total Net Payout"}</span>
          <strong style={{ color: '#38bdf8' }}>${formatCount(totalPayout)}</strong>
          <small className="stat-note positive">{cycle}</small>
        </div>
        <div className="stat-card">
          <span>Attendance Deductions</span>
          <strong style={{ color: totalDeductions > 0 ? '#ef4444' : '#10b981' }}>
            ${formatCount(totalDeductions)}
          </strong>
          <small className="stat-note">{isEmployee ? "Zero late penalty" : "Late penalties & unapproved leaves"}</small>
        </div>
        <div className="stat-card">
          <span>Verified Overtime</span>
          <strong style={{ color: '#10b981' }}>{totalOvertime} hrs</strong>
          <small className="stat-note positive">Hardware timestamp verified</small>
        </div>
        <div className="stat-card">
          <span>{isEmployee ? "Days Present" : "Active Staff"}</span>
          <strong>{isEmployee ? "22 Days" : `${data.length} Staff`}</strong>
          <small className="stat-note">{isEmployee ? "100% floor attendance" : "Unified Systems Roster"}</small>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: '16px' }}>
          <div>
            <strong>Payroll Cycle: </strong>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{cycle}</span>
          </div>
          <span className="section-meta">
            {isEmployee ? "Individual Salary Statement" : "Calculated from standard 8-hr floor shifts"}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{isEmployee ? "Employee Profile" : "Agent"}</th>
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
                    <span style={{ color: row.lateMins > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
                      {row.lateMins} m
                    </span>
                  </td>
                  <td>
                    <span style={{ color: row.overtimeHrs > 0 ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                      +{row.overtimeHrs} h
                    </span>
                  </td>
                  <td style={{ color: row.deductions > 0 ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
                    -${formatCount(row.deductions)}
                  </td>
                  <td>
                    <strong style={{ color: '#f8fafc', fontSize: '15px' }}>${formatCount(row.netSalary)}</strong>
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
