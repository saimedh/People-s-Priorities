const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAdmin } = require('../middleware/auth');

// GET /api/wards — list all wards
router.get('/', (req, res) => {
  const wards = db.prepare('SELECT * FROM wards ORDER BY name').all();
  res.json(wards);
});

// GET /api/wards/:id — single ward
router.get('/:id', (req, res) => {
  const ward = db.prepare('SELECT * FROM wards WHERE ward_id = ?').get(req.params.id);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });
  res.json(ward);
});

// POST /api/wards — add a new ward (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { ward_id, name, population, literacy_rate, youth_population, school_age_population, unemployment_rate } = req.body;
  if (!ward_id || !name) return res.status(400).json({ error: 'ward_id and name are required' });

  const existing = db.prepare('SELECT ward_id FROM wards WHERE ward_id = ?').get(ward_id);
  if (existing) return res.status(409).json({ error: 'Ward with this ID already exists' });

  db.prepare(`
    INSERT INTO wards (ward_id, name, population, literacy_rate, youth_population, school_age_population, unemployment_rate)
    VALUES (@ward_id, @name, @population, @literacy_rate, @youth_population, @school_age_population, @unemployment_rate)
  `).run({ ward_id, name, population: population || 0, literacy_rate: literacy_rate || 0, youth_population: youth_population || 0, school_age_population: school_age_population || 0, unemployment_rate: unemployment_rate || 0 });

  res.status(201).json(db.prepare('SELECT * FROM wards WHERE ward_id = ?').get(ward_id));
});

// PUT /api/wards/:id — update a ward (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const ward = db.prepare('SELECT * FROM wards WHERE ward_id = ?').get(req.params.id);
  if (!ward) return res.status(404).json({ error: 'Ward not found' });

  const updated = { ...ward, ...req.body, ward_id: req.params.id };
  db.prepare(`
    UPDATE wards SET name=@name, population=@population, literacy_rate=@literacy_rate,
      youth_population=@youth_population, school_age_population=@school_age_population,
      unemployment_rate=@unemployment_rate
    WHERE ward_id=@ward_id
  `).run(updated);

  res.json(db.prepare('SELECT * FROM wards WHERE ward_id = ?').get(req.params.id));
});

module.exports = router;
