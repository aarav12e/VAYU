import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Wind, User, Globe, Heart } from 'lucide-react';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SUGGESTED_QUESTIONS = [
  { en: 'Is it safe to go outside today?', hi: 'क्या आज बाहर जाना सुरक्षित है?' },
  { en: 'Should my child go to school?', hi: 'क्या मेरा बच्चा स्कूल जा सकता है?' },
  { en: 'What mask should I wear?', hi: 'मुझे कौन सा मास्क पहनना चाहिए?' },
  { en: 'When will air quality improve?', hi: 'वायु गुणवत्ता कब बेहतर होगी?' },
  { en: 'Are hospitals at risk today?', hi: 'क्या आज अस्पताल खतरे में हैं?' },
];

const WARDS = ['All Wards', 'Andheri', 'Bandra', 'Dharavi', 'Kurla', 'Worli', 'Malad', 'Powai', 'Thane'];

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="animate-slide-up"
      style={{
        display: 'flex', gap: 10, padding: '4px 0',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--cyan-mid), var(--cyan-dim))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wind size={15} color="var(--bg-void)" />
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser ? 'var(--cyan-dim)' : 'var(--bg-card)',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        padding: '10px 14px',
        color: isUser ? 'var(--bg-void)' : 'var(--text-primary)',
      }}>
        {msg.content}
        {msg.recommendations && (
          <div style={{ marginTop: 10 }}>
            {msg.recommendations.map((rec, i) => (
              <div key={i} style={{
                fontSize: 12, padding: '4px 0',
                borderTop: i === 0 ? '1px solid var(--border-subtle)' : 'none',
                paddingTop: i === 0 ? 8 : 2,
                color: 'var(--text-secondary)',
              }}>
                {rec}
              </div>
            ))}
          </div>
        )}
        {msg.aqi && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Current AQI:</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: getAQIColor(msg.aqi) }}>
              {msg.aqi}
            </span>
            <span style={{ fontSize: 10, color: getAQIColor(msg.aqi) }}>{getAQICategory(msg.aqi)}</span>
          </div>
        )}
        {msg.hindiText && msg.showHindi && (
          <div style={{
            marginTop: 8, fontSize: 12, color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-subtle)', paddingTop: 8,
            fontStyle: 'italic',
          }}>
            {msg.hindiText}
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {msg.aiPowered && <span style={{ marginLeft: 4, color: 'var(--cyan-dim)' }}>• AI</span>}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={15} color="var(--text-secondary)" />
        </div>
      )}
    </div>
  );
}

function VulnerableLocationCard({ loc }) {
  const riskColors = { LOW: '#00e676', MODERATE: '#ffea00', HIGH: '#ff6d00', CRITICAL: '#d50000', UNKNOWN: '#7ea8c0' };
  const riskColor = riskColors[loc.riskLevel] || riskColors.UNKNOWN;
  const icons = { hospital: '🏥', school: '🏫', elderly: '👴' };

  return (
    <div style={{
      background: `${riskColor}10`, border: `1px solid ${riskColor}30`,
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {icons[loc.type] || '📍'} {loc.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{loc.ward}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {loc.currentAQI && (
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: getAQIColor(loc.currentAQI) }}>
              {loc.currentAQI}
            </div>
          )}
          <div style={{
            fontSize: 9, fontWeight: 700, color: riskColor,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {loc.riskLevel} RISK
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CitizenChat({ city }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste! 🙏 I'm Vayu, your air quality assistant for ${city}. Ask me anything about today's air quality, health risks, or outdoor safety in any language — English or Hindi.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [ward, setWard] = useState('All Wards');
  const [vulnerableLocations, setVulnerableLocations] = useState([]);
  const [showHindi] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    axios.get(`${API}/api/citizen/vulnerable/${city}`)
      .then(res => setVulnerableLocations(res.data.data || []))
      .catch(() => {});
  }, [city]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/citizen/query`, {
        message: userMsg,
        city,
        ward: ward === 'All Wards' ? undefined : ward,
        language,
      });

      const data = res.data.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        hindiText: data.responseHindi,
        showHindi,
        recommendations: data.recommendations,
        aqi: data.aqi,
        aiPowered: data.aiPowered,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check that the server is running.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const criticalLocs = vulnerableLocations.filter(l => l.riskLevel === 'CRITICAL' || l.riskLevel === 'HIGH');

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* CHAT PANEL */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-deep)', overflow: 'hidden',
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--cyan-bright), var(--cyan-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wind size={18} color="var(--bg-void)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Vayu Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--aqi-good)', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live AQI data • Multilingual</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
              style={{
                padding: '5px 10px', borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Globe size={12} />
              {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
            </button>
            {/* Ward selector */}
            <select
              value={ward}
              onChange={e => setWard(e.target.value)}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', borderRadius: 6, padding: '5px 10px',
                fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer',
              }}
            >
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--cyan-mid), var(--cyan-dim))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wind size={15} color="var(--bg-void)" />
              </div>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: '12px 12px 12px 4px', padding: '14px 16px',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--cyan-mid)',
                    animation: `pulse-dot 1.2s ${i * 0.2}s infinite ease-in-out`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div style={{ padding: '0 20px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(language === 'hi' ? q.hi : q.en)}
                disabled={loading}
                style={{
                  padding: '5px 10px', borderRadius: 999,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)', fontSize: 11,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.15s', opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {language === 'hi' ? q.hi : q.en}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          padding: '10px 20px 16px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'hi' ? 'वायु गुणवत्ता के बारे में पूछें...' : 'Ask about air quality, health risks, outdoor safety...'}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: input.trim() ? 'var(--cyan-mid)' : 'var(--bg-surface)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Send size={15} color={input.trim() ? 'var(--bg-void)' : 'var(--text-muted)'} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Vulnerable Locations */}
      <div style={{
        width: 300, flexShrink: 0,
        background: 'var(--bg-deep)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Heart size={13} color="#ff6d00" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Vulnerable Locations
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Hospitals, schools & elderly homes — AQI risk
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
          {vulnerableLocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 12 }}>
              Loading locations...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {criticalLocs.length > 0 && (
                <div style={{ fontSize: 10, color: '#ff6d00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  ⚠️ At-Risk Now
                </div>
              )}
              {vulnerableLocations.map((loc, i) => (
                <VulnerableLocationCard key={i} loc={loc} />
              ))}
            </div>
          )}
        </div>
        {/* Multi-language info */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>LANGUAGES SUPPORTED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['🇬🇧 English', '🇮🇳 हिंदी', 'मराठी', 'தமிழ்', 'ಕನ್ನಡ', 'తెలుగు'].map(lang => (
              <span key={lang} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 999,
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
