import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Users, Map, TrendingUp, Brain, ArrowRight,
  ChevronRight, Sparkles, AlertTriangle, Scale, FileText, 
  CheckCircle2, Circle, ChevronDown, ChevronUp, RefreshCw, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedCounter from '../components/AnimatedCounter';
import { getStats, getRankedProjects, summarizeComplaints } from '../utils/api';

const WARD_COLORS = {
  ward_1: 'var(--orange)',
  ward_2: '#1e1a1a',
  ward_3: 'var(--green)',
};

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const [stats, setStats]                 = useState(null);
  const [projects, setProjects]           = useState([]);
  const [themes, setThemes]               = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [themeError, setThemeError]       = useState(null);
  const [loaded, setLoaded]               = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [now, setNow]                     = useState(new Date());
  const navigate = useNavigate();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [s, p] = await Promise.all([getStats(), getRankedProjects('all')]);
      setStats(s); setProjects(p.slice(0, 6)); setLoaded(true);
      setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { if (showRefreshing) setRefreshing(false); }
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAnalyze = async () => {
    setLoadingThemes(true); setThemeError(null);
    try { const data = await summarizeComplaints(); setThemes(data.themes || []); }
    catch { setThemeError('Failed to analyze.'); }
    finally { setLoadingThemes(false); }
  };

  /* Derived display values */
  const total   = stats?.total_projects    ?? 0;
  const subs    = stats?.total_submissions ?? 0;
  const wards   = stats?.total_wards       ?? 0;
  const avg     = stats?.avg_priority_score ?? 0;
  const gaugeVal = Math.round(avg * 100);

  const pillBars = [
    { label: 'School Upgrades',    pct: 60, color: 'var(--orange)' },
    { label: 'Vocational Training', pct: 35, color: '#1e1a1a'      },
    { label: 'Infrastructure',      pct: 48, color: 'var(--purple)' },
    { label: 'Avg Priority Score',  pct: gaugeVal, color: 'var(--green)' },
  ];

  const days = ['S','M','T','W','T','F','S'];

  const RADIUS = 52, CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - (gaugeVal / 100) * CIRC;

  const accordionItems = [
    { label: 'Ward-wise Breakdown',   content: `Ward 1: ${Math.ceil(total*0.4)} projects · Ward 2: ${Math.ceil(total*0.35)} · Ward 3: ${Math.floor(total*0.25)}` },
    { label: 'Budget Overview',       content: 'Total allocated: ₹24.6 Cr · Utilised: 68%' },
    { label: 'Citizen Satisfaction',  content: 'Based on latest 20 submissions · Score: 4.1/5' },
    { label: 'Completion Forecast',   content: 'Estimated Q1 2025 at current velocity' },
  ];

  const aiTasks = [
    { label: 'Analyze complaints',   sub: 'Latest 20 submissions',  done: themes.length > 0 },
    { label: 'Priority recalculate', sub: 'Auto-run daily',         done: true  },
    { label: 'Ward report draft',    sub: 'Gemini draft pending',   done: false },
    { label: 'Heatmap update',       sub: 'Last run: today',        done: true  },
    { label: 'Export summary PDF',   sub: 'Scheduled: Friday',      done: false },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* ── TOP BAR (Financial Dashboard Layout) ──────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
            PP
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Constituency</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dashboard</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Live clock */}
          <div style={{ textAlign: 'center', paddingRight: '1.25rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {now.toLocaleDateString('default', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>

          {/* Refresh button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh data"
            style={{
              width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--border-subtle)',
              background: 'white', cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexShrink: 0
            }}
          >
            <motion.div
              animate={{ rotate: refreshing ? 360 : 0 }}
              transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}
            >
              <RefreshCw size={16} color={refreshing ? 'var(--orange)' : 'var(--text-muted)'} />
            </motion.div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
            onClick={() => navigate('/local-pulse')}
          >
            Local Pulse &rarr;
          </motion.button>
        </div>
        
        <div style={{ flex: '1 1 300px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Hey, Need help?<br/>
              <span style={{ color: 'var(--text-muted)' }}>Just ask me anything!</span>
            </h2>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
          >
            <Sparkles size={20} color="var(--orange)" />
          </motion.div>
        </div>
      </motion.div>

      {/* ── MAIN CONTENT GRID ───────────────────────────────────── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}
      >

        {/* STATS STRIP */}
        <div style={{ gridColumn: '1 / -1' }}>
        {/* Live indicator + last updated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {lastUpdated
              ? `Last refreshed ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Fetching data…'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· Auto-refreshes every 60s</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: BarChart2, val: total, label: 'Projects',    color: 'var(--orange)' },
            { icon: Users,     val: subs,  label: 'Submissions', color: '#1e1a1a'       },
            { icon: Clock,     val: stats?.pending_complaints ?? 0, label: 'Pending', color: 'var(--orange)' },
            { icon: CheckCircle2, val: stats?.resolved_complaints ?? 0, label: 'Resolved', color: 'var(--green)' },
            { icon: AlertTriangle, val: stats?.high_priority_complaints ?? 0, label: 'High Priority', color: 'var(--orange)' },
            { icon: Map,       val: wards, label: 'Wards',       color: 'var(--purple)'  },
          ].map(({ icon: Icon, val, label, color }) => (
            <motion.div variants={itemVariants} key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <Icon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {loaded ? <AnimatedCounter value={val} /> : '–'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>

        {/* PROGRESS PILLS */}
        <motion.div variants={itemVariants} className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            {pillBars.map(({ label, pct, color }) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ height: '32px', background: 'rgba(0,0,0,0.04)', borderRadius: 999, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: loaded ? `${pct}%` : '0%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    style={{ height: '100%', background: color, borderRadius: 999, display: 'flex', alignItems: 'center', padding: '0 0.875rem', fontSize: '0.75rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}
                  >
                    {pct}%
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* WARD CARD */}
        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--orange-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-accent)', marginBottom: '1rem' }}>
            <Map size={22} color="var(--orange)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Hyderabad
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: '1.25rem' }}>Constituency Overview</div>
          
          <div style={{ flex: 1 }}>
            {[
              { name: 'Ward 1 – Banjara Hills', pct: 40, color: 'var(--orange)' },
              { name: 'Ward 2 – Jubilee Hills',  pct: 35, color: '#1e1a1a' },
              { name: 'Ward 3 – Madhapur',       pct: 25, color: 'var(--purple)' },
            ].map(({ name, pct, color }) => (
              <div key={name} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  <span>{name}</span><span style={{ fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: loaded ? `${pct}%` : '0%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ height: '100%', background: color, borderRadius: 999 }} 
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#1e1a1a', borderRadius: 12, padding: '0.75rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', marginTop: '1rem' }}>
            <TrendingUp size={14} color="var(--purple-light)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>Score: {(avg).toFixed(3)}</span>
          </div>
        </motion.div>

        {/* PROJECTS CHART CARD */}
        <motion.div variants={itemVariants} className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Top Projects</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, marginTop: '0.25rem' }}>
                {loaded ? <AnimatedCounter value={total} decimals={0} /> : '–'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>total tracked</div>
            </div>
            <motion.button whileHover={{ x: 3 }} onClick={() => navigate('/rank')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowRight size={16} />
            </motion.button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            {projects.slice(0, 7).map((p, i) => {
              const h = Math.round((p.final_priority ?? 0) * 100);
              const isTop = i === (projects.reduce((best, cur, idx) => (cur.final_priority > projects[best].final_priority ? idx : best), 0));
              return (
                <motion.div
                  key={p.project_id}
                  title={p.project_name}
                  whileHover={{ y: -4 }}
                  initial={{ height: '10%' }}
                  animate={{ height: loaded ? `${Math.max(h, 10)}%` : '10%' }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  style={{
                    flex: 1,
                    borderRadius: '6px 6px 0 0',
                    background: isTop ? 'var(--orange)' : 'rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    position: 'relative',
                    minWidth: 12
                  }}
                  onClick={() => navigate('/rank')}
                >
                  {isTop && (
                    <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--orange)' }}>
                      {h}%
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {days.slice(0, projects.length || 7).map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{d}</div>
            ))}
          </div>
        </motion.div>

        {/* PRIORITY GAUGE */}
        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>Priority Gauge</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: '1rem' }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={140} height={140} viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={65} cy={65} r={RADIUS} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={12} />
                <motion.circle
                  cx={65} cy={65} r={RADIUS} fill="none"
                  stroke="var(--orange)" strokeWidth={12}
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: loaded ? dashOffset : CIRC }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {loaded ? gaugeVal : 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Avg Score</div>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-ghost" 
            onClick={() => navigate('/compare')} 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
          >
            <Scale size={16} /> Compare Projects
          </motion.button>
        </motion.div>

        {/* AI TASKS (DARK) */}
        <motion.div variants={itemVariants} className="card" style={{ background: '#111', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="var(--purple-light)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>AI Tasks</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Gemini 2.0 Flash</div>
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--purple-light)' }}>
                {aiTasks.filter(t => t.done).length}/{aiTasks.length}
              </div>
            </div>

            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(aiTasks.filter(t => t.done).length / aiTasks.length) * 100}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                style={{ height: '100%', background: 'var(--purple)', borderRadius: 999 }} 
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {aiTasks.map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', opacity: task.done ? 0.6 : 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: task.done ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {task.done ? <CheckCircle2 size={16} color="var(--purple-light)" /> : <Circle size={16} color="rgba(255,255,255,0.3)" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, textDecoration: task.done ? 'line-through' : 'none' }}>{task.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{task.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={loadingThemes}
              style={{ background: loadingThemes ? 'rgba(255,255,255,0.1)' : 'var(--purple)', border: 'none', borderRadius: 999, padding: '0.8rem', width: '100%', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: loadingThemes ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loadingThemes ? 'Analyzing...' : <><Sparkles size={16} />Analyze Complaints</>}
            </motion.button>
            
            {themeError && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.2)', borderRadius: 10, fontSize: '0.8rem', color: '#fca5a5', display: 'flex', gap: '0.5rem' }}>
                <AlertTriangle size={16} />{themeError}
              </div>
            )}
          </div>
        </motion.div>

        {/* ACCORDION QUICK NAV & TOP PROJECTS */}
        <motion.div variants={itemVariants} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Details</div>
            <div style={{ flex: 1 }}>
              {accordionItems.map(({ label, content }, i) => (
                <div key={i} style={{ borderBottom: i < accordionItems.length -1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div 
                    onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}
                  >
                    <span>{label}</span>
                    {openAccordion === i ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                  {openAccordion === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '1rem', lineHeight: 1.6 }}
                    >
                      {content}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-ghost" onClick={() => navigate('/map')} style={{ flex: 1 }}>
                <Map size={16} /> View Heatmap
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-ghost" onClick={() => navigate('/submit')} style={{ flex: 1 }}>
                <FileText size={16} /> Submit Feedback
              </motion.button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Top Priority Projects</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ranked by final score</div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-ghost" onClick={() => navigate('/rank')} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                View All
              </motion.button>
            </div>
            <div>
              {projects.map((p, i) => (
                <motion.div
                  key={p.project_id}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  onClick={() => navigate('/rank')}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: i < projects.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'var(--orange)' : i === 1 ? '#111' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: i < 2 ? 'white' : 'var(--text-muted)', flexShrink: 0 }}>
                    {p.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.project_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
                      <span style={{ fontSize: '0.7rem', color: WARD_COLORS[p.ward_id] || 'var(--text-muted)', fontWeight: 600 }}>{p.ward_name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.project_type === 'school_upgrade' ? 'School' : 'Vocational'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: i === 0 ? 'var(--orange)' : 'var(--text-primary)' }}>
                      {(p.final_priority * 100).toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
}
