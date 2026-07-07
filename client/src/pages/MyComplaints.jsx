import { useEffect, useState } from 'react';
import { getSubmissions } from '../utils/api';
import { FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now we fetch all complaints since we don't have proper user auth wired in the frontend yet
    getSubmissions().then(data => {
      setComplaints(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>My Complaints</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track the status of your submitted complaints and feedback.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={48} color="var(--border-accent)" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No complaints found</div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>You haven't submitted any feedback yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {complaints.map(c => (
            <div key={c.submission_id} className="card scale-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>
                    {c.category || 'Uncategorized'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {c.complaint_text.length > 100 ? c.complaint_text.substring(0, 100) + '...' : c.complaint_text}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Location: <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{c.ward_name}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, 
                    color: c.status === 'Closed' ? '#22c55e' : c.status === 'In Progress' ? 'var(--orange)' : 'var(--text-secondary)' }}>
                    {c.status === 'Closed' ? <CheckCircle2 size={16} /> : c.status === 'In Progress' ? <ArrowRight size={16} /> : <Clock size={16} />}
                    {c.status || 'Submitted'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Priority</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, 
                    color: c.priority_level === 'Critical' ? '#ef4444' : c.priority_level === 'High' ? 'var(--orange)' : 'var(--text-secondary)' }}>
                    {c.priority_level === 'Critical' && <AlertTriangle size={16} />}
                    {c.priority_level || 'Low'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
