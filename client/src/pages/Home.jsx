import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, BarChart2, Radio, Map, MessageSquare, 
  Sparkles, Shield, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStats } from '../utils/api';
import AnimatedCounter from '../components/AnimatedCounter';
import { LayoutGrid } from '../components/LayoutGrid';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    getStats().then(setStats).catch(console.error);
  }, []);

  const features = [
    { id: 'dashboard', title: 'Dashboard', desc: 'Algorithmically ranks projects by demand, capacity gap, and cost.', icon: BarChart2, color: 'var(--orange)', bg: 'rgba(219,65,32,0.1)', path: '/dashboard' },
    { id: 'local-pulse', title: 'Local Pulse', desc: 'Real-time AI analysis of news across AP and TS districts.', icon: Radio, color: 'var(--purple)', bg: 'rgba(147,51,234,0.1)', path: '/local-pulse' },
    { id: 'heatmap', title: 'Heatmap', desc: 'Visualize high-stress zones based on unemployment and overcrowding.', icon: Map, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', path: '/map' },
    { id: 'feedback', title: 'Submit Issue', desc: 'Direct channels for residents to report infrastructure gaps.', icon: MessageSquare, color: '#1e1a1a', bg: 'rgba(30,26,26,0.06)', path: '/submit' },
    { id: 'compare', title: 'Compare Wards', desc: 'Side-by-side comparison of local infrastructure metrics.', icon: ArrowRight, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/compare' },
    { id: 'compare-states', title: 'TS vs AP', desc: 'Macro-level analysis comparing Telangana and Andhra Pradesh.', icon: BarChart2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/compare-states' },
    { id: 'chat', title: 'GOVCH AI', desc: 'Chat with our AI to get deep insights on constituency data.', icon: Sparkles, color: '#eab308', bg: 'rgba(234,179,8,0.1)', path: '/chat' },
    { id: 'my-complaints', title: 'My Complaints', desc: 'Track your submitted issues and AI categorizations.', icon: Shield, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', path: '/my-complaints' },
    { id: 'staff', title: 'Staff Dashboard', desc: 'Manage assigned complaints and update project statuses.', icon: CheckCircle2, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', path: '/staff' },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <div className="crx-in" style={{ textAlign: 'center', margin: '4rem 0 6rem' }}>
        <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.05, maxWidth: 900, margin: '0 auto' }}>
          People's Priorities <br />
          <span className="gradient-text-orange">AI Development Platform</span>
        </h1>
        
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--text-muted)', maxWidth: 650, margin: '1.5rem auto 2.5rem', lineHeight: 1.6 }}>
          Transforming constituency development in Telangana and Andhra Pradesh with data-driven prioritization, real-time news tracking, and actionable insights.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '0.875rem 1.5rem', fontSize: '1rem' }}>
            Explore Dashboard <ArrowRight size={16} />
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/submit')} style={{ padding: '0.875rem 1.5rem', fontSize: '1rem', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)' }}>
            Submit Feedback
          </button>
        </div>
      </div>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <div className="crx-card crx-in" style={{ animationDelay: '0.1s', padding: '2.5rem 2rem', marginBottom: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
        {[
          { label: 'Districts Tracked', val: 19, suffix: '' },
          { label: 'Analyzed Projects', val: stats?.total_projects || 0, suffix: '+' },
          { label: 'Citizen Reports', val: stats?.total_submissions || 0, suffix: '' },
        ].map((stat, i) => (
          <div key={i} style={{ borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.25rem' }}>
              <AnimatedCounter value={stat.val} />{stat.suffix}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* ── MODULES / ALL PAGES GRID ──────────────────────────────────────── */}
      <div className="crx-in" style={{ animationDelay: '0.12s', marginBottom: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Explore Platform Modules</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>Access all tools and dashboards available in the constituency platform.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.id} onClick={() => navigate(f.path)} className="card hover-scale" style={{ cursor: 'pointer', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HOW IT WORKS SECTION ────────────────────────────────────────── */}
      <div className="crx-in" style={{ animationDelay: '0.15s', marginBottom: '5rem', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>How It Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.75rem', maxWidth: 650, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Our platform bridges the gap between citizens and government by using a smart, data-driven pipeline to ensure public funds are allocated where they are needed the most.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: 1100, margin: '0 auto' }}>
          {[
            { step: '1', title: 'Data Collection & Ingestion', desc: 'We continuously aggregate UDISE+ school statistics, local demographics, and direct citizen reports across Telangana and Andhra Pradesh districts.', icon: <BarChart2 size={24} color="var(--orange)" /> },
            { step: '2', title: 'Real-Time AI Analysis', desc: 'Using Gemini 2.0, the platform analyzes local news, social pulse, and citizen sentiment to identify urgent, emerging infrastructure needs.', icon: <Sparkles size={24} color="var(--purple)" /> },
            { step: '3', title: 'Algorithmic Prioritization', desc: 'Our engine scores every proposed project by demand, capacity gap, and cost per beneficiary to highlight the most impactful investments.', icon: <CheckCircle2 size={24} color="#22c55e" /> },
          ].map((item, i) => (
            <div key={i} className="crx-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '8rem', fontWeight: 900, color: 'rgba(0,0,0,0.03)', lineHeight: 1 }}>{item.step}</div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', zIndex: 1 }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, zIndex: 1 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── IMPACT & COVERAGE SECTION ───────────────────────────────────── */}
      <div className="crx-in" style={{ animationDelay: '0.18s', marginBottom: '5rem', padding: '0 1rem' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '4rem 2rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
          <Shield size={40} color="var(--orange)" style={{ opacity: 0.8 }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Impact & Regional Coverage
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 850, lineHeight: 1.6, margin: 0 }}>
            Focusing on the critical gap in educational and vocational infrastructure, our platform tracks localized data across <strong style={{ color: 'var(--text-primary)' }}>19 key districts</strong> in Telangana (TS) and Andhra Pradesh (AP). By analyzing UDISE+ school data alongside demographic stress factors, we empower policymakers to make transparent, high-ROI investments that directly improve the lives of millions.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(219,65,32,0.1)', color: 'var(--orange)', borderRadius: 999, fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(219,65,32,0.2)' }}>Telangana (TS) Focus</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 999, fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(34,197,94,0.2)' }}>Andhra Pradesh (AP) Focus</span>
            <span style={{ padding: '0.5rem 1rem', background: 'rgba(147,51,234,0.1)', color: 'var(--purple)', borderRadius: 999, fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(147,51,234,0.2)' }}>Data-Driven Transparency</span>
          </div>
        </div>
      </div>

      {/* ── FEATURES GRID (BENTO) ───────────────────────────────────────── */}
      <div className="crx-in" style={{ animationDelay: '0.2s', marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Platform Capabilities</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Everything you need to track, rank, and execute.</p>
        </div>

        <div style={{ height: '80vh', minHeight: 600 }}>
          <LayoutGrid cards={cards} />
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="crx-in" style={{ animationDelay: '0.25s', borderTop: '1px solid var(--border)', paddingTop: '3rem', paddingBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            <BarChart2 size={20} color="var(--orange)" /> People's Priorities
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Empowering constituency development through AI.
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem' }}>
          <a href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>Dashboard</a>
          <a href="/local-pulse" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>Local Pulse</a>
          <a href="/map" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>Heatmap</a>
          <a href="/submit" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>Report Issue</a>
        </div>
      </footer>

    </div>
  );
}

const SkeletonOne = () => (
  <div>
    <p style={{ fontWeight: 800, fontSize: '2.5rem', color: 'white', margin: 0, lineHeight: 1.1 }}>Priority Engine</p>
    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.75rem', marginBottom: '1.5rem', maxWidth: 500, lineHeight: 1.5 }}>
      Algorithmically ranks infrastructure projects by demand, capacity gap, and cost per beneficiary.
    </p>
    <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#111', textDecoration: 'none', background: 'white', padding: '0.5rem 1.25rem', borderRadius: 99, transition: 'transform 0.2s' }}>
      Try it out →
    </a>
  </div>
);

const SkeletonTwo = () => (
  <div>
    <p style={{ fontWeight: 800, fontSize: '2.5rem', color: 'white', margin: 0, lineHeight: 1.1 }}>Local Pulse</p>
    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.75rem', marginBottom: '1.5rem', maxWidth: 500, lineHeight: 1.5 }}>
      Real-time Gemini 2.0 AI analysis of local news and issues across AP and TS districts.
    </p>
    <a href="/local-pulse" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#111', textDecoration: 'none', background: 'white', padding: '0.5rem 1.25rem', borderRadius: 99, transition: 'transform 0.2s' }}>
      Try it out →
    </a>
  </div>
);

const SkeletonThree = () => (
  <div>
    <p style={{ fontWeight: 800, fontSize: '2.5rem', color: 'white', margin: 0, lineHeight: 1.1 }}>Demand Heatmap</p>
    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.75rem', marginBottom: '1.5rem', maxWidth: 500, lineHeight: 1.5 }}>
      Visualize high-stress zones based on youth unemployment and school overcrowding.
    </p>
    <a href="/map" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#111', textDecoration: 'none', background: 'white', padding: '0.5rem 1.25rem', borderRadius: 99, transition: 'transform 0.2s' }}>
      Try it out →
    </a>
  </div>
);

const SkeletonFour = () => (
  <div>
    <p style={{ fontWeight: 800, fontSize: '2.5rem', color: 'white', margin: 0, lineHeight: 1.1 }}>Citizen Voice</p>
    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.75rem', marginBottom: '1.5rem', maxWidth: 500, lineHeight: 1.5 }}>
      Direct channels for residents to report infrastructure gaps, driving AI-summarized insights.
    </p>
    <a href="/submit" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#111', textDecoration: 'none', background: 'white', padding: '0.5rem 1.25rem', borderRadius: 99, transition: 'transform 0.2s' }}>
      Try it out →
    </a>
  </div>
);

const cards = [
  {
    id: 1,
    content: <SkeletonOne />,
    className: "md:col-span-2",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 2,
    content: <SkeletonTwo />,
    className: "col-span-1",
    thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    content: <SkeletonThree />,
    className: "col-span-1",
    thumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop",
  },
  {
    id: 4,
    content: <SkeletonFour />,
    className: "md:col-span-2",
    thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop",
  },
];

