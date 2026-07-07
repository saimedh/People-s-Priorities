// server/routes/chat.js
// AI Chat — 100% powered by TinyFish (Search + Fetch + Agent) + Local DB
const express = require('express');
const router  = express.Router();
const https   = require('https');
const db      = require('../database');

const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY || '';
const TINYFISH_SEARCH  = 'https://api.search.tinyfish.ai';
const TINYFISH_FETCH   = 'https://api.fetch.tinyfish.ai';

// ─── Helper: generic TinyFish POST request ──────────────────────────────────
function tinyfishRequest(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj  = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'POST',
      headers: {
        'X-API-Key':      TINYFISH_API_KEY,
        'Content-Type':   'application/json',
        'Content-Length':  Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data.slice(0, 3000) });
        }
      });
    });

    req.on('error', err => reject(err));
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('TinyFish timeout')); });
    req.write(payload);
    req.end();
  });
}

// ─── Helper: search via TinyFish Search API ─────────────────────────────────
async function searchWeb(query) {
  try {
    const result = await tinyfishRequest(TINYFISH_SEARCH, {
      query,
      num_results: 5,
    });
    // TinyFish Search returns { results: [{ title, url, content }] }
    if (result.results && Array.isArray(result.results)) {
      return result.results.map(r => `**${r.title || 'Source'}**\n${r.content || r.snippet || ''}`).join('\n\n---\n\n');
    }
    if (result.raw) return result.raw;
    return '';
  } catch (err) {
    console.warn('TinyFish Search failed:', err.message);
    return '';
  }
}

// ─── Helper: fetch URL via TinyFish Fetch API ───────────────────────────────
async function fetchUrl(urls) {
  try {
    const result = await tinyfishRequest(TINYFISH_FETCH, {
      urls,
      format: 'markdown',
    });
    if (result.results) {
      return result.results.map(r => r.content || r.markdown || '').join('\n\n---\n\n');
    }
    if (result.content) return result.content;
    if (result.markdown) return result.markdown;
    if (result.raw) return result.raw;
    return '';
  } catch (err) {
    console.warn('TinyFish Fetch failed:', err.message);
    return '';
  }
}

// ─── Helper: query local database for contextual data ───────────────────────
function getLocalDbContext(message) {
  const lower = message.toLowerCase();
  const sections = [];

  // Stats overview
  if (/stat|overview|summary|dashboard|how many|total|count/i.test(lower)) {
    const totalProjects = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    const totalSubmissions = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
    const totalWards = db.prepare('SELECT COUNT(*) as c FROM wards').get().c;
    const pendingCount = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status IN ('Submitted','In Progress')").get().c;
    const resolvedCount = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'Closed'").get().c;
    const highPriority = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE priority_level IN ('Critical','High')").get().c;
    sections.push(`📊 **Platform Stats:**\n- Total Projects: ${totalProjects}\n- Total Submissions: ${totalSubmissions}\n- Wards Tracked: ${totalWards}\n- Pending Complaints: ${pendingCount}\n- Resolved: ${resolvedCount}\n- High Priority: ${highPriority}`);
  }

  // Ward / district data
  if (/ward|district|city|area|location|telangana|andhra|ts|ap|hyderabad|warangal|vizag|visakhapatnam|guntur|vijayawada|tirupati|karimnagar|nizamabad|khammam|nalgonda/i.test(lower)) {
    let query = 'SELECT * FROM wards';
    const params = [];
    if (/telangana|ts\b/i.test(lower)) { query += " WHERE state = 'TS'"; }
    else if (/andhra|ap\b/i.test(lower)) { query += " WHERE state = 'AP'"; }
    
    const wards = db.prepare(query).all();
    if (wards.length > 0) {
      const wardList = wards.map(w => 
        `  • ${w.name} (${w.district}, ${w.state}) — Pop: ${w.population?.toLocaleString()}, Literacy: ${w.literacy_rate}%, Unemployment: ${w.unemployment_rate}%`
      ).join('\n');
      sections.push(`🗺️ **Wards/Cities (${wards.length} total):**\n${wardList}`);
    }
  }

  // Complaints / submissions
  if (/complaint|submission|issue|report|citizen|feedback|pending|resolved|problem/i.test(lower)) {
    const recent = db.prepare('SELECT * FROM submissions ORDER BY timestamp DESC LIMIT 5').all();
    if (recent.length > 0) {
      const list = recent.map(s => 
        `  • [${s.category || 'Uncategorized'}] ${s.complaint_text.substring(0, 80)}... (${s.status || 'Submitted'}, Priority: ${s.priority_level || 'Low'})`
      ).join('\n');
      sections.push(`📝 **Recent Complaints (last 5):**\n${list}`);
    }
    
    // Category breakdown
    const categories = db.prepare("SELECT category, COUNT(*) as c FROM submissions GROUP BY category ORDER BY c DESC").all();
    if (categories.length > 0) {
      const catList = categories.map(c => `  • ${c.category || 'Uncategorized'}: ${c.c}`).join('\n');
      sections.push(`📂 **Complaint Categories:**\n${catList}`);
    }
  }

  // Projects
  if (/project|school|vocational|upgrade|infrastructure|build|construction/i.test(lower)) {
    const projects = db.prepare('SELECT * FROM projects ORDER BY cost_estimate DESC LIMIT 5').all();
    if (projects.length > 0) {
      const pList = projects.map(p => 
        `  • ${p.project_name} (${p.ward_name}) — ₹${(p.cost_estimate/100000).toFixed(1)}L, Type: ${p.project_type}`
      ).join('\n');
      sections.push(`🏗️ **Top Projects:**\n${pList}`);
    }
  }

  // Enrollment / education / schools
  if (/enroll|school|education|teacher|student|udise|literacy/i.test(lower)) {
    const tsWards = db.prepare("SELECT * FROM wards WHERE state = 'TS' ORDER BY school_age_population DESC LIMIT 5").all();
    const apWards = db.prepare("SELECT * FROM wards WHERE state = 'AP' ORDER BY school_age_population DESC LIMIT 5").all();
    if (tsWards.length > 0) {
      const tsList = tsWards.map(w => `  • ${w.name}: ${w.school_age_population?.toLocaleString()} school-age, Literacy: ${w.literacy_rate}%`).join('\n');
      sections.push(`🎓 **TS Education Hotspots:**\n${tsList}`);
    }
    if (apWards.length > 0) {
      const apList = apWards.map(w => `  • ${w.name}: ${w.school_age_population?.toLocaleString()} school-age, Literacy: ${w.literacy_rate}%`).join('\n');
      sections.push(`🎓 **AP Education Hotspots:**\n${apList}`);
    }
  }

  // Unemployment
  if (/unemploy|job|youth|employment|work/i.test(lower)) {
    const highUnemployment = db.prepare('SELECT * FROM wards ORDER BY unemployment_rate DESC LIMIT 5').all();
    if (highUnemployment.length > 0) {
      const uList = highUnemployment.map(w => `  • ${w.name} (${w.district}, ${w.state}): ${w.unemployment_rate}% unemployment, Youth: ${w.youth_population?.toLocaleString()}`).join('\n');
      sections.push(`⚠️ **Highest Unemployment Areas:**\n${uList}`);
    }
  }

  // Compare TS vs AP
  if (/compare|vs|versus|difference|between/i.test(lower) && (/ts|telangana/i.test(lower) || /ap|andhra/i.test(lower))) {
    const tsStats = db.prepare("SELECT COUNT(*) as c, AVG(population) as avg_pop, AVG(literacy_rate) as avg_lit, AVG(unemployment_rate) as avg_unemp FROM wards WHERE state = 'TS'").get();
    const apStats = db.prepare("SELECT COUNT(*) as c, AVG(population) as avg_pop, AVG(literacy_rate) as avg_lit, AVG(unemployment_rate) as avg_unemp FROM wards WHERE state = 'AP'").get();
    sections.push(`📊 **TS vs AP Comparison:**\n| Metric | Telangana | Andhra Pradesh |\n|---|---|---|\n| Wards Tracked | ${tsStats.c} | ${apStats.c} |\n| Avg Population | ${Math.round(tsStats.avg_pop)?.toLocaleString()} | ${Math.round(apStats.avg_pop)?.toLocaleString()} |\n| Avg Literacy | ${tsStats.avg_lit?.toFixed(1)}% | ${apStats.avg_lit?.toFixed(1)}% |\n| Avg Unemployment | ${tsStats.avg_unemp?.toFixed(1)}% | ${apStats.avg_unemp?.toFixed(1)}% |`);
  }

  return sections.join('\n\n');
}

// ─── POST /api/chat ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, history = [], urls = [] } = req.body;

  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    // 1. Fetch web context if URLs provided
    let webContext = '';
    if (urls.length > 0) {
      webContext = await fetchUrl(urls);
    }

    // 2. Query local DB for relevant data
    const dbContext = getLocalDbContext(message);

    // 3. Search the web via TinyFish Search for additional context
    let searchContext = '';
    const needsWebSearch = /news|latest|current|update|policy|government|scheme|budget|today|recent/i.test(message);
    if (needsWebSearch) {
      searchContext = await searchWeb(`${message} Telangana Andhra Pradesh India 2024 2025`);
    }

    // 4. Build the AI response from all available context
    let response = '';

    if (dbContext) {
      response += `Here's what I found from our platform data:\n\n${dbContext}`;
    }

    if (searchContext) {
      response += `${dbContext ? '\n\n' : ''}🌐 **Live Web Results:**\n\n${searchContext.slice(0, 2000)}`;
    }

    if (webContext) {
      response += `${response ? '\n\n' : ''}📄 **From provided URL:**\n\n${webContext.slice(0, 1500)}`;
    }

    // Fallback for general greetings or questions without specific data
    if (!response.trim()) {
      // Try a web search as fallback
      try {
        searchContext = await searchWeb(`${message} constituency development India`);
        if (searchContext) {
          response = `🌐 **Web Results:**\n\n${searchContext.slice(0, 2000)}`;
        }
      } catch { /* ignore */ }
    }

    if (!response.trim()) {
      response = `Hello! I'm the People's Priorities AI Assistant — powered by TinyFish and local analytics.\n\nI can help you with:\n• **District & Ward data** — Ask about any TS or AP city\n• **Complaint tracking** — View recent complaints, categories, priority levels\n• **Project analytics** — School upgrades, vocational centres, cost estimates\n• **TS vs AP comparison** — Compare literacy, unemployment, population\n• **Live web search** — Ask about news, policies, or government schemes\n\nTry asking: "Show me Telangana ward data" or "Compare TS vs AP" or "What are the recent complaints?"`;
    }

    res.json({
      role: 'assistant',
      content: response,
      web_context_used: !!(webContext || searchContext),
    });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({
      role: 'assistant',
      content: `I encountered an error processing your request. Here's what I can help with:\n\n• Ask about **ward/district data** (e.g., "Show Telangana wards")\n• Ask about **complaints** (e.g., "Show recent complaints")\n• Ask about **projects** (e.g., "Top infrastructure projects")\n• Ask to **compare TS vs AP**\n\nPlease try rephrasing your question!`,
      web_context_used: false,
    });
  }
});

module.exports = router;
