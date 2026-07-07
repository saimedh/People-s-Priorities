import { useEffect, useState } from 'react';
import { getSubmissions } from '../utils/api';
import { ShieldCheck, FileText, Settings, Search } from 'lucide-react';
import Toast from '../components/Toast';

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchComplaints = () => {
    getSubmissions().then(data => {
      setComplaints(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/submissions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-for-now'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
        fetchComplaints();
      } else {
        setToast({ message: 'Failed to update status', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Error updating status', type: 'error' });
    }
  };

  const filtered = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={28} color="var(--orange)" />
            Staff / Officer Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage assigned complaints, update statuses, and coordinate field work.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['All', 'Submitted', 'In Progress', 'Closed'].map(f => (
            <button key={f} className="btn btn-ghost" style={{ background: filter === f ? 'var(--border-subtle)' : 'transparent' }} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Complaint</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Location</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Category</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Priority</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.submission_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem 1.5rem', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                      {c.complaint_text}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.ward_name}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>
                        {c.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.priority_level === 'Critical' ? '#ef4444' : c.priority_level === 'High' ? 'var(--orange)' : 'var(--text-muted)' }}>
                        {c.priority_level || 'Low'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600 }}>{c.status || 'Submitted'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <select 
                        style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        value={c.status || 'Submitted'} 
                        onChange={(e) => updateStatus(c.submission_id, e.target.value)}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
