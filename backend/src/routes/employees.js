const express = require('express');
const multer = require('multer');
const { Employee } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { importEmployeeFiles } = require('../services/importService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { department, campaign, status, search } = req.query;
  const where = {};
  if (department) where.department = department;
  if (campaign) where.campaign = campaign;
  if (status) where.status = status;
  const { Op } = require('sequelize');
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { empCode: { [Op.iLike]: `%${search}%` } },
      { campaign: { [Op.iLike]: `%${search}%` } },
    ];
  }
  res.json(await Employee.findAll({ where, order: [['name', 'ASC']] }));
});

router.post('/', requireRole('admin', 'hr'), async (req, res) => {
  const employee = await Employee.create(req.body);
  res.status(201).json(employee);
});

router.put('/:id', requireRole('admin', 'hr'), async (req, res) => {
  await Employee.update(req.body, { where: { id: req.params.id } });
  res.json(await Employee.findByPk(req.params.id));
});

// Bulk update shift times for an entire campaign or selected agents
router.post('/bulk-shift', requireRole('admin', 'hr'), async (req, res) => {
  const { campaign, employeeIds, shiftStart, shiftEnd } = req.body;
  const where = {};
  const { Op } = require('sequelize');

  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    where.id = { [Op.in]: employeeIds };
  } else if (campaign && campaign !== 'All') {
    where.campaign = campaign;
  }

  const [affectedCount] = await Employee.update(
    { shiftStart, shiftEnd },
    { where }
  );

  res.json({ success: true, updatedCount: affectedCount });
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await Employee.destroy({ where: { id: req.params.id } });
  res.status(204).end();
});

// Multi-file bulk import (CSV/Excel), e.g. onboarding a whole department at once
router.post('/import', requireRole('admin', 'hr'), upload.array('files', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const filePaths = req.files.map((f) => f.path);
  const summary = await importEmployeeFiles(filePaths);
  res.json(summary);
});

module.exports = router;
