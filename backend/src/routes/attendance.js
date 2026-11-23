const express = require('express');
const multer = require('multer');
const { Op } = require('sequelize');
const { AttendanceLog, Employee, Device } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { importAttendanceFiles } = require('../services/importService');
const { calculateShiftAdherence } = require('../services/punctualityService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(requireAuth);

// Live Call Center Floor Status
router.get('/floor-status', async (req, res) => {
  const { campaign } = req.query;
  const whereEmp = { status: 'active' };
  if (campaign && campaign !== 'All') whereEmp.campaign = campaign;

  const employees = await Employee.findAll({
    where: whereEmp,
    order: [['campaign', 'ASC'], ['name', 'ASC']],
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const roster = [];
  const counts = {
    total: employees.length,
    onFloor: 0,
    onBreak: 0,
    onLunch: 0,
    inCoaching: 0,
    loggedOut: 0,
    byCampaign: {
      Medicare: { total: 0, active: 0 },
      ACA: { total: 0, active: 0 },
      'Final Expense': { total: 0, active: 0 },
    },
  };

  for (const emp of employees) {
    if (!counts.byCampaign[emp.campaign]) {
      counts.byCampaign[emp.campaign] = { total: 0, active: 0 };
    }
    counts.byCampaign[emp.campaign].total++;

    const latestPunch = await AttendanceLog.findOne({
      where: {
        employeeId: emp.id,
        timestamp: { [Op.between]: [todayStart, todayEnd] },
      },
      order: [['timestamp', 'DESC']],
    });

    let currentStatus = 'logged_out';
    if (latestPunch) {
      const type = latestPunch.punchType;
      if (['check_in', 'break_end', 'lunch_end'].includes(type)) {
        currentStatus = 'on_floor';
      } else if (type === 'break_start') {
        currentStatus = 'on_break';
      } else if (type === 'lunch_start') {
        currentStatus = 'on_lunch';
      } else if (['coaching', 'meeting'].includes(type)) {
        currentStatus = 'in_coaching';
      } else if (type === 'check_out') {
        currentStatus = 'logged_out';
      }
    }

    if (currentStatus === 'on_floor') {
      counts.onFloor++;
      counts.byCampaign[emp.campaign].active++;
    } else if (currentStatus === 'on_break') {
      counts.onBreak++;
    } else if (currentStatus === 'on_lunch') {
      counts.onLunch++;
    } else if (currentStatus === 'in_coaching') {
      counts.inCoaching++;
    } else {
      counts.loggedOut++;
    }

    roster.push({
      employeeId: emp.id,
      name: emp.name,
      empCode: emp.empCode,
      campaign: emp.campaign || 'Medicare',
      campaignRole: emp.campaignRole || 'Closer',
      station: emp.station || '—',
      currentStatus,
      lastPunchTime: latestPunch ? latestPunch.timestamp : null,
      lastPunchType: latestPunch ? latestPunch.punchType : null,
      lastPunchNotes: latestPunch ? latestPunch.notes : null,
    });
  }

  res.json({ counts, roster });
});

// Today's Shift Punctuality & Adherence Tracker (Early, On Time, Late, Checkout status)
router.get('/punctuality-today', async (req, res) => {
  const { campaign } = req.query;
  const whereEmp = { status: 'active' };
  if (campaign && campaign !== 'All') whereEmp.campaign = campaign;

  const employees = await Employee.findAll({
    where: whereEmp,
    order: [['campaign', 'ASC'], ['name', 'ASC']],
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const tracker = [];
  const metrics = {
    total: employees.length,
    early: 0,
    onTime: 0,
    late: 0,
    absent: 0,
    notCheckedOut: 0,
    checkedOut: 0,
  };

  for (const emp of employees) {
    const todayLogs = await AttendanceLog.findAll({
      where: {
        employeeId: emp.id,
        timestamp: { [Op.between]: [todayStart, todayEnd] },
      },
      order: [['timestamp', 'ASC']],
    });

    const checkIn = todayLogs.find((l) => ['check_in', 'shift_in'].includes(l.punchType)) || todayLogs[0];
    const checkOut = [...todayLogs].reverse().find((l) => ['check_out', 'shift_out'].includes(l.punchType));

    const adherence = calculateShiftAdherence({
      shiftStartStr: emp.shiftStart || '19:00:00',
      shiftEndStr: emp.shiftEnd || '04:00:00',
      checkInTime: checkIn ? checkIn.timestamp : null,
      checkOutTime: checkOut ? checkOut.timestamp : null,
    });

    if (adherence.checkIn.status === 'early') metrics.early++;
    else if (adherence.checkIn.status === 'on_time') metrics.onTime++;
    else if (adherence.checkIn.status === 'late') metrics.late++;
    else metrics.absent++;

    if (checkIn && !checkOut) metrics.notCheckedOut++;
    else if (checkOut) metrics.checkedOut++;

    tracker.push({
      employeeId: emp.id,
      name: emp.name,
      empCode: emp.empCode,
      campaign: emp.campaign || 'Medicare',
      campaignRole: emp.campaignRole || 'Closer',
      station: emp.station || '—',
      shiftStart: emp.shiftStart || '19:00:00',
      shiftEnd: emp.shiftEnd || '04:00:00',
      checkInTime: checkIn ? checkIn.timestamp : null,
      checkOutTime: checkOut ? checkOut.timestamp : null,
      adherence,
    });
  }

  res.json({ metrics, tracker });
});

router.get('/', async (req, res) => {
  const { employeeId, deviceId, campaign, startDate, endDate, page = 1, pageSize = 50 } = req.query;
  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (deviceId) where.deviceId = deviceId;
  if (campaign && campaign !== 'All') where.campaign = campaign;
  if (startDate && endDate) where.timestamp = { [Op.between]: [new Date(startDate), new Date(endDate)] };

  const { count, rows } = await AttendanceLog.findAndCountAll({
    where,
    include: [
      {
        model: Employee,
        attributes: ['name', 'empCode', 'department', 'campaign', 'campaignRole', 'station'],
      },
      { model: Device, attributes: ['name'] },
    ],
    order: [['timestamp', 'DESC']],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
  });

  res.json({ total: count, page: Number(page), pageSize: Number(pageSize), records: rows });
});

// Create a single manual punch record with full call-center fields
router.post('/', requireRole('admin', 'hr'), async (req, res) => {
  const {
    employeeId,
    deviceUserId,
    timestamp,
    punchType = 'check_in',
    verifyMode = 'manual',
    deviceId,
    campaign,
    notes,
  } = req.body;

  let matchedEmployeeId = employeeId;
  let targetDeviceUserId = deviceUserId;
  let assignedCampaign = campaign;

  if (employeeId) {
    const emp = await Employee.findByPk(employeeId);
    if (emp) {
      targetDeviceUserId = targetDeviceUserId || emp.deviceUserId || String(emp.id);
      assignedCampaign = assignedCampaign || emp.campaign;
    }
  } else if (deviceUserId) {
    const emp = await Employee.findOne({ where: { deviceUserId: String(deviceUserId) } });
    if (emp) {
      matchedEmployeeId = emp.id;
      assignedCampaign = assignedCampaign || emp.campaign;
    }
  }

  const log = await AttendanceLog.create({
    employeeId: matchedEmployeeId || null,
    deviceId: deviceId ? Number(deviceId) : null,
    deviceUserId: String(targetDeviceUserId || 'manual'),
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    punchType,
    campaign: assignedCampaign || 'Medicare',
    verifyMode,
    notes: notes || null,
    source: 'manual_import',
  });

  res.status(201).json(log);
});

// Bulk punch for multiple agents or entire campaign (e.g. clock-in / clock-out all at once)
router.post('/bulk', requireRole('admin', 'hr'), async (req, res) => {
  const { employeeIds, campaign, punchType = 'check_in', timestamp, notes } = req.body;
  let targetEmployees = [];

  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    targetEmployees = await Employee.findAll({ where: { id: { [Op.in]: employeeIds }, status: 'active' } });
  } else if (campaign && campaign !== 'All') {
    targetEmployees = await Employee.findAll({ where: { campaign, status: 'active' } });
  } else {
    targetEmployees = await Employee.findAll({ where: { status: 'active' } });
  }

  const punchTime = timestamp ? new Date(timestamp) : new Date();
  const created = [];

  for (const emp of targetEmployees) {
    const log = await AttendanceLog.create({
      employeeId: emp.id,
      deviceUserId: String(emp.deviceUserId || emp.id),
      timestamp: punchTime,
      punchType,
      campaign: emp.campaign || campaign || 'Medicare',
      verifyMode: 'manual_bulk',
      notes: notes || `Bulk ${punchType.replace(/_/g, ' ')}`,
      source: 'manual_import',
    });
    created.push(log);
  }

  res.status(201).json({ count: created.length, records: created });
});

// Break Time & AUX Monitor endpoint
router.get('/break-monitor', async (req, res) => {
  const { campaign } = req.query;
  const whereEmp = { status: 'active' };
  if (campaign && campaign !== 'All') whereEmp.campaign = campaign;

  const employees = await Employee.findAll({
    where: whereEmp,
    order: [['campaign', 'ASC'], ['name', 'ASC']],
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monitors = [];

  for (const emp of employees) {
    const logs = await AttendanceLog.findAll({
      where: {
        employeeId: emp.id,
        timestamp: { [Op.between]: [todayStart, todayEnd] },
      },
      order: [['timestamp', 'ASC']],
    });

    let totalTeaMinutes = 0;
    let totalLunchMinutes = 0;
    let currentAuxState = 'available'; // 'available', 'on_tea_break', 'on_lunch', 'in_coaching', 'logged_out'
    let currentAuxSince = null;

    let teaStartTime = null;
    let lunchStartTime = null;

    for (const log of logs) {
      const type = log.punchType;
      const t = new Date(log.timestamp).getTime();

      if (type === 'break_start') {
        teaStartTime = t;
        currentAuxState = 'on_tea_break';
        currentAuxSince = log.timestamp;
      } else if (type === 'break_end') {
        if (teaStartTime) {
          totalTeaMinutes += Math.round((t - teaStartTime) / 60000);
          teaStartTime = null;
        }
        currentAuxState = 'available';
        currentAuxSince = null;
      } else if (type === 'lunch_start') {
        lunchStartTime = t;
        currentAuxState = 'on_lunch';
        currentAuxSince = log.timestamp;
      } else if (type === 'lunch_end') {
        if (lunchStartTime) {
          totalLunchMinutes += Math.round((t - lunchStartTime) / 60000);
          lunchStartTime = null;
        }
        currentAuxState = 'available';
        currentAuxSince = null;
      } else if (['coaching', 'meeting'].includes(type)) {
        currentAuxState = type === 'coaching' ? 'in_coaching' : 'in_meeting';
        currentAuxSince = log.timestamp;
      } else if (type === 'check_out') {
        currentAuxState = 'logged_out';
        currentAuxSince = log.timestamp;
      } else if (type === 'check_in') {
        currentAuxState = 'available';
      }
    }

    // If currently on ongoing break
    const now = Date.now();
    let currentBreakElapsedMin = 0;
    if (teaStartTime) {
      currentBreakElapsedMin = Math.round((now - teaStartTime) / 60000);
    } else if (lunchStartTime) {
      currentBreakElapsedMin = Math.round((now - lunchStartTime) / 60000);
    }

    // Thresholds: Tea break allowance is 15 min; lunch is 45 min
    const teaOverrun = Math.max(0, (totalTeaMinutes + (teaStartTime ? currentBreakElapsedMin : 0)) - 15);
    const lunchOverrun = Math.max(0, (totalLunchMinutes + (lunchStartTime ? currentBreakElapsedMin : 0)) - 45);

    monitors.push({
      employeeId: emp.id,
      name: emp.name,
      empCode: emp.empCode,
      campaign: emp.campaign,
      campaignRole: emp.campaignRole,
      station: emp.station,
      currentAuxState,
      currentAuxSince,
      currentBreakElapsedMin,
      totalTeaMinutes: totalTeaMinutes + (teaStartTime ? currentBreakElapsedMin : 0),
      totalLunchMinutes: totalLunchMinutes + (lunchStartTime ? currentBreakElapsedMin : 0),
      teaOverrun,
      lunchOverrun,
      isOverdue: (currentAuxState === 'on_tea_break' && currentBreakElapsedMin > 15) ||
                 (currentAuxState === 'on_lunch' && currentBreakElapsedMin > 45),
    });
  }

  res.json({ records: monitors });
});

// Campaign & Agent Performance Leaderboard
router.get('/leaderboard', async (req, res) => {
  const { campaign, days = 30 } = req.query;
  const whereEmp = { status: 'active' };
  if (campaign && campaign !== 'All') whereEmp.campaign = campaign;

  const employees = await Employee.findAll({
    where: whereEmp,
    order: [['campaign', 'ASC'], ['name', 'ASC']],
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));
  startDate.setHours(0, 0, 0, 0);

  const leaderboard = [];

  for (const emp of employees) {
    const logs = await AttendanceLog.findAll({
      where: {
        employeeId: emp.id,
        timestamp: { [Op.gte]: startDate },
      },
      order: [['timestamp', 'ASC']],
    });

    // Group logs by day
    const dayGroups = {};
    for (const log of logs) {
      const dateKey = new Date(log.timestamp).toISOString().slice(0, 10);
      if (!dayGroups[dateKey]) dayGroups[dateKey] = [];
      dayGroups[dateKey].push(log);
    }

    let daysPresent = Object.keys(dayGroups).length;
    let onTimeDays = 0;
    let earlyDays = 0;
    let lateDays = 0;
    let totalMinutesLate = 0;
    let totalFloorHours = 0;

    for (const [dateKey, dayLogs] of Object.entries(dayGroups)) {
      const checkIn = dayLogs.find((l) => ['check_in', 'shift_in'].includes(l.punchType)) || dayLogs[0];
      const checkOut = [...dayLogs].reverse().find((l) => ['check_out', 'shift_out'].includes(l.punchType));

      const adherence = calculateShiftAdherence({
        shiftStartStr: emp.shiftStart || '19:00:00',
        shiftEndStr: emp.shiftEnd || '04:00:00',
        checkInTime: checkIn ? checkIn.timestamp : null,
        checkOutTime: checkOut ? checkOut.timestamp : null,
      });

      if (adherence.checkIn.status === 'early') earlyDays++;
      else if (adherence.checkIn.status === 'on_time') onTimeDays++;
      else if (adherence.checkIn.status === 'late') {
        lateDays++;
        totalMinutesLate += adherence.checkIn.diffMinutes || 0;
      }

      totalFloorHours += adherence.durationHours || 0;
    }

    const punctualityScore = daysPresent > 0
      ? Math.round(((earlyDays + onTimeDays) / daysPresent) * 100)
      : 0;

    leaderboard.push({
      employeeId: emp.id,
      name: emp.name,
      empCode: emp.empCode,
      campaign: emp.campaign,
      campaignRole: emp.campaignRole,
      daysPresent,
      earlyDays,
      onTimeDays,
      lateDays,
      totalMinutesLate,
      totalFloorHours: Number(totalFloorHours.toFixed(1)),
      punctualityScore,
    });
  }

  // Sort by highest punctuality score, then floor hours
  leaderboard.sort((a, b) => b.punctualityScore - a.punctualityScore || b.totalFloorHours - a.totalFloorHours);

  res.json({ leaderboard });
});

// Multi-file manual import (CSV/Excel/.dat)
router.post('/import', requireRole('admin', 'hr'), upload.array('files', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const { deviceId } = req.body;
  const filePaths = req.files.map((f) => f.path);
  const summary = await importAttendanceFiles(filePaths, deviceId ? Number(deviceId) : null);
  res.json(summary);
});

module.exports = router;
