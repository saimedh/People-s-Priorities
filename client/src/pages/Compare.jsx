import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeftRight, Star, Building2, GraduationCap, MapPin, DollarSign, Users } from 'lucide-react';
import { getRankedProjects, compareProjects } from '../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.75rem 1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.value?.toFixed ? p.value.toFixed(2) : p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Compare() {
  const [projects, setProjects] = useState([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getRankedProjects('all').then((data) => {
      setProjects(data);
      if (data.length >= 2) {
        setSelectedA(data[0].project_id);
        setSelectedB(data[1].project_id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedA && selectedB && selectedA !== selectedB) {
      setLoading(true);
      compareProjects([selectedA, selectedB])
        .then(setComparison)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedA, selectedB]);

  const projectA = comparison?.projects?.find((p) => p.project_id === selectedA);
  const projectB = comparison?.projects?.find((p) => p.project_id === selectedB);

  const chartData = comparison?.projects
    ? [
        {
          metric: 'Demand Score',
          [projectA?.project_name?.split(' ').slice(0, 2).join(' ')]: projectA?.demand_score,
          [projectB?.project_name?.split(' ').slice(0, 2).join(' ')]: projectB?.demand_score,
        },
        {
          metric: 'Cost/Beneficiary',
          [projectA?.project_name?.split(' ').slice(0, 2).join(' ')]: projectA?.cost_per_beneficiary ? Math.round(projectA.cost_per_beneficiary / 1000) : 0,
          [projectB?.project_name?.split(' ').slice(0, 2).join(' ')]: projectB?.cost_per_beneficiary ? Math.round(projectB.cost_per_beneficiary / 1000) : 0,
        },
        {
          metric: 'Priority (×100)',
          [projectA?.project_name?.split(' ').slice(0, 2).join(' ')]: projectA?.final_priority ? +(projectA.final_priority * 100).toFixed(1) : 0,
          [projectB?.project_name?.split(' ').slice(0, 2).join(' ')]: projectB?.final_priority ? +(projectB.final_priority * 100).toFixed(1) : 0,
        },
      ]
    : [];

  const nameA = projectA?.project_name?.split(' ').slice(0, 2).join(' ');
  const nameB = projectB?.project_name?.split(' ').slice(0, 2).join(' ');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Project <span className="gradient-text">Comparison</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Select two projects to compare their demand scores, cost efficiency, and final priority.</p>
      </div>

      {/* Selectors */}
      <div
        className="fade-in-up stagger-1"
        style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}
      >
        <div>
          <label className="form-label">Project A</label>
          <select
            className="form-input"
            value={selectedA}
            onChange={(e) => setSelectedA(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id} style={{ background: 'var(--bg-secondary)' }}>
                {p.project_name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ paddingTop: '1.25rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--orange-dim), var(--purple-dim))',
              border: '1px solid rgba(255,69,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeftRight size={18} color="var(--orange)" />
          </div>
        </div>
        <div>
          <label className="form-label">Project B</label>
          <select
            className="form-input"
            value={selectedB}
            onChange={(e) => setSelectedB(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id} style={{ background: 'var(--bg-secondary)' }}>
                {p.project_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
        </div>
      )}

      {comparison && !loading && (
        <>
          {/* Project Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {[projectA, projectB].map((p, idx) => (
              <ProjectCard
                key={p?.project_id}
                project={p}
                isWinner={comparison.recommended_id === p?.project_id}
                accentColor={idx === 0 ? 'var(--orange)' : 'var(--purple)'}
                animClass={idx === 0 ? 'slide-in-left' : 'slide-in-right'}
              />
            ))}
          </div>

          {/* Chart */}
          <div className="card fade-in-up" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Metric Comparison
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '0.8rem', paddingTop: '1rem' }}
                />
                {nameA && <Bar dataKey={nameA} fill="var(--orange)" radius={[4, 4, 0, 0]} maxBarSize={60} />}
                {nameB && <Bar dataKey={nameB} fill="var(--purple)" radius={[4, 4, 0, 0]} maxBarSize={60} />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendation Banner */}
          <div className="recommended-banner fade-in-up" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--orange-dim), var(--purple-dim))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(255,69,0,0.2)',
                }}
              >
                <Star size={22} color="var(--orange)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--orange)' }}>
                    ✦ Recommended Project
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {comparison.recommended_name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{comparison.reasoning}</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', fontSize: '0.825rem' }}
                  onClick={() => navigate('/rank')}
                >
                  View Full Rankings
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectCard({ project: p, isWinner, accentColor, animClass }) {
  if (!p) return null;

  const typeIcon = p.project_type === 'school_upgrade' ? GraduationCap : Building2;
  const TypeIcon = typeIcon;

  const fields = [
    { icon: MapPin, label: 'Ward', value: p.ward_name },
    { icon: DollarSign, label: 'Cost Estimate', value: `₹${(p.cost_estimate / 100000).toFixed(1)}L` },
    { icon: Users, label: 'Capacity', value: `${p.proposed_capacity?.toLocaleString('en-IN')} seats` },
    { icon: TypeIcon, label: 'Type', value: p.project_type === 'school_upgrade' ? 'School Upgrade' : 'Vocational Centre' },
  ];

  return (
    <div
      className={`card ${animClass}`}
      style={{
        border: `1px solid ${accentColor}30`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isWinner && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'linear-gradient(135deg, #FF6B35, #8B5CF6)',
            color: 'white',
            padding: '0.2rem 0.6rem',
            borderRadius: 999,
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          ⭐ RECOMMENDED
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingRight: isWinner ? 100 : 0 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: `${accentColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${accentColor}25`,
            flexShrink: 0,
          }}
        >
          <TypeIcon size={20} color={accentColor} />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.project_name}</h3>
      </div>

      {p.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>{p.description}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {fields.map(({ icon: Ic, label, value }) => (
          <div key={label} style={{ background: 'var(--border-subtle)', borderRadius: 10, padding: '0.75rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Ic size={12} color="var(--text-muted)" />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Score Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {[
          { label: 'Demand Score', value: p.demand_score, max: 200, fmt: (v) => v?.toFixed(1) },
          { label: 'Priority', value: p.final_priority * 100, max: 100, fmt: (v) => `${v?.toFixed(1)}%` },
        ].map(({ label, value, max, fmt }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              <span style={{ fontSize: '0.8rem', color: accentColor, fontWeight: 700 }}>{fmt(value)}</span>
            </div>
            <div className="priority-bar-track">
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (value / max) * 100)}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
                  borderRadius: 3,
                  transition: 'width 1.2s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
