import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  School, Users, Zap, BookOpen, Monitor, Droplets,
  AlertCircle, ChevronUp, ChevronDown, Minus, TrendingUp,
  GitCompare, Map
} from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import { fetchStateCompare, fetchStateDistricts } from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const METRICS = [
  { key: 'enrollment',    label: 'Enrollment'     },
  { key: 'teacher_ratio', label: 'Teacher Ratio'  },
  { key: 'infra_score',   label: 'Infra Score'    },
  { key: 'toilets',       label: 'Water Access'   },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '0.75rem 1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: p.fill }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sortable District Table ──────────────────────────────────────────────────
function DistrictTable({ districts, loading }) {
  const [sortKey, setSortKey] = useState('total_enrollment');
  const [sortDir, setSortDir] = useState('desc');

  const cols = [
    { key: 'district',              label: 'District'    },
    { key: 'state',                 label: 'State'       },
    { key: 'school_count',          label: 'Schools'     },
    { key: 'total_enrollment',      label: 'Enrollment'  },
    { key: 'student_teacher_ratio', label: 'S:T Ratio'   },
    { key: 'avg_infra_score',       label: 'Infra Score' },
  ];

  const sorted = useMemo(() => {
    return [...(districts || [])].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [districts, sortKey, sortDir]);

  const toggle = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <Minus size={11} color="var(--text-muted)" />;
    return sortDir === 'asc' ? <ChevronUp size={11} color="var(--orange)" /> : <ChevronDown size={11} color="var(--orange)" />;
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 1.5rem' }}>
      {[...Array(5)].map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.1 }}
          style={{ height: 36, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }} />
      ))}
    </div>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
            {cols.map(c => (
              <th key={c.key} onClick={() => toggle(c.key)}
                style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {c.label} <SortIcon col={c.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <motion.tr key={`${row.district}-${row.state}`}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{row.district}</td>
              <td style={{ padding: '0.75rem 1.5rem' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                  background: row.state === 'TS' ? '#111' : 'rgba(0,0,0,0.06)',
                  color: row.state === 'TS' ? 'white' : 'var(--text-primary)',
                }}>
                  {row.state}
                </span>
              </td>
              <td style={{ padding: '0.75rem 1.5rem' }}>{row.school_count?.toLocaleString()}</td>
              <td style={{ padding: '0.75rem 1.5rem' }}>{row.total_enrollment?.toLocaleString()}</td>
              <td style={{ padding: '0.75rem 1.5rem' }}>1:{row.student_teacher_ratio}</td>
              <td style={{ padding: '0.75rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)', maxWidth: 80 }}>
                    <div style={{
                      height: '100%',
                      width: `${row.avg_infra_score}%`,
                      background: row.avg_infra_score > 65 ? 'var(--green)' : row.avg_infra_score > 50 ? 'var(--orange)' : '#111',
                      borderRadius: 999
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{row.avg_infra_score}</span>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompareStates() {
  const [metric, setMetric]           = useState('enrollment');
  const [compare, setCompare]         = useState(null);
  const [districts, setDistricts]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [distLoading, setDistLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStateCompare(metric)
      .then(d => { setCompare(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [metric]);

  useEffect(() => {
    setDistLoading(true);
    Promise.all([fetchStateDistricts('TS'), fetchStateDistricts('AP')])
      .then(([ts, ap]) => { setDistricts([...ts, ...ap]); setDistLoading(false); })
      .catch(() => setDistLoading(false));
  }, []);

  const chartData = useMemo(() => {
    const ts = districts.filter(d => d.state === 'TS').slice(0, 6);
    const ap = districts.filter(d => d.state === 'AP').slice(0, 6);
    const getVal = (d) => {
      if (!d) return 0;
      if (metric === 'teacher_ratio') return d.student_teacher_ratio;
      if (metric === 'infra_score')   return d.avg_infra_score;
      return d.total_enrollment;
    };
    return Array.from({ length: Math.max(ts.length, ap.length) }, (_, i) => ({
      name: (ts[i]?.district || ap[i]?.district || '').split(' ')[0],
      TS: getVal(ts[i]),
      AP: getVal(ap[i]),
    }));
  }, [districts, metric]);

  // Pill bars based on selected metric
  const tsData = compare?.TS;
  const apData = compare?.AP;
  const infoBars = [
    { label: 'Electricity',    ts: tsData?.pct_with_electricity ?? 0, ap: apData?.pct_with_electricity ?? 0, icon: Zap },
    { label: 'Computer Labs',  ts: tsData?.pct_with_computer   ?? 0, ap: apData?.pct_with_computer   ?? 0, icon: Monitor },
    { label: 'Library',        ts: tsData?.pct_with_library     ?? 0, ap: apData?.pct_with_library     ?? 0, icon: BookOpen },
    { label: 'Drinking Water', ts: tsData?.pct_with_water       ?? 0, ap: apData?.pct_with_water       ?? 0, icon: Droplets },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── TOP BAR — identical pattern to Dashboard ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
            TS<span style={{ color: 'var(--orange)', margin: '0 1px' }}>/</span>AP
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Schools Compare</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>UDISE+ Data · Telangana vs Andhra Pradesh</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', paddingRight: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{new Date().getDate()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date().toLocaleString('default', { month: 'short' })}</div>
          </div>
          {/* Metric selector as pill buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {METRICS.map(({ key, label }) => (
              <motion.button key={key}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setMetric(key)}
                className={metric === key ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 300px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              TS vs AP<br />
              <span style={{ color: 'var(--text-muted)' }}>Government Schools</span>
            </h2>
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', flexShrink: 0 }}
          >
            <GitCompare size={20} color="var(--orange)" />
          </motion.div>
        </div>
      </motion.div>

      {/* ── MAIN CONTENT GRID ── */}
      <motion.div variants={containerVariants} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}
      >

        {/* ── STATS STRIP — mirror of dashboard */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {loading ? (
            [0, 1, 2, 3].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.1 }}
                style={{ height: 90, borderRadius: 16, background: 'rgba(0,0,0,0.04)' }}
              />
            ))
          ) : (
            [
              { icon: School, val: (tsData?.school_count ?? 0) + (apData?.school_count ?? 0), label: 'Total Schools',    color: 'var(--orange)' },
              { icon: Users,  val: tsData?.total_enrollment ?? 0,                             label: 'TS Enrollment',    color: '#1e1a1a'       },
              { icon: Users,  val: apData?.total_enrollment ?? 0,                             label: 'AP Enrollment',    color: 'var(--green)'  },
              { icon: Zap,    val: Math.round(((tsData?.avg_infra_score ?? 0) + (apData?.avg_infra_score ?? 0)) / 2), label: 'Avg Infra Score', color: 'var(--orange)' },
            ].map(({ icon: Icon, val, label, color }) => (
              <motion.div variants={itemVariants} key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  <Icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    <AnimatedCounter value={val} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── INFRA PROGRESS PILLS — full width like dashboard */}
        <motion.div variants={itemVariants} className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Infrastructure Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {infoBars.map(({ label, ts, ap, icon: Icon }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                  <Icon size={13} color="var(--orange)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
                {/* TS bar */}
                <div style={{ marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>TS</span><span style={{ fontWeight: 700, color: '#111' }}>{ts}%</span>
                  </div>
                  <div style={{ height: 28, background: 'rgba(0,0,0,0.04)', borderRadius: 999, position: 'relative' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${ts}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      style={{ height: '100%', background: '#111', borderRadius: 999, display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}
                    >
                      {ts > 15 && `${ts}%`}
                    </motion.div>
                  </div>
                </div>
                {/* AP bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>AP</span><span style={{ fontWeight: 700, color: 'var(--orange)' }}>{ap}%</span>
                  </div>
                  <div style={{ height: 28, background: 'rgba(0,0,0,0.04)', borderRadius: 999, position: 'relative' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${ap}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                      style={{ height: '100%', background: 'var(--orange)', borderRadius: 999, display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}
                    >
                      {ap > 15 && `${ap}%`}
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── TS STATE CARD — mirrors Ward Card */}
        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Map size={22} color="var(--orange)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Telangana</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: '1.25rem' }}>State Overview · {tsData?.data_year || '2023-24'}</div>

          <div style={{ flex: 1 }}>
            {[
              { name: 'Electricity', pct: tsData?.pct_with_electricity ?? 0, color: 'var(--orange)' },
              { name: 'Computer Lab', pct: tsData?.pct_with_computer ?? 0, color: '#1e1a1a' },
              { name: 'Library', pct: tsData?.pct_with_library ?? 0, color: 'var(--green)' },
            ].map(({ name, pct, color }) => (
              <div key={name} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  <span>{name}</span><span style={{ fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.4 }}
                    style={{ height: '100%', background: color, borderRadius: 999 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e1a1a', borderRadius: 12, padding: '0.75rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', marginTop: '1rem' }}>
            <TrendingUp size={14} color="var(--orange)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
              {loading ? '—' : <><AnimatedCounter value={tsData?.school_count ?? 0} /> Schools</>}
            </span>
          </div>
        </motion.div>

        {/* ── AP STATE CARD */}
        <motion.div variants={itemVariants} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Map size={22} color="#1e1a1a" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Andhra Pradesh</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: '1.25rem' }}>State Overview · {apData?.data_year || '2023-24'}</div>

          <div style={{ flex: 1 }}>
            {[
              { name: 'Electricity', pct: apData?.pct_with_electricity ?? 0, color: 'var(--orange)' },
              { name: 'Computer Lab', pct: apData?.pct_with_computer ?? 0, color: '#1e1a1a' },
              { name: 'Library', pct: apData?.pct_with_library ?? 0, color: 'var(--green)' },
            ].map(({ name, pct, color }) => (
              <div key={name} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  <span>{name}</span><span style={{ fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.4 }}
                    style={{ height: '100%', background: color, borderRadius: 999 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e1a1a', borderRadius: 12, padding: '0.75rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', marginTop: '1rem' }}>
            <TrendingUp size={14} color="var(--orange)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
              {loading ? '—' : <><AnimatedCounter value={apData?.school_count ?? 0} /> Schools</>}
            </span>
          </div>
        </motion.div>

        {/* ── BAR CHART CARD — mirrors Top Projects chart */}
        <motion.div variants={itemVariants} className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>District Chart</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, marginTop: '0.25rem' }}>
                Top Regions
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>by {METRICS.find(m => m.key === metric)?.label}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#111', display: 'inline-block' }} /> TS
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--orange)', display: 'inline-block' }} /> AP
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 6 }} />
                <Bar dataKey="TS" name="Telangana" fill="#111" radius={[5, 5, 0, 0]} />
                <Bar dataKey="AP" name="Andhra Pradesh" fill="var(--orange)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── DARK AI INSIGHT CARD — mirrors AI Tasks */}
        <motion.div variants={itemVariants} className="card" style={{ background: '#111', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <School size={18} color="var(--orange)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Quick Stats</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Aggregated UDISE+</div>
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--orange)' }}>
                {loading ? '–' : `${Math.round(((tsData?.avg_infra_score ?? 0) + (apData?.avg_infra_score ?? 0)) / 2)}%`}
              </div>
            </div>

            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(((tsData?.avg_infra_score ?? 0) + (apData?.avg_infra_score ?? 0)) / 2)}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                style={{ height: '100%', background: 'var(--orange)', borderRadius: 999 }}
              />
            </div>

            {[
              { label: 'TS Schools',          val: tsData?.school_count?.toLocaleString()  ?? '–', done: true  },
              { label: 'AP Schools',           val: apData?.school_count?.toLocaleString()  ?? '–', done: true  },
              { label: 'TS Teacher Ratio',     val: `1:${tsData?.student_teacher_ratio ?? '–'}`,    done: true  },
              { label: 'AP Teacher Ratio',     val: `1:${apData?.student_teacher_ratio ?? '–'}`,    done: true  },
              { label: 'TS Source',            val: tsData?.data_source?.replace('_', ' ') ?? 'State MIS', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.done ? 'var(--orange)' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── DISCLAIMER + DISTRICT TABLE — full width at bottom */}
        <motion.div variants={itemVariants} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Disclaimer banner */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '0.875rem 1.25rem', fontSize: '0.8rem' }}>
            <AlertCircle size={16} color="var(--orange)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ color: 'var(--text-secondary)' }}>
              <strong>Data Source Note:</strong> TS data is from <strong>Telangana State MIS</strong> ({tsData?.data_year || '2023-24'}) — via state's own Management Information System.
              AP data is from <strong>UDISE+ direct feed</strong> ({apData?.data_year || '2023-24'}).
              Comparison is approximate due to differing update cycles and reporting methodologies.
            </div>
          </div>

          {/* District table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>District Drill-Down</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click column headers to sort</div>
              </div>
            </div>
            <DistrictTable districts={districts} loading={distLoading} />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
