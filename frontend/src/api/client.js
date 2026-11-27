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
      data: { token: 'unified-token-2026', user: mockUser },
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

  // Break monitor live status mock
  if (url.includes('/attendance/break-monitor')) {
    const mockBreakRecords = [
      {
        employeeId: 1,
        name: 'Sarah Chen',
        empCode: 'MED-101',
        campaign: 'Medicare Advantage',
        campaignRole: 'Floor Closer',
        station: 'Desk 01',
        currentAuxState: 'available',
        currentAuxSince: null,
        totalTeaMin: 12,
        totalLunchMin: 28,
        isOverdue: false,
        teaOverrun: 0,
        lunchOverrun: 0,
      },
      {
        employeeId: 2,
        name: 'Marcus Vance',
        empCode: 'MED-102',
        campaign: 'Medicare Advantage',
        campaignRole: 'Qualifier',
        station: 'Desk 02',
        currentAuxState: 'on_tea_break',
        currentAuxSince: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        currentBreakElapsedMin: 11,
        totalTeaMin: 11,
        totalLunchMin: 0,
        isOverdue: false,
        teaOverrun: 0,
        lunchOverrun: 0,
      },
      {
        employeeId: 3,
        name: 'Amina El-Sayed',
        empCode: 'ACA-201',
        campaign: 'ACA Intake',
        campaignRole: 'Closer',
        station: 'Desk 11',
        currentAuxState: 'on_lunch',
        currentAuxSince: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        currentBreakElapsedMin: 32,
        totalTeaMin: 14,
        totalLunchMin: 32,
        isOverdue: false,
        teaOverrun: 0,
        lunchOverrun: 0,
      },
      {
        employeeId: 4,
        name: 'David Kim',
        empCode: 'FE-301',
        campaign: 'Final Expense',
        campaignRole: 'Closer',
        station: 'Desk 21',
        currentAuxState: 'in_coaching',
        currentAuxSince: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        currentBreakElapsedMin: 20,
        totalTeaMin: 15,
        totalLunchMin: 30,
        isOverdue: false,
        teaOverrun: 0,
        lunchOverrun: 0,
      },
      {
        employeeId: 5,
        name: 'Elena Rostova',
        empCode: 'QA-401',
        campaign: 'Quality Assurance',
        campaignRole: 'QA Analyst',
        station: 'Desk 30',
        currentAuxState: 'on_tea_break',
        currentAuxSince: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
        currentBreakElapsedMin: 19,
        totalTeaMin: 19,
        totalLunchMin: 40,
        isOverdue: true,
        teaOverrun: 4,
        lunchOverrun: 0,
      },
    ];
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { records: mockBreakRecords },
    };
  }

  // Floor status summary
  if (url.includes('/attendance/floor-status')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        counts: {
          activeOnFloor: 18,
          totalAgents: 24,
          onBreak: 2,
          onLunch: 1,
          inCoaching: 1,
          byCampaign: {
            'Medicare Advantage': 10,
            'ACA Intake': 8,
            'Final Expense': 6,
          },
        },
        roster: [],
      },
    };
  }

  // Punctuality today
  if (url.includes('/attendance/punctuality-today')) {
    const mockTracker = [
      {
        employeeId: 1,
        employeeName: 'Sarah Chen',
        name: 'Sarah Chen',
        empCode: 'US-101',
        campaign: 'Medicare Advantage',
        campaignRole: 'Floor Closer',
        station: 'Desk 01',
        shiftSchedule: { name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
        checkInTime: new Date(new Date().setHours(8, 48, 12)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'early', earlyMinutes: 12, lateMinutes: 0, label: '12m Early', tag: 'Early Arrival' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active On Shift', tag: 'Still On Shift' },
          durationHours: 4.5,
        },
      },
      {
        employeeId: 2,
        employeeName: 'Marcus Vance',
        name: 'Marcus Vance',
        empCode: 'US-102',
        campaign: 'Medicare Advantage',
        campaignRole: 'Qualifier',
        station: 'Desk 02',
        shiftSchedule: { name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
        checkInTime: new Date(new Date().setHours(9, 23, 40)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'late', earlyMinutes: 0, lateMinutes: 23, label: '23m Late', tag: 'Late Arrival' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active On Shift', tag: 'Still On Shift' },
          durationHours: 3.8,
        },
      },
      {
        employeeId: 3,
        employeeName: 'Amina El-Sayed',
        name: 'Amina El-Sayed',
        empCode: 'US-103',
        campaign: 'ACA Intake',
        campaignRole: 'Closer',
        station: 'Desk 11',
        shiftSchedule: { name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
        checkInTime: new Date(new Date().setHours(8, 55, 0)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'early', earlyMinutes: 5, lateMinutes: 0, label: '5m Early', tag: 'Early Arrival' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active On Shift', tag: 'Still On Shift' },
          durationHours: 4.2,
        },
      },
      {
        employeeId: 4,
        employeeName: 'David Kim',
        name: 'David Kim',
        empCode: 'US-104',
        campaign: 'Final Expense',
        campaignRole: 'Closer',
        station: 'Desk 21',
        shiftSchedule: { name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
        checkInTime: new Date(new Date().setHours(9, 0, 5)).toISOString(),
        checkOutTime: null,
        adherence: {
          checkIn: { status: 'on_time', earlyMinutes: 0, lateMinutes: 0, label: 'On Time', tag: 'Exact On Time' },
          checkOut: { status: 'active', earlyMinutes: 0, overtimeMinutes: 0, label: 'Active On Shift', tag: 'Still On Shift' },
          durationHours: 4.1,
        },
      },
    ];
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        metrics: { adherenceRate: 94, total: 4, early: 2, onTime: 1, late: 1, onTimeOrEarly: 3, lateArrivals: 1 },
        tracker: mockTracker,
      },
    };
  }

  // Leaderboard mock
  if (url.includes('/attendance/leaderboard')) {
    const mockLeaderboard = [
      { employeeId: 1, name: 'Sarah Chen', empCode: 'US-101', campaign: 'Medicare Advantage', adherenceScore: 98.5, earlyArrivals: 18, onTimeArrivals: 3, lateArrivals: 0, totalHours: 176 },
      { employeeId: 3, name: 'Amina El-Sayed', empCode: 'US-103', campaign: 'ACA Intake', adherenceScore: 96.2, earlyArrivals: 16, onTimeArrivals: 4, lateArrivals: 1, totalHours: 172 },
      { employeeId: 4, name: 'David Kim', empCode: 'US-104', campaign: 'Final Expense', adherenceScore: 94.0, earlyArrivals: 12, onTimeArrivals: 7, lateArrivals: 2, totalHours: 168 },
      { employeeId: 2, name: 'Marcus Vance', empCode: 'US-102', campaign: 'Medicare Advantage', adherenceScore: 89.4, earlyArrivals: 8, onTimeArrivals: 9, lateArrivals: 4, totalHours: 160 },
    ];
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { leaderboard: mockLeaderboard },
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
      result = result.filter(
        (e) =>
          e.name?.toLowerCase().includes(search) ||
          e.empCode?.toLowerCase().includes(search)
      );
    }
    return { status: 200, statusText: 'OK', headers: {}, config, data: result };
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
