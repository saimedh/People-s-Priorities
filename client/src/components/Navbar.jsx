import { Link, useLocation } from 'react-router-dom';
import { BarChart2, Map, Table, MessageSquare, Home, Landmark, Shield, Radio, Sparkles, GitCompare, Bot } from 'lucide-react';
import { motion } from 'motion/react';

const navItems = [
  { to: '/',              label: 'Home',        icon: Sparkles      },
  { to: '/dashboard',     label: 'Dashboard',   icon: Home          },
  { to: '/local-pulse',   label: 'Local Pulse', icon: Radio         },
  { to: '/compare',       label: 'Compare',     icon: BarChart2     },
  { to: '/compare-states', label: 'TS vs AP',   icon: GitCompare    },
  { to: '/chat',          label: 'GOVCH',       icon: Bot           },
  { to: '/map',           label: 'Heatmap',     icon: Map           },
  { to: '/submit',        label: 'Submit',      icon: MessageSquare },
  { to: '/my-complaints', label: 'My Complaints', icon: Shield      },
  { to: '/staff',         label: 'Staff',       icon: Table         },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #db4120, #c7e285)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            <Landmark size={20} color="var(--text-primary)" />
          </div>
          <div>
            <div style={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              People's Priorities
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-2px' }}>
              Constituency AI Platform
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  position: 'relative',
                  padding: '0.4rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--orange)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'color 0.2s ease',
                }}
              >
                <Icon size={15} color={isActive ? 'var(--orange)' : 'var(--text-muted)'} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'var(--orange)',
                      borderRadius: 2
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
