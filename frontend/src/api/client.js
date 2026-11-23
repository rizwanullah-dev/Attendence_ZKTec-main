import axios from 'axios';
import {
  mockUser,
  mockDevices,
  mockEmployees,
  mockAttendanceRecords,
  mockReportsSummary,
} from './mockData';

export const isDemoMode = () => {
  return localStorage.getItem('demo_mode') === 'true';
};

export const setDemoMode = (enabled) => {
  if (enabled) {
    localStorage.setItem('demo_mode', 'true');
    localStorage.removeItem('backend_connected');
  } else {
    localStorage.removeItem('demo_mode');
    localStorage.setItem('backend_connected', 'true');
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 3000,
  headers: { 'Content-Type': 'application/json' },
});

// Provide realistic mock responses when running frontend-only without a live backend
export function handleMockResponse(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  if (url.includes('/auth/login')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { token: 'demo-token-attendly', user: mockUser },
    };
  }

  if (url.includes('/devices')) {
    if (method === 'post') {
      const newDevice = {
        id: Date.now(),
        name: config.data?.name || 'New Device',
        model: config.data?.model || '40i',
        ip: config.data?.ip || '192.168.1.250',
        port: config.data?.port || 4370,
        location: config.data?.location || 'New Location',
        status: 'online',
        lastSyncAt: new Date().toISOString(),
      };
      return { status: 201, statusText: 'Created', headers: {}, config, data: newDevice };
    }
    return { status: 200, statusText: 'OK', headers: {}, config, data: mockDevices };
  }

  if (url.includes('/attendance/punctuality-today')) {
    const mockTracker = [
      {
        employeeId: 1,
        name: 'Sarah Chen',
        empCode: 'MED-101',
        campaign: 'Medicare',
        campaignRole: 'Closer',
        station: 'Desk 01',
        shiftStart: '19:00:00',
        shiftEnd: '04:00:00',
        checkInTime: new Date(new Date().setHours(18, 48, 12)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'early', earlyMinutes: 12, lateMinutes: 0, label: '12m Before Time', tag: 'Before Time' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active / Not Checked Out', tag: 'Still On Shift' },
          durationHours: 4.5,
        },
      },
      {
        employeeId: 2,
        name: 'David Miller',
        empCode: 'MED-102',
        campaign: 'Medicare',
        campaignRole: 'Qualifier / Opener',
        station: 'Desk 02',
        shiftStart: '19:00:00',
        shiftEnd: '04:00:00',
        checkInTime: new Date(new Date().setHours(19, 23, 40)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'late', earlyMinutes: 0, lateMinutes: 23, label: '23m Late Arrival', tag: 'Late Arrival' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active / Not Checked Out', tag: 'Still On Shift' },
          durationHours: 3.8,
        },
      },
      {
        employeeId: 4,
        name: 'Alex Rivera',
        empCode: 'ACA-201',
        campaign: 'ACA',
        campaignRole: 'Closer',
        station: 'Desk 11',
        shiftStart: '19:00:00',
        shiftEnd: '04:00:00',
        checkInTime: new Date(new Date().setHours(18, 55, 0)).toISOString(),
        checkOutTime: new Date(new Date().setHours(4, 30, 0)).toISOString(),
        adherence: {
          checkIn: { status: 'early', earlyMinutes: 5, lateMinutes: 0, label: '5m Before Time', tag: 'Before Time' },
          checkOut: { status: 'overtime', earlyMinutes: 0, overtimeMinutes: 30, label: '+30m Overtime', tag: 'Overtime' },
          durationHours: 9.5,
        },
      },
      {
        employeeId: 7,
        name: 'Robert Wilson',
        empCode: 'FE-301',
        campaign: 'Final Expense',
        campaignRole: 'Closer',
        station: 'Desk 21',
        shiftStart: '19:00:00',
        shiftEnd: '04:00:00',
        checkInTime: new Date(new Date().setHours(19, 0, 5)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'on_time', earlyMinutes: 0, lateMinutes: 0, label: 'Exact On Time', tag: 'On Time' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active / Not Checked Out', tag: 'Still On Shift' },
          durationHours: 4.2,
        },
      },
    ];
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        metrics: { total: 4, early: 2, onTime: 1, late: 1, absent: 0, notCheckedOut: 3, checkedOut: 1 },
        tracker: mockTracker,
      },
    };
  }

  if (url.includes('/attendance/import')) {
    return { status: 200, statusText: 'OK', headers: {}, config, data: { recordsSaved: 42 } };
  }

  if (url.includes('/attendance')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { records: mockAttendanceRecords, count: mockAttendanceRecords.length },
    };
  }

  if (url.includes('/employees/import')) {
    return { status: 200, statusText: 'OK', headers: {}, config, data: { created: 5, updated: 2 } };
  }

  if (url.includes('/employees')) {
    const search = config.params?.search?.toLowerCase();
    let result = mockEmployees;
    if (search) {
      result = mockEmployees.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.empCode.toLowerCase().includes(search) ||
          e.department.toLowerCase().includes(search)
      );
    }
    return { status: 200, statusText: 'OK', headers: {}, config, data: result };
  }

  if (url.includes('/reports/summary/export')) {
    const csvContent =
      'Employee,Department,Present,Absent,Late,Total Hours\n' +
      mockReportsSummary
        .map((r) => `"${r.name}","${r.department}",${r.daysPresent},${r.daysAbsent},${r.lateDays},${r.totalHours}`)
        .join('\n');
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: new Blob([csvContent], { type: 'text/csv' }),
    };
  }

  if (url.includes('/reports/summary')) {
    return { status: 200, statusText: 'OK', headers: {}, config, data: mockReportsSummary };
  }

  return { status: 200, statusText: 'OK', headers: {}, config, data: {} };
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If in demo mode, serve mock data immediately without generating network proxy errors
  if (localStorage.getItem('demo_mode') === 'true') {
    config.adapter = () => Promise.resolve(handleMockResponse(config));
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // If Vite dev server SPA fallback served index.html instead of a backend API response
    const isHtml =
      typeof response.data === 'string' &&
      response.data.trim().toLowerCase().startsWith('<!doctype html>');
    if (isHtml) {
      setDemoMode(true);
      return handleMockResponse(response.config);
    }
    localStorage.setItem('backend_connected', 'true');
    return response;
  },
  (error) => {
    // Catch backend connection issues (proxy 500/502/504, 404, network drops)
    const isOfflineOrProxyError =
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 404 ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED';

    if (isOfflineOrProxyError) {
      setDemoMode(true);
      return Promise.resolve(handleMockResponse(error.config || {}));
    }

    if (error.response?.status === 401 && window.location.hash !== '#/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export function getApiError(error, fallback = 'Request failed. Please try again.') {
  return error.response?.data?.error || (error.code === 'ECONNABORTED' ? 'The request timed out.' : fallback);
}
