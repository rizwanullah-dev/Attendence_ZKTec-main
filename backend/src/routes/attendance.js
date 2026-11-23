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

// Multi-file manual import (CSV/Excel/.dat)
router.post('/import', requireRole('admin', 'hr'), upload.array('files', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const { deviceId } = req.body;
  const filePaths = req.files.map((f) => f.path);
  const summary = await importAttendanceFiles(filePaths, deviceId ? Number(deviceId) : null);
  res.json(summary);
});

module.exports = router;
