import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = {
    success: { icon: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
    error: { icon: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    info: { icon: 'var(--purple)', border: 'rgba(139, 92, 246, 0.3)' },
  };

  const Icon = icons[type] || Info;
  const color = colors[type] || colors.info;

  return (
    <div
      className="toast"
      style={{
        borderColor: color.border,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <Icon size={20} color={color.icon} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{message}</div>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
