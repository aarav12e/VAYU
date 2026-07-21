import React, { useState } from 'react';

export default function CityDropdownMenu({ cities, selectedCity, liveAQI, aqiColorMap, onSelect }) {
  const [search, setSearch] = useState('');

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'absolute', top: 'calc(100% + 6px)', right: 0,
        background: 'rgba(16, 26, 42, 0.96)', border: '1px solid var(--border-active)',
        borderRadius: 12, overflow: 'hidden', zIndex: 300, width: 220,
        boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(14,22,35,0.6)' }}>
        <input
          type="text"
          placeholder="Search 32 cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 6,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', fontSize: 12, outline: 'none',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        />
      </div>

      <div
        style={{
          maxHeight: 320,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {filteredCities.length === 0 ? (
          <div style={{ padding: '16px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            No cities match "{search}"
          </div>
        ) : (
          filteredCities.map((city) => {
            const c = liveAQI[city];
            const cColor = aqiColorMap[c?.category] || '#7ea8c0';
            const isActive = city === selectedCity;
            return (
              <button
                key={city}
                onClick={() => onSelect(city)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 14px', background: isActive ? 'rgba(0,229,255,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer', color: isActive ? '#00e5ff' : 'var(--text-primary)',
                  fontSize: 13, fontFamily: 'Space Grotesk, sans-serif',
                  borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />}
                  <span style={{ fontWeight: isActive ? 700 : 400 }}>{city}</span>
                </div>
                {c && (
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: cColor }}>
                    {c.aqi}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
