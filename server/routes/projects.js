const express = require('express');
const router = express.Router();
const db = require('../database');
const { scoreAndRankProjects } = require('../utils/scoring');
const { requireAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/projects/compare?ids=A,B — compare two projects
// NOTE: This route must come before /:wardId/rank to avoid conflicts
router.get('/compare', (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'ids query param required' });

  const idList = ids.split(',').map((id) => id.trim());
  const placeholders = idList.map(() => '?').join(',');
  const selectedProjects = db.prepare(`SELECT * FROM projects WHERE project_id IN (${placeholders})`).all(...idList);

  if (selectedProjects.length < 2) {
    return res.status(404).json({ error: 'Could not find both projects' });
  }

  const wards = db.prepare('SELECT * FROM wards').all();
  const scored = scoreAndRankProjects(selectedProjects, wards);
  const recommended = scored[0];

  res.json({
    projects: scored,
    recommended_id: recommended.project_id,
    recommended_name: recommended.project_name,
    reasoning: `${recommended.project_name} scores higher due to a demand score of ${recommended.demand_score} and a cost-per-beneficiary of ₹${recommended.cost_per_beneficiary.toLocaleString('en-IN')}, making it the more cost-effective high-impact investment for the ${recommended.ward_name} ward.`,
  });
});

// GET /api/projects/:wardId/rank — ranked list
router.get('/:wardId/rank', (req, res) => {
  const { wardId } = req.params;
  const projects = wardId === 'all'
    ? db.prepare('SELECT * FROM projects').all()
    : db.prepare('SELECT * FROM projects WHERE ward_id = ?').all(wardId);

  if (!projects.length) {
    return res.status(404).json({ error: 'No projects found for this ward' });
  }

  const wards = db.prepare('SELECT * FROM wards').all();
  const ranked = scoreAndRankProjects(projects, wards);
  res.json(ranked);
});

// GET /api/projects — list all (admin)
router.get('/', requireAdmin, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json(projects);
});

// POST /api/projects — add a new project (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { project_name, project_type, ward_id, lat, lng, cost_estimate, proposed_capacity } = req.body;

  if (!project_name || !project_type || !ward_id) {
    return res.status(400).json({ error: 'project_name, project_type, and ward_id are required' });
  }

  const ward = db.prepare('SELECT name FROM wards WHERE ward_id = ?').get(ward_id);

  const newProject = {
    project_id:        uuidv4(),
    project_name,
    project_type,
    ward_id,
    ward_name:         ward?.name || ward_id,
    lat:               parseFloat(lat) || 17.4948,
    lng:               parseFloat(lng) || 78.3996,
    cost_estimate:     parseFloat(cost_estimate) || 0,
    proposed_capacity: parseInt(proposed_capacity) || 0,
    enrollment:        req.body.enrollment ? parseInt(req.body.enrollment) : null,
    capacity:          req.body.capacity ? parseInt(req.body.capacity) : null,
    distance_penalty:  parseFloat(req.body.distance_penalty) || 2,
    existing_seats:    req.body.existing_seats ? parseInt(req.body.existing_seats) : null,
    description:       req.body.description || '',
  };

  db.prepare(`
    INSERT INTO projects (project_id, project_name, project_type, ward_id, ward_name, lat, lng,
      cost_estimate, proposed_capacity, enrollment, capacity, distance_penalty, existing_seats, description)
    VALUES (@project_id, @project_name, @project_type, @ward_id, @ward_name, @lat, @lng,
      @cost_estimate, @proposed_capacity, @enrollment, @capacity, @distance_penalty, @existing_seats, @description)
  `).run(newProject);

  res.status(201).json(newProject);
});

// PUT /api/projects/:id — update a project (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE project_id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const updated = {
    ...existing,
    ...req.body,
    project_id: req.params.id,
    cost_estimate:     parseFloat(req.body.cost_estimate ?? existing.cost_estimate) || 0,
    proposed_capacity: parseInt(req.body.proposed_capacity ?? existing.proposed_capacity) || 0,
  };

  db.prepare(`
    UPDATE projects SET project_name=@project_name, project_type=@project_type, ward_id=@ward_id,
      ward_name=@ward_name, lat=@lat, lng=@lng, cost_estimate=@cost_estimate,
      proposed_capacity=@proposed_capacity, enrollment=@enrollment, capacity=@capacity,
      distance_penalty=@distance_penalty, existing_seats=@existing_seats, description=@description
    WHERE project_id=@project_id
  `).run(updated);

  res.json(db.prepare('SELECT * FROM projects WHERE project_id = ?').get(req.params.id));
});

// DELETE /api/projects/:id — delete a project (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT project_id FROM projects WHERE project_id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  db.prepare('DELETE FROM projects WHERE project_id = ?').run(req.params.id);
  res.json({ success: true, deleted_id: req.params.id });
});

module.exports = router;
