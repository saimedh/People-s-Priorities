require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ─── Initialize DB first ──────────────────────────────────────────────────────
const db = require('./database');

// ─── Routes ──────────────────────────────────────────────────────────────────
const projectsRouter       = require('./routes/projects');
const hotspotsRouter       = require('./routes/hotspots');
const submissionsRouter    = require('./routes/submissions');
const wardsRouter          = require('./routes/wards');
const newsRouter           = require('./routes/news');
const compareStatesRouter  = require('./routes/compareStates');
const chatRouter           = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/localhost:\d+$/,
      /\.vercel\.app$/,
      process.env.CLIENT_URL,
    ].filter(Boolean);
    const ok = allowed.some(pattern =>
      pattern instanceof RegExp ? pattern.test(origin) : pattern === origin
    );
    callback(ok ? null : new Error('Not allowed by CORS'), ok);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    db:        'sqlite (persistent)',
    gemini:    process.env.GEMINI_API_KEY ? 'configured' : 'mock mode',
  });
});

// ─── Stats endpoint ───────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const { scoreAndRankProjects } = require('./utils/scoring');

  const projects    = db.prepare('SELECT * FROM projects').all();
  const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
  const pendingSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status IN ('Submitted', 'In Progress')").get().count;
  const resolvedSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'Closed'").get().count;
  const highPrioritySubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE priority_level IN ('Critical', 'High')").get().count;
  const wards       = db.prepare('SELECT * FROM wards').all();

  const ranked      = scoreAndRankProjects(projects, wards);
  const avgPriority = ranked.length
    ? ranked.reduce((sum, p) => sum + p.final_priority, 0) / ranked.length
    : 0;

  res.json({
    total_projects:     projects.length,
    total_submissions:  totalSubmissions,
    pending_complaints: pendingSubmissions,
    resolved_complaints: resolvedSubmissions,
    high_priority_complaints: highPrioritySubmissions,
    total_wards:        wards.length,
    avg_priority_score: parseFloat(avgPriority.toFixed(3)),
    wards:              wards.map((w) => ({ ward_id: w.ward_id, name: w.name })),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/projects',       projectsRouter);
app.use('/api/hotspots',       hotspotsRouter);
app.use('/api/submissions',    submissionsRouter);
app.use('/api/wards',          wardsRouter);
app.use('/api/news',           newsRouter);
app.use('/api/compare-states', compareStatesRouter);
app.use('/api/chat',           chatRouter);
app.use('/api/auth',           require('./routes/auth'));

// Convenience alias for summarize-complaints
app.post('/api/summarize-complaints', async (req, res) => {
  const { summarizeComplaints } = require('./utils/gemini');
  const submissions = db.prepare('SELECT * FROM submissions').all();
  try {
    const rawResult = await summarizeComplaints(submissions);
    let themes;
    try { themes = JSON.parse(rawResult); }
    catch { themes = [{ theme: 'Parse Error', description: rawResult, count: 0 }]; }
    res.json({ themes, total_analyzed: submissions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Production: serve built React app ────────────────────────────────────────
if (IS_PROD) {
  const fs = require('fs');
  // Docker puts client build at server/dist; Render puts it at ../client/dist
  const dockerBuild = path.join(__dirname, 'dist');
  const renderBuild = path.join(__dirname, '..', 'client', 'dist');
  const clientBuild = fs.existsSync(dockerBuild) ? dockerBuild : renderBuild;
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuild, 'index.html'));
    }
  });
}


// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 People's Priorities API  →  http://localhost:${PORT}`);
  console.log(`   Database : SQLite (persistent)`);
  console.log(`   Gemini   : ${process.env.GEMINI_API_KEY ? '✅ configured' : '⚠️  mock mode'}`);
  console.log(`   Admin    : token = ${process.env.ADMIN_TOKEN || 'admin123'}`);
  if (IS_PROD) console.log(`   Mode     : production (serving client/dist)`);
  console.log();
});

module.exports = app;
