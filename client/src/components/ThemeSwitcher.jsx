import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';

const THEMES = [
  {
    id: 'vayu-night',
    name: 'Vayu Night',
    desc: 'Dark glassmorphic · Default',
    emoji: '🌌',
    preview: {
      bg: 'linear-gradient(135deg, #04060c 0%, #090e17 100%)',
      accent: '#00e5ff',
      dot1: '#00e5ff',
      dot2: '#76ff03',
      dot3: '#ff6d00',
    },
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    desc: 'Warm volcanic · Intense',
    emoji: '🔥',
    preview: {
      bg: 'linear-gradient(135deg, #0d0500 0%, #2a1500 100%)',
      accent: '#ff6f00',
      dot1: '#ff6f00',
      dot2: '#ffd600',
      dot3: '#ff1744',
    },
  },
  {
    id: 'arctic-pulse',
    name: 'Arctic Pulse',
    desc: 'Clean icy blue · Light',
    emoji: '❄️',
    preview: {
      bg: 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)',
      accent: '#0ea5e9',
      dot1: '#0ea5e9',
      dot2: '#6366f1',
      dot3: '#22d3ee',
    },
  },
  {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    desc: 'Deep green · Environmental',
    emoji: '🌿',
    preview: {
      bg: 'linear-gradient(135deg, #050f07 0%, #122917 100%)',
      accent: '#00e676',
      dot1: '#00e676',
      dot2: '#69f0ae',
      dot3: '#64dd17',
    },
  },
];

const STORAGE_KEY = 'vayu-theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'vayu-night';
  });

  const setTheme = (id) => {
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(STORAGE_KEY, id);
    setThemeState(id);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

export default function ThemeSwitcher({ theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const active = THEMES.find((t) => t.id === theme) || THEMES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={panelRef} style={{ position: 'relative', zIndex: 9999 }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change Theme"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          background: open
            ? `${active.preview.accent}22`
            : 'rgba(14,22,35,0.7)',
          border: `1px solid ${open ? active.preview.accent + '55' : 'rgba(0,229,255,0.15)'}`,
          color: open ? active.preview.accent : '#8b949e',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Space Grotesk, sans-serif',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Palette size={13} />
        <span>{active.emoji} {active.name}</span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            width: 280,
            background: 'rgba(9,14,23,0.97)',
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: 14,
            padding: 12,
            boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,229,255,0.05)',
            backdropFilter: 'blur(24px)',
            animation: 'slide-up 0.18s ease',
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#57606a',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 10, paddingLeft: 4,
          }}>
            🎨 Select Theme
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {THEMES.map((t) => {
              const isActive = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 9,
                    background: isActive
                      ? `${t.preview.accent}18`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? t.preview.accent + '44' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    textAlign: 'left', width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  {/* Mini theme preview swatch */}
                  <div style={{
                    width: 40, height: 28, borderRadius: 6, flexShrink: 0,
                    background: t.preview.bg,
                    border: `1px solid ${t.preview.accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: isActive ? `0 0 10px ${t.preview.accent}44` : 'none',
                  }}>
                    {[t.preview.dot1, t.preview.dot2, t.preview.dot3].map((c, i) => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%', background: c,
                      }} />
                    ))}
                  </div>

                  {/* Labels */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? t.preview.accent : '#c9d1d9' }}>
                      {t.emoji} {t.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#57606a', marginTop: 1 }}>
                      {t.desc}
                    </div>
                  </div>

                  {/* Active checkmark */}
                  {isActive && (
                    <Check size={13} color={t.preview.accent} style={{ flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div style={{
            marginTop: 10, paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 9.5, color: '#444c56', textAlign: 'center',
          }}>
            Theme is saved automatically
          </div>
        </div>
      )}
    </div>
  );
}
