import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import { School, Wrench, MapPin, BarChart2 } from 'lucide-react';
import { getHotspots } from '../utils/api';
import 'leaflet/dist/leaflet.css';

const CENTER = [17.4948, 78.3996];
const ZOOM = 13;

function Legend() {
  return (
    <div
      className="map-legend"
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Legend
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          { color: 'var(--orange)', label: 'School Upgrade', icon: <School size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> },
          { color: 'var(--purple)', label: 'Vocational Centre', icon: <Wrench size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> },
        ].map(({ color, label, icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: color,
                opacity: 0.8,
                flexShrink: 0,
                boxShadow: `0 0 8px ${color}60`,
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{icon} {label}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Circle size = demand intensity</div>
        </div>
      </div>
    </div>
  );
}

export default function Heatmap() {
  const [hotspots, setHotspots] = useState([]);
  const [showSchool, setShowSchool] = useState(true);
  const [showVocational, setShowVocational] = useState(true);
  const [selectedWard, setSelectedWard] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getHotspots(selectedWard)
      .then(setHotspots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedWard]);

  const visible = hotspots.filter((h) => {
    if (h.project_type === 'school_upgrade' && !showSchool) return false;
    if (h.project_type === 'vocational_centre' && !showVocational) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Demand <span className="gradient-text">Heatmap</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Geographic visualization of infrastructure demand intensity across the constituency.</p>
      </div>

      {/* Controls */}
      <div
        className="card fade-in-up stagger-1"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', padding: '1rem 1.25rem' }}
      >
        <div>
          <label className="form-label" style={{ marginBottom: '0.25rem' }}>Ward Filter</label>
          <select
            className="form-input"
            style={{ width: 180 }}
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
          >
            {[
              { id: 'all', name: 'All Wards' },
              { id: 'ward_1', name: 'Kukatpally' },
              { id: 'ward_2', name: 'KPHB Colony' },
              { id: 'ward_3', name: 'Nizampet' },
            ].map((w) => (
              <option key={w.id} value={w.id} style={{ background: 'var(--bg-secondary)' }}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Layer toggles */}
        <div>
          <div className="form-label" style={{ marginBottom: '0.25rem' }}>Layer Visibility</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <ToggleButton
              label={<><School size={12} style={{ display: 'inline', marginRight: 4 }} /> Schools</>}
              active={showSchool}
              onClick={() => setShowSchool((v) => !v)}
              color="var(--orange)"
            />
            <ToggleButton
              label={<><Wrench size={12} style={{ display: 'inline', marginRight: 4 }} /> Vocational</>}
              active={showVocational}
              onClick={() => setShowVocational((v) => !v)}
              color="var(--purple)"
            />
          </div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{visible.length}</span> of {hotspots.length} hotspots
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="fade-in-up stagger-2"
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          height: 560,
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 9999,
            background: 'rgba(250,248,245,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ color: 'var(--orange)', fontWeight: 600 }}>Loading hotspots...</div>
          </div>
        )}

        <MapContainer
          center={CENTER}
          zoom={ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {visible.map((h) => (
            <CircleMarker
              key={h.project_id}
              center={[h.lat, h.lng]}
              radius={8 + (h.intensity / 100) * 22}
              fillColor={h.project_type === 'school_upgrade' ? 'var(--orange)' : 'var(--purple)'}
              color={h.project_type === 'school_upgrade' ? 'var(--orange)' : 'var(--purple)'}
              weight={1.5}
              opacity={0.9}
              fillOpacity={0.45}
            >
              <Popup>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    padding: '0.75rem',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    minWidth: 220,
                    fontFamily: '"Google Sans", sans-serif',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{h.project_name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span
                      style={{
                        background: h.project_type === 'school_upgrade' ? 'rgba(255,69,0,0.15)' : 'rgba(124,58,237,0.15)',
                        color: h.project_type === 'school_upgrade' ? 'var(--orange)' : 'var(--purple)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 99,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {h.project_type === 'school_upgrade' ? <><School size={12} style={{ display: 'inline', marginRight: 4 }}/> School</> : <><Wrench size={12} style={{ display: 'inline', marginRight: 4 }}/> Vocational</>}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> {h.ward_name}</div>
                    <div><BarChart2 size={12} style={{ display: 'inline', marginRight: 4 }} /> Demand Intensity: <strong style={{ color: 'var(--orange)' }}>{h.intensity.toFixed(0)}%</strong></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <Legend />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
        {[
          { label: 'Total Hotspots', value: hotspots.length, color: 'var(--orange)' },
          { label: 'School Upgrade', value: hotspots.filter((h) => h.project_type === 'school_upgrade').length, color: 'var(--orange)' },
          { label: 'Vocational Centre', value: hotspots.filter((h) => h.project_type === 'vocational_centre').length, color: 'var(--purple)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card fade-in-up" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color, fontFamily: '"Google Sans", sans-serif' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleButton({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 0.875rem',
        borderRadius: 8,
        border: `1px solid ${active ? color + '50' : 'var(--border-subtle)'}`,
        background: active ? `${color}12` : 'transparent',
        color: active ? color : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? color : 'var(--text-muted)',
          display: 'inline-block',
          transition: 'background 0.2s',
        }}
      />
      {label}
    </button>
  );
}
