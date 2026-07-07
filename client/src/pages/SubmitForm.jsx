import { useState } from 'react';
import { MapPin, Upload, MessageSquare, User, Building2, GraduationCap, CheckCircle, HelpCircle, School, Wrench, ShieldCheck } from 'lucide-react';
import { submitCitizenForm } from '../utils/api';
import Toast from '../components/Toast';

const WARDS = [
  { id: 'ward_1', name: 'Kukatpally' },
  { id: 'ward_2', name: 'KPHB Colony' },
  { id: 'ward_3', name: 'Nizampet' },
];

const INITIAL_FORM = {
  name: '',
  ward_id: 'ward_1',
  ward_name: 'Kukatpally',
  complaint_text: '',
  project_type_suggested: '',
  attachment: null,
};

export default function SubmitForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === 'ward_id' ? { ward_name: WARDS.find((w) => w.id === value)?.name || value } : {}),
    }));
    if (name === 'complaint_text') setCharCount(value.length);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((f) => ({ ...f, attachment: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.complaint_text.trim()) {
      setToast({ message: 'Please enter your complaint or feedback.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name || undefined,
        ward_id: form.ward_id,
        ward_name: form.ward_name,
        complaint_text: form.complaint_text,
        project_type_suggested: form.project_type_suggested || undefined,
        attachment: form.attachment || undefined,
      };
      await submitCitizenForm(payload);
      setSubmitted(true);
      setToast({ message: 'Submission received! Your feedback has been recorded.', type: 'success' });
      setTimeout(() => setSubmitted(false), 6000);
      setForm(INITIAL_FORM);
      setCharCount(0);
    } catch (err) {
      setToast({ message: 'Submission failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Citizen <span className="gradient-text">Submission</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Share your concerns about local infrastructure. Your feedback directly influences project prioritization.
        </p>
      </div>

      {/* Success State */}
      {submitted && (
        <div
          className="card scale-in"
          style={{
            marginBottom: '1.5rem',
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
          }}
        >
          <CheckCircle size={32} color="#22c55e" />
          <div>
            <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: '0.25rem' }}>Thank you for your submission!</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Your feedback has been recorded and will be considered in the next priority assessment cycle.
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="fade-in-up stagger-1">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name */}
          <div>
            <label className="form-label">
              <User size={12} style={{ display: 'inline', marginRight: 4 }} />
              Your Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="form-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Anonymous"
            />
          </div>

          {/* Ward */}
          <div>
            <label className="form-label">
              <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
              Your Ward / Location *
            </label>
            <select
              className="form-input"
              name="ward_id"
              value={form.ward_id}
              onChange={handleChange}
            >
              {WARDS.map((w) => (
                <option key={w.id} value={w.id} style={{ background: 'var(--bg-secondary)' }}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Project Type */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Project Type Suggestion
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {[
                { id: '', label: 'No Preference', icon: <HelpCircle size={20} /> },
                { id: 'school_upgrade', label: 'School Upgrade', icon: <School size={20} /> },
                { id: 'vocational_centre', label: 'Vocational Centre', icon: <Wrench size={20} /> },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, project_type_suggested: id }))}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 12,
                    border: `1px solid ${form.project_type_suggested === id ? (id === 'school_upgrade' ? 'var(--orange)' : id === 'vocational_centre' ? 'var(--purple)' : 'var(--text-muted)') : 'var(--border-subtle)'}`,
                    background: form.project_type_suggested === id
                      ? id === 'school_upgrade' ? 'rgba(255,69,0,0.1)' : id === 'vocational_centre' ? 'rgba(124,58,237,0.1)' : 'var(--border-subtle)'
                      : 'var(--border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: form.project_type_suggested === id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Complaint */}
          <div>
            <label className="form-label">
              <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
              Complaint / Feedback *
            </label>
            <textarea
              className="form-input"
              name="complaint_text"
              value={form.complaint_text}
              onChange={handleChange}
              placeholder="Describe the infrastructure problem in your area. What impact is it having on residents? What improvement would you suggest?"
              rows={5}
              style={{ resize: 'vertical', minHeight: 120 }}
              maxLength={1000}
            />
            <div style={{ fontSize: '0.72rem', color: charCount > 800 ? 'var(--orange)' : 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
              {charCount}/1000 characters
            </div>
          </div>

          {/* Photo Upload (UI Only) */}
          <div>
            <label className="form-label">
              <Upload size={12} style={{ display: 'inline', marginRight: 4 }} />
              Attach Photo <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional, demo UI)</span>
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1.5rem',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
                background: form.attachment ? 'rgba(34,197,94,0.05)' : 'var(--border-subtle)',
                borderColor: form.attachment ? '#22c55e50' : 'var(--border-subtle)',
              }}
            >
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              {form.attachment ? (
                <>
                  <CheckCircle size={24} color="#22c55e" />
                  <span style={{ fontSize: '0.825rem', color: '#22c55e', fontWeight: 600 }}>{form.attachment.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to change</span>
                </>
              ) : (
                <>
                  <Upload size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Click to upload or drag & drop</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG, WEBP up to 5MB</span>
                </>
              )}
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.95rem' }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
                Submitting...
              </>
            ) : (
              <>
                <MessageSquare size={16} />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info box */}
      <div
        className="card fade-in-up stagger-3"
        style={{
          marginTop: '1.5rem',
          background: 'rgba(124,58,237,0.05)',
          border: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} color="var(--purple-light)" /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Your data is protected
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Name is optional and never shared publicly. Your complaint is anonymized before AI analysis. 
              All submissions are reviewed by constituency officials before influencing any priority decisions.
            </p>
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
