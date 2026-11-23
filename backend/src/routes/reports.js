const express = require('express');
const ExcelJS = require('exceljs');
const { requireAuth } = require('../middleware/auth');
const { getSummaryReport } = require('../services/reportService');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', async (req, res) => {
  const { startDate, endDate, department, campaign } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
  const report = await getSummaryReport({ startDate, endDate, department, campaign });
  res.json(report);
});

router.get('/summary/export', async (req, res) => {
  const { startDate, endDate, department, campaign } = req.query;
  const report = await getSummaryReport({ startDate, endDate, department, campaign });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('BPO Attendance & Punctuality');
  sheet.columns = [
    { header: 'Agent Code', key: 'empCode', width: 14 },
    { header: 'Agent Name', key: 'name', width: 25 },
    { header: 'Campaign', key: 'campaign', width: 16 },
    { header: 'Role', key: 'campaignRole', width: 16 },
    { header: 'Station', key: 'station', width: 12 },
    { header: 'Days Present', key: 'daysPresent', width: 14 },
    { header: 'Working Days', key: 'totalWorkingDays', width: 14 },
    { header: 'Days Absent', key: 'daysAbsent', width: 12 },
    { header: 'Before Time (Early Days)', key: 'earlyDays', width: 22 },
    { header: 'Early Mins Total', key: 'totalEarlyMinutes', width: 16 },
    { header: 'Late Days', key: 'lateDays', width: 12 },
    { header: 'Late Mins Total', key: 'totalLateMinutes', width: 16 },
    { header: 'Left Early (Departures)', key: 'earlyDepartures', width: 22 },
    { header: 'Overtime (Hrs)', key: 'overtimeHours', width: 15 },
    { header: 'Total Prod Hours', key: 'totalHours', width: 16 },
  ];
  sheet.addRows(report);
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="call-center-punctuality-${startDate}-to-${endDate}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
