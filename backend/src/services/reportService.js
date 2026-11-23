const { Op } = require('sequelize');
const { Employee, AttendanceLog } = require('../models');
const { calculateShiftAdherence } = require('./punctualityService');

/**
 * Build a detailed per-agent call center attendance & punctuality summary:
 * Campaign, role, days present, early arrivals (before time), late arrivals,
 * early departures, total production hours, and overtime.
 */
async function getSummaryReport({ startDate, endDate, department, campaign }) {
  const where = { status: 'active' };
  if (department) where.department = department;
  if (campaign && campaign !== 'All') where.campaign = campaign;

  const employees = await Employee.findAll({
    where,
    order: [['campaign', 'ASC'], ['name', 'ASC']],
  });

  const results = [];
  for (const emp of employees) {
    const logs = await AttendanceLog.findAll({
      where: {
        employeeId: emp.id,
        timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] },
      },
      order: [['timestamp', 'ASC']],
    });

    const byDay = {};
    for (const log of logs) {
      const day = log.timestamp.toISOString().slice(0, 10);
      byDay[day] = byDay[day] || [];
      byDay[day].push(log);
    }

    let totalMinutes = 0;
    let earlyDays = 0;
    let totalEarlyMinutes = 0;
    let lateDays = 0;
    let totalLateMinutes = 0;
    let earlyDepartures = 0;
    let overtimeMinutes = 0;
    const daysPresent = Object.keys(byDay).length;

    for (const [day, dayLogs] of Object.entries(byDay)) {
      const checkIn =
        dayLogs.find((l) => ['check_in', 'shift_in'].includes(l.punchType)) || dayLogs[0];
      const checkOut =
        [...dayLogs]
          .reverse()
          .find((l) => ['check_out', 'shift_out'].includes(l.punchType));

      if (checkIn && checkOut && checkOut.timestamp > checkIn.timestamp) {
        totalMinutes += (checkOut.timestamp - checkIn.timestamp) / 60000;
      } else if (checkIn) {
        // Fallback for ongoing shifts: standard 8h or partial shift time
        totalMinutes += 480; // 8 hours baseline
      }

      const adherence = calculateShiftAdherence({
        shiftStartStr: emp.shiftStart || '19:00:00',
        shiftEndStr: emp.shiftEnd || '04:00:00',
        checkInTime: checkIn.timestamp,
        checkOutTime: checkOut ? checkOut.timestamp : null,
      });

      if (adherence.checkIn.status === 'early') {
        earlyDays++;
        totalEarlyMinutes += adherence.checkIn.earlyMinutes;
      } else if (adherence.checkIn.status === 'late') {
        lateDays++;
        totalLateMinutes += adherence.checkIn.lateMinutes;
      }

      if (adherence.checkOut.status === 'early_departure') {
        earlyDepartures++;
      } else if (adherence.checkOut.status === 'overtime') {
        overtimeMinutes += adherence.checkOut.overtimeMinutes;
      }
    }

    const totalWorkingDays = countWorkingDays(startDate, endDate);

    results.push({
      employeeId: emp.id,
      empCode: emp.empCode,
      name: emp.name,
      campaign: emp.campaign || 'Medicare',
      campaignRole: emp.campaignRole || 'Closer',
      station: emp.station || '—',
      department: emp.department || 'Sales Floor',
      shiftStart: emp.shiftStart || '19:00:00',
      shiftEnd: emp.shiftEnd || '04:00:00',
      daysPresent,
      totalWorkingDays,
      daysAbsent: Math.max(totalWorkingDays - daysPresent, 0),
      earlyDays,
      totalEarlyMinutes,
      lateDays,
      totalLateMinutes,
      earlyDepartures,
      overtimeHours: Math.round((overtimeMinutes / 60) * 10) / 10,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    });
  }

  return results;
}

function countWorkingDays(startDate, endDate) {
  let count = 0;
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0) count++; // Mon-Sat call center work schedule
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

module.exports = { getSummaryReport };
