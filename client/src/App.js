import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  Wind, MapPin, ShieldAlert, MessageSquare, Activity, Bell, ChevronDown, Wifi
} from 'lucide-react';
import CommandCenter from './pages/CommandCenter';
import Enforcement from './pages/Enforcement';
import CitizenChat from './pages/CitizenChat';
import { getSocket, subscribeToCity } from './socket';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const CITIES = ['Mumbai', 'Delhi', 'Kolkata', 'Bengaluru', 'Chennai', 'Pune'];

function App() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [alerts, setAlerts] = useState([]);
  const [liveAQI, setLiveAQI] = useState({});
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    subscribeToCity(selectedCity);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('aqi:update', (data) => {
      setLiveAQI((prev) => ({ ...prev, [data.city]: data }));
    });
    socket.on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    });

    return () => {
      socket.off('aqi:update');
      socket.off('alert:new');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [selectedCity]);

  useEffect(() => {
    axios.get(`${API}/api/aqi/live`).then((res) => {
      const map = {};
      res.data.data?.forEach((r) => { map[r.city] = { aqi: r.aqi, category: r.category }; });
      setLiveAQI(map);
    }).catch(() => {});

    axios.get(`${API}/api/aqi/alerts/${selectedCity}`).then((res) => {
      setAlerts(res.data.data || []);
    }).catch(() => {});
  }, [selectedCity]);

  const cityAQI = liveAQI[selectedCity];

  const aqiColorMap = {
    Good: '#00e676', Satisfactory: '#76ff03', Moderate: '#ffea00',
    Poor: '#ff6d00', 'Very Poor': '#d50000', Severe: '#6a0080',
  };
  const aqiColor = aqiColorMap[cityAQI?.category] || '#00e5ff';

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!cityDropdownOpen) return;
    const handler = () => setCityDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [cityDropdownOpen]);

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-void)' }}>

        {/* ─── TOP NAV ─── */}
        <nav style={{
          height: 56,
          background: 'rgba(13,21,32,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 20, flexShrink: 0, zIndex: 100,
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #00e5ff 0%, #007a8c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,229,255,0.3)',
            }}>
              <Wind size={18} color="#080c12" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8f4f8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Vayu Intelligence
              </div>
              <div style={{ fontSize: 9, color: '#3d6070', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Urban Air Quality Platform
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { to: '/', icon: Activity, label: 'Command Center' },
              { to: '/enforcement', icon: ShieldAlert, label: 'Enforcement' },
              { to: '/citizen', icon: MessageSquare, label: 'Citizen' },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 12, fontWeight: 500,
                  color: isActive ? '#00e5ff' : '#7ea8c0',
                  background: isActive ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(0,229,255,0.25)' : 'transparent'}`,
                  transition: 'all 0.15s',
                })}
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Connection status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? '#00e676' : '#ff6d00',
                boxShadow: isConnected ? '0 0 6px #00e676' : '0 0 6px #ff6d00',
              }} />
              <span style={{ fontSize: 10, color: '#3d6070' }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            {/* Live AQI Badge */}
            {cityAQI && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, padding: '4px 12px',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: aqiColor, animation: 'pulse-dot 2s infinite',
                }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>AQI</span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: aqiColor }}>
                  {cityAQI.aqi}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cityAQI.category}</span>
              </div>
            )}

            {/* Alerts Bell */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }}>
                <Bell size={14} />
                {criticalCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#d50000', boxShadow: '0 0 6px #d50000',
                  }} />
                )}
              </button>
            </div>

            {/* City Selector */}
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-ghost"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                style={{ gap: 6, minWidth: 130, justifyContent: 'space-between', fontSize: 12 }}
              >
                <MapPin size={12} />
                <span style={{ fontWeight: 600 }}>{selectedCity}</span>
                <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: cityDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {cityDropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border-active)',
                  borderRadius: 12, overflow: 'hidden', zIndex: 200, minWidth: 160,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                }}>
                  <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select City</div>
                  </div>
                  {CITIES.map((city) => {
                    const c = liveAQI[city];
                    const cColor = aqiColorMap[c?.category] || '#7ea8c0';
                    const isActive = city === selectedCity;
                    return (
                      <button
                        key={city}
                        onClick={() => { setSelectedCity(city); setCityDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '10px 14px', background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                          border: 'none', cursor: 'pointer', color: isActive ? '#00e5ff' : 'var(--text-primary)',
                          fontSize: 13, fontFamily: 'Space Grotesk, sans-serif',
                          borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00e5ff' }} />}
                          <span style={{ fontWeight: isActive ? 600 : 400 }}>{city}</span>
                        </div>
                        {c && (
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: cColor }}>
                            {c.aqi}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ─── PAGE CONTENT ─── */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <Routes>
            <Route path="/" element={<CommandCenter city={selectedCity} liveAQI={liveAQI} alerts={alerts} />} />
            <Route path="/enforcement" element={<Enforcement city={selectedCity} />} />
            <Route path="/citizen" element={<CitizenChat city={selectedCity} />} />
          </Routes>
        </div>

        {/* ─── FOOTER ─── */}
        <footer style={{
          height: 32, flexShrink: 0,
          background: 'rgba(8,12,18,0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wind size={10} color="var(--cyan-dim)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Vayu Intelligence © 2025
            </span>
          </div>
          <div style={{ height: 12, width: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Data: OpenWeatherMap · OpenAQ · CPCB
          </span>
          <div style={{ height: 12, width: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Times of India Hackathon 2025
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={10} color={isConnected ? '#00e676' : '#ff6d00'} />
            <span style={{ fontSize: 10, color: isConnected ? '#00e676' : '#ff6d00' }}>
              {isConnected ? 'Real-time feed active' : 'Connecting...'}
            </span>
          </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;
