const express = require('express');
const router = express.Router();
const db = require('../database');
const { summarizeComplaints, classifyComplaint } = require('../utils/gemini');
const { requireAdmin, authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// POST /api/submissions — citizen submission intake (public)
router.post('/', upload.single('attachment'), async (req, res) => {
  const { name, ward_id, complaint_text, project_type_suggested, lat, lng } = req.body;

  if (!ward_id || !complaint_text) {
    return res.status(400).json({ error: 'ward_id and complaint_text are required' });
  }

  const ward = db.prepare('SELECT name FROM wards WHERE ward_id = ?').get(ward_id);

  // AI Classification
  const aiResult = await classifyComplaint(complaint_text);
  
  const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  // Extract user_id if token provided
  let user_id = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(token, JWT_SECRET);
      user_id = decoded.user_id;
    } catch (e) {
      // ignore invalid tokens for public submissions
    }
  }

  const newSubmission = {
    submission_id:          uuidv4(),
    name:                   name || null,
    ward_id,
    ward_name:              ward?.name || req.body.ward_name || ward_id,
    complaint_text,
    project_type_suggested: project_type_suggested || null,
    lat:                    parseFloat(lat) || null,
    lng:                    parseFloat(lng) || null,
    timestamp:              new Date().toISOString(),
    category:               aiResult.category,
    priority_score:         aiResult.priority_score,
    priority_level:         aiResult.priority_level,
    status:                 'Submitted',
    attachment_url,
    user_id
  };

  db.prepare(`
    INSERT INTO submissions (
      submission_id, name, ward_id, ward_name, complaint_text, project_type_suggested, 
      lat, lng, timestamp, category, priority_score, priority_level, status, attachment_url, user_id
    )
    VALUES (
      @submission_id, @name, @ward_id, @ward_name, @complaint_text, @project_type_suggested, 
      @lat, @lng, @timestamp, @category, @priority_score, @priority_level, @status, @attachment_url, @user_id
    )
  `).run(newSubmission);

  res.status(201).json({ success: true, submission: newSubmission });
});

// GET /api/submissions — list all submissions (admin)
router.get('/', requireAdmin, (req, res) => {
  const { ward_id } = req.query;
  const submissions = ward_id
    ? db.prepare('SELECT * FROM submissions WHERE ward_id = ? ORDER BY timestamp DESC').all(ward_id)
    : db.prepare('SELECT * FROM submissions ORDER BY timestamp DESC').all();
  res.json(submissions);
});

// GET /api/submissions/export — CSV download (admin)
router.get('/export', requireAdmin, (req, res) => {
  const { ward_id } = req.query;
  const submissions = ward_id
    ? db.prepare('SELECT * FROM submissions WHERE ward_id = ? ORDER BY timestamp DESC').all(ward_id)
    : db.prepare('SELECT * FROM submissions ORDER BY timestamp DESC').all();

  const headers = ['submission_id', 'name', 'ward_id', 'ward_name', 'complaint_text', 'project_type_suggested', 'lat', 'lng', 'timestamp'];
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csv = [
    headers.join(','),
    ...submissions.map((s) => headers.map((h) => escape(s[h])).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="submissions_${Date.now()}.csv"`);
  res.send(csv);
});

// DELETE /api/submissions/:id — delete a submission (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT submission_id FROM submissions WHERE submission_id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Submission not found' });
  db.prepare('DELETE FROM submissions WHERE submission_id = ?').run(req.params.id);
  res.json({ success: true, deleted_id: req.params.id });
});

// PATCH /api/submissions/:id/status — update submission status (staff/admin only)
// For now we use requireAdmin since we haven't fully switched to requireRole
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['Submitted', 'In Progress', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = db.prepare('SELECT submission_id FROM submissions WHERE submission_id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Submission not found' });

  db.prepare('UPDATE submissions SET status = ? WHERE submission_id = ?').run(status, req.params.id);
  res.json({ success: true, submission_id: req.params.id, status });
});

// POST /api/submissions/summarize — Gemini AI summarization
router.post('/summarize', async (req, res) => {
  try {
    const { ward_id } = req.body;
    const submissions = ward_id
      ? db.prepare('SELECT * FROM submissions WHERE ward_id = ?').all(ward_id)
      : db.prepare('SELECT * FROM submissions').all();

    if (!submissions.length) {
      return res.status(404).json({ error: 'No submissions to analyze' });
    }

    const rawResult = await summarizeComplaints(submissions);
    let themes;
    try { themes = JSON.parse(rawResult); }
    catch { themes = [{ theme: 'Parse Error', description: rawResult, count: 0 }]; }

    res.json({ themes, total_analyzed: submissions.length });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
