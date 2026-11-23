const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  empCode: { type: DataTypes.STRING, allowNull: false, unique: true }, // company employee code
  deviceUserId: { type: DataTypes.STRING }, // ID as registered on the ZKTeco device(s)
  name: { type: DataTypes.STRING, allowNull: false },
  campaign: { type: DataTypes.STRING, defaultValue: 'Medicare' }, // Medicare, ACA, Final Expense, etc.
  campaignRole: { type: DataTypes.STRING, defaultValue: 'Closer' }, // Closer, Opener, TL, QA, Supervisor
  department: { type: DataTypes.STRING, defaultValue: 'Sales / Floor' },
  designation: { type: DataTypes.STRING, defaultValue: 'Agent' },
  station: { type: DataTypes.STRING }, // Seat / Desk / Station number
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  shiftStart: { type: DataTypes.TIME, defaultValue: '19:00:00' }, // Default US night shift 7 PM
  shiftEnd: { type: DataTypes.TIME, defaultValue: '04:00:00' },   // Default US night shift 4 AM
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, {
  tableName: 'employees',
  timestamps: true,
});

module.exports = Employee;
