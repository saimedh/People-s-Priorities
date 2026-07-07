import { useState, useEffect, useCallback } from 'react';
import { getLocalPulse, refreshLocalPulse, getWards } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, MapPin, ExternalLink, AlertTriangle,
  Lightbulb, CheckCircle, ChevronRight, Radio
} from 'lucide-react';

/* ─── Category Config ────────────────────────────────────────────── */
const CATEGORIES = [
  {
    key: 'issues',
    label: 'Critical Issues',
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    gradFrom: '#ef4444',
    gradTo: '#dc2626',
    tagBg: 'rgba(239,68,68,0.12)',
    tagColor: '#ef4444',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=60',
    emptyMsg: 'No critical issues tracked right now.',
  },
  {
    key: 'problems',
    label: 'Ongoing Problems',
    icon: Lightbulb,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    gradFrom: '#f97316',
    gradTo: '#ea580c',
    tagBg: 'rgba(249,115,22,0.12)',
    tagColor: '#f97316',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=60',
    emptyMsg: 'No ongoing problems detected.',
  },
  {
    key: 'good_news',
    label: 'Good News',
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    gradFrom: '#22c55e',
    gradTo: '#16a34a',
    tagBg: 'rgba(34,197,94,0.12)',
    tagColor: '#22c55e',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&auto=format&fit=crop&q=60',
    emptyMsg: 'No positive developments yet.',
  },
];

/* ─── Individual News Card ───────────────────────────────────────── */
function NewsCard({ item, cat, index }) {
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.10)' }}
      style={{
        background: 'white',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        cursor: 'default',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Coloured header strip with icon */}
      <div style={{
        padding: '1rem 1.25rem 0.75rem',
        background: `linear-gradient(135deg, ${cat.gradFrom}18 0%, ${cat.gradTo}08 100%)`,
        borderBottom: `1px solid ${cat.color}18`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: cat.tagBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color={cat.color} />
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: cat.color,
        }}>
          {cat.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          lineHeight: 1.65,
          marginBottom: '1rem',
          fontWeight: 450,
        }}>
          {item.summary}
        </p>

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: '0.75rem', fontWeight: 600, color: cat.color,
              textDecoration: 'none',
              background: cat.tagBg,
              padding: '0.35rem 0.75rem',
              borderRadius: 99,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Read Source <ExternalLink size={11} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Category Column ────────────────────────────────────────────── */
function CategoryColumn({ cat, items, loading }) {
  const Icon = cat.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Column header card with hero image */}
      <div style={{
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'relative',
        height: 160,
      }}>
        <img
          src={cat.image}
          alt={cat.label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, ${cat.gradFrom}cc 0%, ${cat.gradTo}99 100%)`,
        }} />
        {/* Text on image */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                {items.length} item{items.length !== 1 ? 's' : ''} tracked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {loading ? (
          [0, 1].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              style={{ height: 110, borderRadius: 18, background: 'rgba(0,0,0,0.06)' }}
            />
          ))
        ) : items.length > 0 ? (
          items.map((item, i) => (
            <NewsCard key={i} item={item} cat={cat} index={i} />
          ))
        ) : (
          <div style={{
            padding: '2.5rem 1.5rem', textAlign: 'center',
            background: cat.bg, borderRadius: 18,
            border: `1.5px dashed ${cat.color}40`,
          }}>
            <Icon size={28} color={cat.color} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.emptyMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LocalPulse() {
  const [wards, setWards] = useState([]);
  const [selectedState, setSelectedState] = useState('TS');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState([]);
  const [news, setNews] = useState({ issues: [], problems: [], good_news: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getWards().then((data) => {
      setWards(data);
      const tsDistricts = Array.from(new Set(data.filter(w => w.state === 'TS').map(w => w.district))).filter(Boolean);
      if (tsDistricts.length > 0) { setDistricts(tsDistricts); setSelectedDistrict(tsDistricts[0]); }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (wards.length > 0) {
      const dists = Array.from(new Set(wards.filter(w => w.state === selectedState).map(w => w.district))).filter(Boolean);
      setDistricts(dists);
      if (dists.length > 0 && !dists.includes(selectedDistrict)) setSelectedDistrict(dists[0]);
    }
  }, [selectedState, wards]);

  const loadNews = useCallback(async () => {
    if (!selectedDistrict) return;
    setLoading(true); setError('');
    try { setNews(await getLocalPulse(selectedDistrict, selectedState)); }
    catch { setError('Failed to load local pulse.'); }
    finally { setLoading(false); }
  }, [selectedDistrict, selectedState]);

  useEffect(() => { loadNews(); }, [loadNews]);

  const handleRefresh = async () => {
    if (!selectedDistrict) return;
    setRefreshing(true); setError('');
    try {
      const result = await refreshLocalPulse(selectedDistrict, selectedState);
      setNews(result.data);
    } catch { setError('Failed to fetch new data from Gemini/RSS.'); }
    finally { setRefreshing(false); }
  };

  const totalItems = (news.issues?.length || 0) + (news.problems?.length || 0) + (news.good_news?.length || 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── TOP BAR ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Local Pulse</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Gemini 2.0 · Live tracking
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 80, borderRadius: 99, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
          >
            <option value="TS">Telangana</option>
            <option value="AP">Andhra Pradesh</option>
          </select>

          <select
            className="admin-input"
            style={{ width: 'auto', minWidth: 150, borderRadius: 99, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            disabled={districts.length === 0}
          >
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
            {districts.length === 0 && <option value="">No districts</option>}
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={refreshing || !selectedDistrict}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 99, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={14} />
            </motion.div>
            {refreshing ? 'Fetching…' : 'Refresh Data'}
          </motion.button>
        </div>

        {/* Right side */}
        <div style={{ flex: '1 1 300px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {selectedDistrict || '—'}<br />
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{selectedState === 'TS' ? 'Telangana' : 'Andhra Pradesh'} · {totalItems} items</span>
            </h2>
          </div>
          <motion.div whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', flexShrink: 0 }}>
            <MapPin size={20} color="var(--orange)" />
          </motion.div>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 14, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {CATEGORIES.map(cat => (
          <CategoryColumn
            key={cat.key}
            cat={cat}
            items={news[cat.key] || []}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
