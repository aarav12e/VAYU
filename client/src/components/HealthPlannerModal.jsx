import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const PROFILES = [
  { id: 'runner',    label: 'Runner / Athlete',   icon: '🏃', sensitivity: 1.3, desc: 'High breathing rate during exercise' },
  { id: 'child',     label: 'Child / Student',    icon: '👶', sensitivity: 1.25, desc: 'Developing lungs & high outdoor activity' },
  { id: 'asthma',    label: 'Asthmatic / Sensitive', icon: '🫁', sensitivity: 1.5, desc: 'Prone to bronchospasms & respiratory triggers' },
  { id: 'elderly',   label: 'Senior Citizen',     icon: '👴', sensitivity: 1.35, desc: 'Vulnerable cardiovascular & respiratory system' },
  { id: 'general',   label: 'General Adult',      icon: '👤', sensitivity: 1.0, desc: 'Standard baseline health profile' },
];

export default function HealthPlannerModal({ city, currentAQI = 140, onClose }) {
  const [selectedProfile, setSelectedProfile] = useState('runner');
  const profile = PROFILES.find(p => p.id === selectedProfile) || PROFILES[0];

  const effectiveAQI = Math.round(currentAQI * profile.sensitivity);
  const color = getAQIColor(effectiveAQI);
  const category = getAQICategory(effectiveAQI);
  const cigs = (Math.max(0, (effectiveAQI - 20) * 0.035)).toFixed(1);

  // Generate 24-hour hour-by-hour schedule simulation based on diurnal traffic curves
  const hours = Array.from({ length: 24 }, (_, h) => {
    let factor = 1.0;
    if (h >= 7 && h <= 10) factor = 1.25;      // Morning rush
    else if (h >= 17 && h <= 21) factor = 1.2;  // Evening rush
    else if (h >= 1 && h <= 5) factor = 0.8;    // Late night dip

    const hourAQI = Math.max(15, Math.round(effectiveAQI * factor));
    let status = 'SAFE';
    let label = 'Clean Window';
    let badgeColor = '#00e676';

    if (hourAQI > 200) {
      status = 'UNSAFE';
      label = 'Avoid Outdoor Activity';
      badgeColor = '#d50000';
    } else if (hourAQI > 100) {
      status = 'CAUTION';
      label = 'Limit Heavy Exertion';
      badgeColor = '#ff6d00';
    }

    const timeLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

    return { hour: h, timeLabel, aqi: hourAQI, status, label, badgeColor };
  });

  const bestHours = hours.filter(h => h.status === 'SAFE');
  const worstHours = hours.filter(h => h.status === 'UNSAFE');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(5, 10, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fade-in 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 760, maxHeight: '90vh',
        background: 'rgba(12, 22, 36, 0.96)',
        border: '1px solid var(--border-active)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 30px 90px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(9, 16, 26, 0.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={20} color="#00e5ff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Personalized Outdoor Health & Activity Planner
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                24-Hour Hour-by-Hour Safety Schedule for <span style={{ color: '#00e5ff', fontWeight: 600 }}>{city}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: 8, color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {/* Profile Selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Select Vulnerability Profile:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1.5fr))', gap: 8 }}>
              {PROFILES.map((p) => {
                const isActive = p.id === selectedProfile;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfile(p.id)}
                    style={{
                      padding: '10px 12px', borderRadius: 12,
                      background: isActive ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isActive ? '#00e5ff' : 'var(--border-subtle)'}`,
                      color: isActive ? '#00e5ff' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s', fontFamily: 'Space Grotesk, sans-serif',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{p.icon}</div>
                    <div>{p.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Health Risk Summary Bar */}
          <div style={{
            display: 'flex', gap: 16, background: 'var(--bg-surface)',
            borderRadius: 14, padding: 16, borderLeft: `4px solid ${color}`,
            marginBottom: 24, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Effective AQI for {profile.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                <span className="mono" style={{ fontSize: 32, fontWeight: 700, color }}>{effectiveAQI}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color }}>{category}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                {profile.desc}
              </div>
            </div>

            <div style={{
              background: 'rgba(9,14,23,0.6)', borderRadius: 10, padding: '10px 14px',
              border: '1px solid var(--border-subtle)', minWidth: 160,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>🫁 Outdoor Smoke Dosage</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ff6d00', marginTop: 2 }}>
                ~{cigs} Cigs / Day
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Equivalent intake</div>
            </div>

            <div style={{
              background: 'rgba(9,14,23,0.6)', borderRadius: 10, padding: '10px 14px',
              border: '1px solid var(--border-subtle)', minWidth: 160,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>😷 Mask Recommendation</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: effectiveAQI > 150 ? '#00e5ff' : '#00e676', marginTop: 2 }}>
                {effectiveAQI > 200 ? 'N95 Respirator' : effectiveAQI > 100 ? 'Surgical / Cloth Mask' : 'No Mask Needed'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>For outdoor routes</div>
            </div>
          </div>

          {/* 24-Hour Timeline */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                24-Hour Hourly Safety Forecast:
              </span>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <span style={{ color: '#00e676' }}>● Safe Window ({bestHours.length}h)</span>
                <span style={{ color: '#ff6d00' }}>● Caution ({24 - bestHours.length - worstHours.length}h)</span>
                <span style={{ color: '#d50000' }}>● Unsafe ({worstHours.length}h)</span>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8,
              maxHeight: 280, overflowY: 'auto', paddingRight: 4,
            }}>
              {hours.map((h) => (
                <div
                  key={h.hour}
                  style={{
                    background: 'var(--bg-surface)', border: `1px solid ${h.badgeColor}44`,
                    borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{h.timeLabel}</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: h.badgeColor, margin: '4px 0' }}>
                    {h.aqi}
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: h.badgeColor,
                    background: `${h.badgeColor}15`, borderRadius: 4, padding: '2px 0',
                  }}>
                    {h.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'flex-end', background: 'rgba(9, 16, 26, 0.6)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: 'linear-gradient(135deg, #00e5ff 0%, #007a8c 100%)',
              border: 'none', color: '#030509', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
