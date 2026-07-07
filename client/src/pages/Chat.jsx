import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, User, Globe, Sparkles,
  RefreshCw, Copy, CheckCheck, Zap, School, Map,
  Brain, MessageSquare, TrendingUp, AlertTriangle
} from 'lucide-react';
import { sendChatMessage } from '../utils/api';
import { AIChatInput } from '../components/AIChatInput';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CHIPS = [
  { label: 'TS vs AP enrollment',       icon: School, msg: 'Compare total school enrollment between Telangana and Andhra Pradesh.' },
  { label: 'Best infra state?',         icon: Zap,    msg: 'Which state, TS or AP, has better school infrastructure scores?' },
  { label: 'Top districts',             icon: Map,    msg: 'Which districts in TS and AP have the highest school enrollment?' },
  { label: 'Teacher ratio analysis',    icon: Brain,  msg: 'Analyze the student-to-teacher ratio difference between TS and AP government schools.' },
];

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar — mirrors dashboard style */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser ? '#111' : 'white',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        {isUser
          ? <User size={16} color="white" />
          : <Sparkles size={16} color="var(--orange)" />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '76%', position: 'relative' }}>
        <div style={{
          padding: '0.875rem 1.125rem',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          background: isUser ? '#111' : 'white',
          color: isUser ? 'white' : 'var(--text-primary)',
          fontSize: '0.88rem',
          lineHeight: 1.65,
          border: isUser ? 'none' : '1px solid var(--border-subtle)',
          boxShadow: isUser ? 'none' : '0 2px 10px rgba(0,0,0,0.04)',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
          {msg.web_context_used && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Globe size={11} /> Live web context via TinyFish
            </div>
          )}
        </div>
        {!isUser && (
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={copy}
            style={{ position: 'absolute', top: 8, right: -30, width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}
            title="Copy"
          >
            {copied ? <CheckCheck size={12} color="var(--green)" /> : <Copy size={12} color="var(--text-muted)" />}
          </motion.button>
        )}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Thinking Dots ─────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles size={16} color="var(--orange)" />
      </div>
      <div style={{ padding: '0.875rem 1.25rem', borderRadius: '4px 18px 18px 18px', background: 'white', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm the People's Priorities AI Assistant — powered by TinyFish Search and local analytics.\n\nI can help you with:\n• District & Ward data — Ask about any TS or AP city\n• Complaint tracking & AI classification\n• Project analytics & infrastructure insights\n• Live web search for news and policies\n\nWhat would you like to explore today?",
    ts: Date.now(),
    web_context_used: false,
  }]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [useWeb, setUseWeb]     = useState(false);
  const [webUrl, setWebUrl]     = useState('');
  const [error, setError]       = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (overrideMsg) => {
    const text = (overrideMsg || input).trim();
    if (!text || thinking) return;
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text, ts: Date.now() }]);
    setInput('');
    setThinking(true);

    const history = messages
      .filter((m, i) => !(m.role === 'assistant' && i === 0))
      .map(m => ({ role: m.role, content: m.content }));
    const urls = useWeb && webUrl.trim() ? [webUrl.trim()] : [];

    try {
      const reply = await sendChatMessage(text, history, urls);
      setMessages(prev => [...prev, { ...reply, ts: Date.now() }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message}. Please check that the server is running on port 5000.`,
        ts: Date.now(),
        web_context_used: false,
      }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: 'Chat cleared! How can I help you with constituency data?',
    ts: Date.now(),
    web_context_used: false,
  }]);

  const aiStats = [
    { label: 'Messages', value: messages.length, color: 'var(--orange)' },
    { label: 'AI Replies', value: messages.filter(m => m.role === 'assistant').length, color: '#111' },
    { label: 'Web Fetches', value: messages.filter(m => m.web_context_used).length, color: 'var(--green)' },
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
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
            AI
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>AI Assistant</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              TinyFish Search · Local Analytics
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', paddingRight: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{new Date().getDate()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date().toLocaleString('default', { month: 'short' })}</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}
          >
            New Chat →
          </motion.button>
        </div>

        <div style={{ flex: '1 1 300px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Hey, Need help?<br />
              <span style={{ color: 'var(--text-muted)' }}>Just ask me anything!</span>
            </h2>
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', flexShrink: 0 }}
          >
            <Sparkles size={20} color="var(--orange)" />
          </motion.div>
        </div>
      </motion.div>

      {/* ── MAIN GRID ── */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}
      >
        {/* LEFT — Chat panel */}
        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Quick chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CHIPS.map(({ label, icon: Icon, msg }) => (
              <motion.button key={label}
                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                onClick={() => !thinking && send(msg)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, border: '1px solid var(--border-subtle)', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}
              >
                <Icon size={13} color="var(--orange)" />{label}
              </motion.button>
            ))}
          </div>

          {/* Message area */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <MessageSquare size={16} color="var(--orange)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Conversation</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 99 }}>
                  {messages.length} messages
                </span>
              </div>
              {/* Removed redundant web toggle, it's now in AIChatInput */}
            </div>

            {/* URL input */}
            <AnimatePresence>
              {useWeb && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)', padding: '0 1.5rem' }}
                >
                  <input
                    placeholder="https://timesofindia.com/..."
                    value={webUrl}
                    onChange={e => setWebUrl(e.target.value)}
                    style={{ width: '100%', height: 40, border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)', background: 'transparent' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div style={{ height: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
              <AnimatePresence initial={false}>
                {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
                {thinking && (
                  <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ThinkingDots />
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Animated Input Row */}
            <AIChatInput onSend={send} disabled={thinking} useWeb={useWeb} setUseWeb={setUseWeb} />
          </div>
        </motion.div>

        {/* RIGHT — Side panel (dark card, mirrors AI Tasks) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* AI Status — dark card like Dashboard */}
          <motion.div variants={itemVariants} className="card" style={{ background: '#111', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="var(--orange)" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>AI Status</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>TinyFish Powered</div>
              </div>
            </div>

            {/* Stats */}
            {aiStats.map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</span>
              </div>
            ))}

            {/* Usage bar */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
                <span>Session activity</span>
                <span>{messages.length} turns</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((messages.length / 20) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ height: '100%', background: 'var(--orange)', borderRadius: 999 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Quick stats cards — same pattern as dashboard stat strip */}
          <motion.div variants={itemVariants} className="card">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '1rem' }}>Suggested Topics</div>
            {[
              { label: 'School Infrastructure', pct: 78, color: 'var(--orange)' },
              { label: 'Teacher Shortage',       pct: 55, color: '#111'         },
              { label: 'Enrollment Trends',      pct: 63, color: 'var(--green)' },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  <span>{label}</span><span style={{ fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }}
                    style={{ height: '100%', background: color, borderRadius: 999 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* TinyFish info */}
          <motion.div variants={itemVariants} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <Globe size={16} color="var(--orange)" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>TinyFish Web Context</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Enable the toggle to fetch live web content. Paste any URL and the AI will read it before answering your question.
            </p>
            <div style={{ marginTop: '1rem', background: '#1e1a1a', borderRadius: 10, padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={13} color="var(--orange)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Powered by TinyFish API</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
