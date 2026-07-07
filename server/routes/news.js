const express = require('express');
const router = express.Router();
const db = require('../database');
const { fetchLocalPulse } = require('../utils/geminiNews');
const { v4: uuidv4 } = require('uuid');

// GET /api/news/:district?state=TS — fetch stored local_news rows, filtered
router.get('/:district', (req, res) => {
  const { district } = req.params;
  const { state = 'TS' } = req.query;

  const news = db.prepare('SELECT * FROM local_news WHERE district = ? AND state = ? ORDER BY fetched_at DESC LIMIT 30')
                 .all(district, state);

  // Group by category to match the UI shape
  const grouped = {
    issues: news.filter(n => n.category === 'issue'),
    problems: news.filter(n => n.category === 'problem'),
    good_news: news.filter(n => n.category === 'good_news')
  };

  res.json(grouped);
});

// POST /api/news/refresh — fetch new data via Gemini and store in DB
router.post('/refresh', async (req, res) => {
  const { district, state } = req.body;
  if (!district || !state) {
    return res.status(400).json({ error: 'district and state are required' });
  }

  try {
    const pulseData = await fetchLocalPulse(district, state);
    
    // Validate output structure
    if (!pulseData || (!pulseData.issues && !pulseData.problems && !pulseData.good_news)) {
       throw new Error("Invalid format returned by Gemini");
    }

    const insertNews = db.prepare(`
      INSERT INTO local_news (news_id, state, district, category, summary, source_url)
      VALUES (@news_id, @state, @district, @category, @summary, @source_url)
    `);

    // Clean old entries for this district/state so it doesn't pile up infinitely
    db.prepare('DELETE FROM local_news WHERE district = ? AND state = ?').run(district, state);

    // Insert new records
    const categories = ['issues', 'problems', 'good_news'];
    const dbMap = { 'issues': 'issue', 'problems': 'problem', 'good_news': 'good_news' };

    let insertedCount = 0;
    db.transaction(() => {
      categories.forEach(cat => {
        if (Array.isArray(pulseData[cat])) {
          pulseData[cat].forEach(item => {
            if (item.summary) {
              insertNews.run({
                news_id: uuidv4(),
                state,
                district,
                category: dbMap[cat],
                summary: item.summary,
                source_url: item.source_url || ''
              });
              insertedCount++;
            }
          });
        }
      });
    })();

    // Read back and return
    const news = db.prepare('SELECT * FROM local_news WHERE district = ? AND state = ? ORDER BY fetched_at DESC').all(district, state);
    const grouped = {
      issues: news.filter(n => n.category === 'issue'),
      problems: news.filter(n => n.category === 'problem'),
      good_news: news.filter(n => n.category === 'good_news')
    };

    res.json({ success: true, count: insertedCount, data: grouped });

  } catch (err) {
    console.error('Error refreshing news (returning mock):', err.message);
    // Never return 500 — serve mock data so UI always works
    const { getMockData } = require('../utils/geminiNews');
    const mockData = typeof getMockData === 'function'
      ? getMockData(district, state)
      : { issues: [], problems: [], good_news: [] };
    res.json({ success: true, count: 0, data: mockData, mock: true });
  }
});

module.exports = router;
