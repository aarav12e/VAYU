import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wind, ShieldAlert, Activity, ArrowRight, Zap, Globe } from 'lucide-react';
import { EtherealShadow } from '../components/ui/etheral-shadow';
import { GooeyText } from '../components/ui/gooey-text-morphing';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#030509', position: 'relative' }}>
      <EtherealShadow
        color="rgba(0, 229, 255, 0.35)"
        animation={{ scale: 90, speed: 75 }}
        noise={{ opacity: 0.9, scale: 1.2 }}
        sizing="fill"
      >
        {/* Top Header */}
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '24px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #00e5ff 0%, #007a8c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0,229,255,0.4)',
            }}>
              <Wind size={22} color="#030509" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.02em', lineHeight: 1 }}>
                VAYU <span style={{ color: '#00e5ff' }}>INTELLIGENCE</span>
              </div>
              <div style={{ fontSize: 9, color: '#7ea8c0', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>
                Urban Air Quality & AI Enforcement Platform
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#00e676',
              background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)',
              padding: '4px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }} />
              SYSTEM OPERATIONAL
            </span>
            <button
              onClick={() => navigate('/app')}
              style={{
                padding: '8px 18px', borderRadius: 8,
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                color: '#00e5ff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,229,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'}
            >
              Quick Access
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 20px', textAlign: 'center', position: 'relative', zIndex: 10,
        }}>
          {/* Main Morphing Title */}
          <div style={{ width: '100%', maxWidth: 1000, marginBottom: 20, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GooeyText
              texts={[
                "Vayu Intelligence",
                "Real-Time AQI System",
                "AI Source Attribution",
                "Automated Enforcement"
              ]}
              morphTime={1.2}
              cooldownTime={0.6}
              style={{ minHeight: 100 }}
              textClassName="font-bold text-cyan-bright"
            />
          </div>

          <div style={{
            fontSize: 'clamp(18px, 2.2vw, 28px)',
            fontWeight: 600,
            color: '#e8f4f8',
            marginBottom: 24,
            letterSpacing: '-0.01em'
          }}>
            Urban Air Quality & <span style={{ color: '#00e5ff' }}>AI Violation Enforcement</span>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 19px)',
            color: '#8b949e',
            maxWidth: 720,
            lineHeight: 1.6,
            marginBottom: 36,
          }}>
            Monitor live multi-city AQI, pinpoint pollution violation hotspots using AI satellite correlation, and dispatch automated enforcement actions without delay.
          </p>

          {/* Primary Action Button (DIRECT ACCESS WITHOUT LOGIN) */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/app')}
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #00e5ff 0%, #00b4cc 100%)',
                border: 'none',
                color: '#030509',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 0 32px rgba(0, 229, 255, 0.45)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = '0 0 48px rgba(0, 229, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 32px rgba(0, 229, 255, 0.45)';
              }}
            >
              <span>ENTER VAYU COMMAND CENTER</span>
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => navigate('/app/enforcement')}
              style={{
                padding: '16px 28px',
                borderRadius: 12,
                background: 'rgba(13, 21, 32, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                color: '#e8f4f8',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex', alignItems: 'center', gap: 10,
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00e5ff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.25)'}
            >
              <ShieldAlert size={18} color="#00e5ff" />
              <span>Enforcement Mode</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div style={{
            marginTop: 52,
            display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center',
            padding: '18px 36px',
            background: 'rgba(9, 14, 23, 0.75)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: 16,
            backdropFilter: 'blur(20px)',
          }}>
            {[
              { value: '6 Indian Metros', label: 'Live Data Streams', icon: Globe },
              { value: 'OpenWeather & OpenAQ', label: 'Multi-Source Fusion', icon: Activity },
              { value: 'AI Attribution', label: 'Pollution Source Engine', icon: Zap },
              { value: '< 15min', label: 'Ingestion Frequency', icon: Wind },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(0,229,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color="#00e5ff" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc', fontFamily: 'JetBrains Mono, monospace' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 11, color: '#7ea8c0' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </EtherealShadow>
    </div>
  );
}
