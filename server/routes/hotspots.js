const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/hotspots/:wardId — demand density points for heatmap
router.get('/:wardId', (req, res) => {
  const { wardId } = req.params;

  const projects = wardId === 'all'
    ? db.prepare('SELECT * FROM projects').all()
    : db.prepare('SELECT * FROM projects WHERE ward_id = ?').all(wardId);

  const wards = db.prepare('SELECT * FROM wards').all();

  const hotspots = projects.map((p) => {
    const ward = wards.find((w) => w.ward_id === p.ward_id) || {};

    let intensity;
    if (p.project_type === 'school_upgrade') {
      const gap = (p.enrollment || 800) - (p.capacity || 600);
      intensity = Math.min(100, Math.max(10, (gap / 600) * 100 + (p.distance_penalty || 2) * 5));
    } else {
      const unmet = (ward.youth_population || 8000) - (p.existing_seats || 200);
      intensity = Math.min(100, Math.max(10, (unmet / 10000) * 100 + (p.distance_penalty || 2) * 5));
    }

    return {
      project_id:   p.project_id,
      project_name: p.project_name,
      project_type: p.project_type,
      ward_id:      p.ward_id,
      ward_name:    p.ward_name,
      lat:          p.lat,
      lng:          p.lng,
      intensity:    parseFloat(intensity.toFixed(2)),
    };
  });

  res.json(hotspots);
});

module.exports = router;
