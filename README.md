# Unified Systems — Human Capital & Biometric Workforce Management System

An enterprise-grade **Human Capital Management (HCM) and Workforce Management (WFM)** platform custom-built for **Unified Systems** call center operations. It features real-time biometric synchronization with **ZKTeco 40 and 50i hardware terminals** (via TCP port 4370), live shift adherence, AUX break monitoring, FlowHCM-inspired leave & payroll automation, and strict role-segregated portals.

---

## 🌟 Key Highlights & Architecture

- **Official Call Center Identity**: Unified Systems branding, custom executive oceanic navy/cyan design theme, and official company emblem.
- **Hardware Integration**: Live socket push listener + 5-minute automated polling fallback for **ZKTeco 40 & 50i** devices using `node-zklib` over TCP port 4370.
- **FlowHCM Super Modules**:
  - **Leave & Absence Management**: Self-service leave applications with multi-tier HR approvals to prevent false absenteeism on the floor.
  - **Automated Biometric Payroll**: Single-click salary calculation directly factoring in days worked, verified overtime hours, and minute-accurate late arrival penalties.
- **Strict Role-Based Access Control (RBAC)**: Dedicated, isolated portals for **Employees (Agents)**, **HR Managers**, **IT Engineers**, and **Operations Administrators** with zero cross-module clutter or unauthorized access.
- **Responsive Command Center**: Fully responsive interface optimized for mobile devices, supervisor tablets, and large wall-mounted floor monitors.

---

## 🔐 Official Module Login Credentials

Each role accesses their own dedicated dashboard with custom options and strict security guards upon login:

| Role / Module | Official Email ID | Default Password | Default Landing Dashboard | Scope of Access |
| :--- | :--- | :--- | :--- | :--- |
| **Call Center Agent (Employee ESS)** | `sarah.chen@unifiedsystems.com` | `Unified2026!` | `#/my-portal` | Personal daily biometric punches (Clock In/Out, Tea, Lunch), shift schedule, personal leave requests, and private payslip. |
| **HR & People Manager** | `hr@unifiedsystems.com` | `Unified2026!` | `#/employees` | Employee directory, leave approval queue (Approve/Reject), company-wide payroll generation, and attendance audit reports. |
| **IT & Hardware Engineer** | `it@unifiedsystems.com` | `Unified2026!` | `#/it-ops` | ZKTeco 40 & 50i terminal fleet diagnostics, IP/Port 4370 TCP socket health, ping latencies, and raw biometric stream. |
| **Operations Admin** | `admin@unifiedsystems.com` | `Unified2026!` | `#/` | Executive Floor Command Center, real-time floor occupancy, campaign filters (Medicare, ACA, Final Expense), break monitor, and full system configuration. |

---

## 🖥️ Modular Overview & Features

### 1. Employee Self-Service (ESS) Portal (`#/my-portal`)
- **Daily Biometric Punches**: Displays exact millisecond timestamps from ZKTeco terminals for Shift Clock In, Tea Break Exit/Return, Lunch Break Exit/Return, and Shift Clock Out.
- **Assigned Shift Card**: Live feedback on scheduled shift hours (e.g. `09:00 AM – 06:00 PM`), punctuality status (e.g. `8 mins early`), and floor state (`🟢 Verified On Floor`).
- **Personal Entitlements**: Real-time view of remaining casual, sick, and annual leave quotas and verified overtime hours.
- **Apply for Leave**: Paperless leave request submissions.
- **Private Payslip**: Direct viewing and download of monthly salary calculations.

### 2. HR & People Operations Portal (`#/employees`, `#/leaves`, `#/payroll`)
- **Employee Directory**: Manage agent profiles, designations, campaigns, and physical station assignments.
- **Leave Approvals Engine**: Centralized queue to approve or reject leave applications, automatically updating attendance exception lists.
- **Automated Payroll**: Calculates gross base pay, verified overtime compensation, and minute-level late arrival deductions with one-click bank export capabilities.
- **Campaign Attendance Reports**: Date-range summaries filtering by Medicare Advantage, ACA Intake, and Final Expense campaigns with Excel export support.

### 3. IT Infrastructure & Hardware Console (`#/it-ops`, `#/devices`)
- **Biometric Fleet Monitoring**: Real-time operational status (Online / Offline), ping latency (ms), and firmware versions across all connected ZKTeco readers:
  - *Main Lobby Reader* (ZKTeco 40 - IP `192.168.1.201:4370`)
  - *Call Center Floor 1 Gate* (ZKTeco 50i - IP `192.168.1.202:4370`)
  - *Executive Suite Gate* (ZKTeco 40 - IP `192.168.1.203:4370`)
  - *Server Room Gate* (ZKTeco 50i - IP `192.168.1.204:4370`)
- **Socket Diagnostics**: Live TCP socket tests and packet telemetry.
- **Raw Punch Stream**: Direct view of hardware punch events in real time.

### 4. Operations Floor Command Center (`#/`)
- **Real-Time Floor Strength**: Active call floor agent counts, percentage floor utilization, and punctuality adherence scores.
- **Campaign Filters**: Instant switcher between **Medicare Advantage**, **ACA Intake**, and **Final Expense**.
- **Supervisor Break & AUX Monitor**: Live tracking of agents on 15-minute tea breaks, 45-minute lunch breaks, and offline coaching sessions, with automatic warnings for overruns.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL (or Docker for running containerized DB)
- ZKTeco devices connected to the local network on TCP port 4370

### Quick Start (Frontend Development)
```bash
# 1. Clone repository
git clone https://github.com/rizwanullah-dev/Attendence_ZKTec-main.git
cd Attendence_ZKTec-main

# 2. Install dependencies
cd frontend
npm install

# 3. Start live server
npm run dev -- --host 0.0.0.0 --port 5173
```
Open **`http://localhost:5173/`** in your browser.

### Backend Setup (PostgreSQL + ZKTeco Link)
```bash
cd backend
cp .env.example .env   # Configure DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run migrate        # Runs database schema migrations
npm run dev            # Starts backend API on port 5000
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router DOM (v6), Modern Vanilla CSS with responsive design system.
- **Backend**: Node.js, Express, Sequelize ORM.
- **Database**: PostgreSQL.
- **Hardware Driver**: `node-zklib` (ZKTeco Standalone TCP Protocol, port 4370).
- **Design System**: Unified Systems Executive Dark Command Palette (`#090E17`, `#0284C7`, `#10B981`, `#06B6D4`).

---

## 🔒 Security & Route Protection
All routes are guarded by client-side and server-side authorization checks (`RoleRouteGuard`). If any authenticated user attempts to access an unauthorized URL (e.g. an employee manually typing `#/devices` or `#/employees`), the system automatically intercepts the attempt and redirects them back to their authorized dashboard.
