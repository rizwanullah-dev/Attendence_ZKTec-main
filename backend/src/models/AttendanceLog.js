const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  employeeId: { type: DataTypes.INTEGER, allowNull: true },
  deviceId: { type: DataTypes.INTEGER, allowNull: true },
  deviceUserId: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.DATE, allowNull: false },
  punchType: { type: DataTypes.STRING, defaultValue: 'check_in' }, // check_in, check_out, break_start, break_end, lunch_start, lunch_end, coaching, meeting
  campaign: { type: DataTypes.STRING }, // Medicare, ACA, Final Expense
  verifyMode: { type: DataTypes.STRING, defaultValue: 'manual' }, // fingerprint, face, card, manual
  source: { type: DataTypes.ENUM('live_push', 'poll', 'manual_import'), defaultValue: 'manual_import' },
  notes: { type: DataTypes.STRING }, // e.g. "Overtime approved", "Coaching session"
  rawData: { type: DataTypes.JSONB },
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  indexes: [
    { fields: ['employeeId', 'timestamp'] },
    { fields: ['deviceId', 'timestamp'] },
    { fields: ['campaign', 'timestamp'] },
    { unique: true, fields: ['deviceId', 'deviceUserId', 'timestamp'] },
  ],
});

module.exports = AttendanceLog;
