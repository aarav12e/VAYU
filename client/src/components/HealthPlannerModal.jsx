import React, { useState } from 'react';
import { X, Heart, Map, Users, Globe } from 'lucide-react';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const PROFILES = [
  { id: 'runner',    label: 'Athlete',            icon: '🏃', sensitivity: 1.3, desc: 'High breathing rate' },
  { id: 'child',     label: 'Child',              icon: '👶', sensitivity: 1.25, desc: 'Developing lungs' },
  { id: 'asthma',    label: 'Sensitive',          icon: '🫁', sensitivity: 1.5, desc: 'Respiratory triggers' },
  { id: 'elderly',   label: 'Senior',             icon: '👴', sensitivity: 1.35, desc: 'Vulnerable system' },
  { id: 'general',   label: 'General',            icon: '👤', sensitivity: 1.0, desc: 'Baseline profile' },
];

const LANGUAGES = [
  { code: 'EN', name: 'English', greeting: 'Health Advisory',
    advisory: {
      SAFE: 'Air quality is favorable. Outdoor activities are safe.',
      CAUTION: 'Limit prolonged outdoor exertion. Wear a basic mask if sensitive.',
      UNSAFE: 'Avoid all outdoor physical activity. Keep windows closed and use N95 masks.'
    }
  },
  { code: 'HI', name: 'हिंदी', greeting: 'स्वास्थ्य सलाह',
    advisory: {
      SAFE: 'हवा की गुणवत्ता अनुकूल है। बाहरी गतिविधियां सुरक्षित हैं।',
      CAUTION: 'लंबे समय तक बाहरी परिश्रम को सीमित करें। यदि संवेदनशील हैं तो मास्क पहनें।',
      UNSAFE: 'सभी बाहरी शारीरिक गतिविधियों से बचें। खिड़कियां बंद रखें और N95 मास्क का उपयोग करें।'
    }
  },
  { code: 'TA', name: 'தமிழ்', greeting: 'சுகாதார ஆலோசனை',
    advisory: {
      SAFE: 'காற்றின் தரம் சாதகமாக உள்ளது. வெளிப்புற நடவடிக்கைகள் பாதுகாப்பானவை.',
      CAUTION: 'நீண்ட நேரம் வெளியில் உழைப்பதைக் குறைக்கவும். உணர்திறன் இருந்தால் மாஸ்க் அணியவும்.',
      UNSAFE: 'அனைத்து வெளிப்புற உடல் செயல்பாடுகளையும் தவிர்க்கவும். N95 மாஸ்க் பயன்படுத்தவும்.'
    }
  },
  { code: 'KN', name: 'ಕನ್ನಡ', greeting: 'ಆರೋಗ್ಯ ಸಲಹೆ',
    advisory: {
      SAFE: 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಅನುಕೂಲಕರವಾಗಿದೆ. ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳು ಸುರಕ್ಷಿತವಾಗಿವೆ.',
      CAUTION: 'ದೀರ್ಘಕಾಲದ ಹೊರಾಂಗಣ ಶ್ರಮವನ್ನು ಮಿತಿಗೊಳಿಸಿ. ಸೂಕ್ಷ್ಮತೆಯಿದ್ದರೆ ಮಾಸ್ಕ್ ಧರಿಸಿ.',
      UNSAFE: 'ಎಲ್ಲಾ ಹೊರಾಂಗಣ ದೈಹಿಕ ಚಟುವಟಿಕೆಗಳನ್ನು ತಪ್ಪಿಸಿ. N95 ಮಾಸ್ಕ್ ಬಳಸಿ.'
    }
  }
];

const VULNERABILITY_ZONES = [
  { name: 'City General Hospital', type: 'Hospital', distance: '1.2 km', population: '850 beds', risk: 'High' },
  { name: 'National Public School', type: 'School', distance: '2.5 km', population: '1200 students', risk: 'Medium' },
  { name: 'Central Construction Site', type: 'Outdoor Workers', distance: '3.0 km', population: '450 workers', risk: 'Critical' },
];

export default function HealthPlannerModal({ city, currentAQI = 140, onClose }) {
  const [selectedProfile, setSelectedProfile] = useState('runner');
  const [lang, setLang] = useState('EN');
  
  const profile = PROFILES.find(p => p.id === selectedProfile) || PROFILES[0];
  const activeLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const effectiveAQI = Math.round(currentAQI * profile.sensitivity);
  const color = getAQIColor(effectiveAQI);
  const category = getAQICategory(effectiveAQI);
  const cigs = (Math.max(0, (effectiveAQI - 20) * 0.035)).toFixed(1);

  const currentStatus = effectiveAQI > 200 ? 'UNSAFE' : effectiveAQI > 100 ? 'CAUTION' : 'SAFE';

  const hours = Array.from({ length: 24 }, (_, h) => {
    let factor = 1.0;
    if (h >= 7 && h <= 10) factor = 1.25;
    else if (h >= 17 && h <= 21) factor = 1.2;
    else if (h >= 1 && h <= 5) factor = 0.8;

    const hourAQI = Math.max(15, Math.round(effectiveAQI * factor));
    let status = 'SAFE'; let badgeColor = '#00e676';
    if (hourAQI > 200) { status = 'UNSAFE'; badgeColor = '#d50000'; }
    else if (hourAQI > 100) { status = 'CAUTION'; badgeColor = '#ff6d00'; }
    const timeLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    return { hour: h, timeLabel, aqi: hourAQI, status, badgeColor };
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(5, 10, 18, 0.88)', backdropFilter: 'blur(16px)',
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
          padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-deep)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--cyan-glow)', border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={18} color="var(--cyan-bright)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Citizen Health Risk Advisory System
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Personalized Risk · Vulnerability Mapping · Multilingual Broadcast
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
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Left Column */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Profile Selector */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Vulnerability Profile
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PROFILES.map((p) => (
                    <button key={p.id} onClick={() => setSelectedProfile(p.id)} style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: p.id === selectedProfile ? 'var(--cyan-glow)' : 'var(--bg-surface)',
                      border: `1px solid ${p.id === selectedProfile ? 'var(--cyan-bright)' : 'var(--border-subtle)'}`,
                      color: p.id === selectedProfile ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 14 }}>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Risk Summary Bar */}
              <div style={{
                background: 'var(--bg-surface)', borderRadius: 14, padding: 16,
                borderLeft: `4px solid ${color}`, borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Effective AQI for {profile.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{effectiveAQI}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color }}>{category}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {profile.desc} modifier applied.
                </div>
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: 'var(--bg-deep)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Smoke Dosage</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6d00', marginTop: 2 }}>~{cigs} Cigs/Day</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-deep)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Mask Required</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: effectiveAQI > 150 ? '#00e5ff' : '#00e676', marginTop: 2 }}>
                      {effectiveAQI > 200 ? 'N95' : effectiveAQI > 100 ? 'Surgical' : 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multilingual Advisory Broadcast (Problem #5) */}
              <div style={{ background: 'rgba(0,229,255,0.06)', borderRadius: 14, border: '1px solid var(--border-active)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={14} color="var(--cyan-bright)" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan-bright)', textTransform: 'uppercase' }}>
                      Citizen Broadcast
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setLang(l.code)} style={{
                        padding: '3px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: lang === l.code ? 'var(--cyan-bright)' : 'transparent',
                        color: lang === l.code ? '#000' : 'var(--text-muted)',
                        fontSize: 10, fontWeight: 700, transition: 'all 0.15s',
                      }}>
                        {l.code}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {activeLang.greeting}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {activeLang.advisory[currentStatus]}
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ background: 'var(--bg-deep)', padding: '2px 6px', borderRadius: 4 }}>Push Notification</span>
                  <span style={{ background: 'var(--bg-deep)', padding: '2px 6px', borderRadius: 4 }}>IVR Ready</span>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Vulnerability Map Panel (Problem #5) */}
              <div style={{
                background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-deep)',
                }}>
                  <Map size={15} color="#ff6d00" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Local Vulnerability Map
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      At-risk populations near {city} Hotspots
                    </div>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {VULNERABILITY_ZONES.map((z, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-deep)', borderRadius: 8, padding: '10px 12px',
                      border: `1px solid ${z.risk === 'Critical' ? 'rgba(213,0,0,0.3)' : 'var(--border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{z.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Users size={10} /> {z.type} · {z.population}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, display: 'inline-block',
                          color: z.risk === 'Critical' ? '#d50000' : z.risk === 'High' ? '#ff6d00' : '#ffd600',
                          background: z.risk === 'Critical' ? 'rgba(213,0,0,0.1)' : z.risk === 'High' ? 'rgba(255,109,0,0.1)' : 'rgba(255,214,0,0.1)',
                          padding: '2px 6px', borderRadius: 4, marginBottom: 4
                        }}>
                          {z.risk} Risk
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{z.distance} away</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 24-Hour Timeline */}
              <div style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  24-Hour Schedule Planner
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: 8,
                  maxHeight: 180, overflowY: 'auto', paddingRight: 4,
                }}>
                  {hours.map((h) => (
                    <div key={h.hour} style={{
                      background: 'var(--bg-deep)', border: `1px solid ${h.badgeColor}44`,
                      borderRadius: 8, padding: '6px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)' }}>{h.timeLabel}</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: h.badgeColor, margin: '2px 0' }}>{h.aqi}</div>
                    </div>
                  ))}
                </div>
              </div>

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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
