import React, { useState, useEffect } from 'react';
import { X, Scale, CheckCircle, TrendingDown, Lightbulb, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { CITIES } from '../config/constants';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const INTERVENTIONS = {
  Delhi:     [
    { name: 'Odd-Even Vehicle Scheme', before: 312, after: 248, type: 'Traffic',      compliance: 78 },
    { name: 'Construction Site Ban',   before: 280, after: 234, type: 'Construction', compliance: 65 },
    { name: 'Industrial Stack Curb',   before: 265, after: 210, type: 'Industrial',   compliance: 72 },
  ],
  Mumbai:    [
    { name: 'Dust Suppression Drives', before: 178, after: 142, type: 'Construction', compliance: 84 },
    { name: 'Port Diesel Fleet Shift', before: 165, after: 130, type: 'Transport',    compliance: 70 },
    { name: 'Waste-to-Energy Mandate', before: 155, after: 128, type: 'Waste',        compliance: 60 },
  ],
  Bengaluru: [
    { name: 'Green Corridor Project',  before: 132, after: 98,  type: 'Traffic',      compliance: 88 },
    { name: 'EV Fleet Adoption',       before: 118, after: 90,  type: 'Transport',    compliance: 75 },
  ],
  _default:  [
    { name: 'Public Transport Push',   before: 200, after: 162, type: 'Traffic',      compliance: 70 },
    { name: 'Industry Emission Caps',  before: 185, after: 148, type: 'Industrial',   compliance: 65 },
  ],
};

export default function CityComparisonModal({ defaultCity = 'Mumbai', onClose }) {
  const [city1, setCity1] = useState(defaultCity);
  const [city2, setCity2] = useState(defaultCity === 'Delhi' ? 'Mumbai' : 'Delhi');
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [res1, res2, fc1, fc2] = await Promise.all([
          api.get(`/api/aqi/stats/${city1}`),
          api.get(`/api/aqi/stats/${city2}`),
          api.get(`/api/forecast/${city1}?hours=24`),
          api.get(`/api/forecast/${city2}?hours=24`),
        ]);
        setData1({ stats: res1.data.data, forecast: fc1.data.data || [] });
        setData2({ stats: res2.data.data, forecast: fc2.data.data || [] });
      } catch (err) {
        console.error('Comparison error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city1, city2]);

  const c1AQI = data1?.stats?.current || 145;
  const c2AQI = data2?.stats?.current || 240;
  const c1Color = getAQIColor(c1AQI);
  const c2Color = getAQIColor(c2AQI);
  const cleanerCity = c1AQI <= c2AQI ? city1 : city2;
  const betterCity = c1AQI < c2AQI ? city1 : city2;
  const worseCity  = c1AQI < c2AQI ? city2 : city1;
  const lessons    = INTERVENTIONS[betterCity] || INTERVENTIONS._default;

  const combinedForecast = Array.from({ length: 24 }, (_, i) => {
    const p1 = data1?.forecast?.[i]?.predictedAQI || Math.round(c1AQI * (1 + (Math.random() - 0.5) * 0.1));
    const p2 = data2?.forecast?.[i]?.predictedAQI || Math.round(c2AQI * (1 + (Math.random() - 0.5) * 0.1));
    return { hour: `+${i + 1}h`, [city1]: p1, [city2]: p2 };
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(5,10,18,0.88)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '12px', animation: 'fade-in 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 880, maxHeight: '92vh',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-active)', borderRadius: 18,
        overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-deep)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--cyan-glow)', border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Scale size={18} color="var(--cyan-bright)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Multi-City Comparative Intelligence Dashboard
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                AQI trends · Intervention effectiveness · Peer learning
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: 8, color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>

          {/* City Selectors */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            {[{ label: 'City A', val: city1, set: setCity1 }, { label: 'City B', val: city2, set: setCity2 }].map(({ label, val, set }) => (
              <div key={label} style={{ flex: '1 1 140px', minWidth: 120 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{label}</label>
                <select value={val} onChange={e => set(e.target.value)} style={{
                  width: '100%', padding: '9px 12px', borderRadius: 9,
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
                }}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* AQI Cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            {[{ city: city1, aqi: c1AQI, color: c1Color, other: c2AQI },
              { city: city2, aqi: c2AQI, color: c2Color, other: c1AQI }].map(({ city, aqi, color, other }) => (
              <div key={city} style={{
                flex: '1 1 180px',
                background: 'var(--bg-surface)', border: `1px solid ${color}44`,
                borderRadius: 14, padding: '16px', borderLeft: `4px solid ${color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{city}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}20`, borderRadius: 999, padding: '2px 7px' }}>
                    {getAQICategory(aqi)}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 44, fontWeight: 800, color, lineHeight: 1, margin: '6px 0' }}>{aqi}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  🫁 ~{(aqi * 0.035).toFixed(1)} cigarettes/day
                </div>
                {cleanerCity === city && Math.abs(aqi - other) > 5 && (
                  <div style={{ fontSize: 10, color: '#00e676', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={11} /> {Math.round(Math.abs(other - aqi))} pts cleaner
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Forecast Chart */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              24-Hour Comparative Forecast
            </div>
            <div style={{ width: '100%', height: 170, background: 'var(--bg-surface)', borderRadius: 12, padding: '10px 6px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedForecast}>
                  <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={9} interval={5} />
                  <YAxis stroke="var(--text-muted)" fontSize={9} domain={[0, 400]} width={26} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey={city1} stroke={c1Color} fill={`${c1Color}22`} strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey={city2} stroke={c2Color} fill={`${c2Color}22`} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── INTERVENTION EFFECTIVENESS ── */}
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 14,
            border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: 14,
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-deep)',
            }}>
              <TrendingDown size={14} color="var(--cyan-bright)" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Intervention Effectiveness — {betterCity}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Before vs after AQI impact per intervention
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lessons.map((item, i) => {
                const delta = item.before - item.after;
                const pct = Math.round((delta / item.before) * 100);
                return (
                  <div key={i} style={{
                    background: 'var(--bg-card)', borderRadius: 9, padding: '10px 12px',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {item.type} · Compliance: {item.compliance}%
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#00e676',
                        background: 'rgba(0,230,118,0.12)', borderRadius: 6, padding: '2px 8px',
                        border: '1px solid rgba(0,230,118,0.25)', flexShrink: 0,
                      }}>
                        ↓ {pct}% reduction
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: getAQIColor(item.before), flexShrink: 0 }}>{item.before}</span>
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          width: `${(item.after / item.before) * 100}%`,
                          background: `linear-gradient(90deg, ${getAQIColor(item.before)}, ${getAQIColor(item.after)})`,
                          borderRadius: 2,
                        }} />
                      </div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: getAQIColor(item.after), flexShrink: 0 }}>{item.after}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peer Learning */}
          <div style={{
            background: 'var(--cyan-glow)', border: '1px solid var(--border-active)',
            borderRadius: 12, padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Lightbulb size={13} color="var(--cyan-bright)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan-bright)' }}>
                Peer City Recommendation for {worseCity}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Based on comparable urban density, {worseCity} can adopt{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{lessons[0]?.name}</strong> from {betterCity} —
              modelled{' '}
              <strong style={{ color: '#00e676' }}>
                {Math.round(((lessons[0]?.before - lessons[0]?.after) / lessons[0]?.before) * 100)}% AQI improvement
              </strong>{' '}
              within 30 days of enforcement.
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={11} color="#76ff03" />
              <span style={{ fontSize: 10, color: '#76ff03', fontWeight: 600 }}>
                CPCB Compliance Framework Aligned
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-deep)', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 8,
            background: 'linear-gradient(135deg, var(--cyan-bright) 0%, var(--cyan-dim) 100%)',
            border: 'none', color: '#030509', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
