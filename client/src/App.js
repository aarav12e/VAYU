import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  Wind, MapPin, ShieldAlert, MessageSquare, Activity, Bell, ChevronDown
} from 'lucide-react';
import CommandCenter from './pages/CommandCenter';
import Enforcement from './pages/Enforcement';
import CitizenChat from './pages/CitizenChat';
import { getSocket, subscribeToCity } from './socket';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CITIES = ['Mumbai', 'Delhi', 'Kolkata', 'Bengaluru', 'Chennai', 'Pune'];

function App() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [alerts, setAlerts] = useState([]);
  const [liveAQI, setLiveAQI] = useState({});
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    subscribeToCity(selectedCity);

    socket.on('aqi:update', (data) => {
      setLiveAQI((prev) => ({ ...prev, [data.city]: data }));
    });

    socket.on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    });

    return () => {
      socket.off('aqi:update');
      socket.off('alert:new');
    };
  }, [selectedCity]);

  useEffect(() => {
    // Load initial data
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
  const aqiClass = cityAQI ? `aqi-${cityAQI.category?.toLowerCase().replace(' ', '')}` : 'aqi-moderate';

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-void)' }}>

        {/* TOP NAV */}
        <nav style={{
          height: 'var(--nav-height)',
          background: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 24,
          flexShrink: 0,
          zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--cyan-bright), var(--cyan-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wind size={18} color="var(--bg-void)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Vayu Intelligence
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Urban Air Quality Platform
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { to: '/', icon: Activity, label: 'Command Center' },
              { to: '/enforcement', icon: ShieldAlert, label: 'Enforcement' },
              { to: '/citizen', icon: MessageSquare, label: 'Citizen Advisory' },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  color: isActive ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--cyan-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                  transition: 'all 0.15s',
                })}
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Live AQI Badge */}
            {cityAQI && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, padding: '4px 12px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan-bright)', animation: 'pulse-dot 2s infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>LIVE AQI</span>
                <span className={`mono ${aqiClass}`} style={{ fontSize: 14, fontWeight: 700 }}>
                  {cityAQI.aqi}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cityAQI.category}</span>
              </div>
            )}

            {/* Alerts Bell */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }}>
                <Bell size={14} />
                {alerts.filter(a => a.severity === 'CRITICAL').length > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--aqi-verypoor)',
                  }} />
                )}
              </button>
            </div>

            {/* City Selector */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                style={{ gap: 6, minWidth: 120, justifyContent: 'space-between' }}
              >
                <MapPin size={13} />
                <span>{selectedCity}</span>
                <ChevronDown size={12} />
              </button>
              {cityDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: 'var(--bg-card)', border: '1px solid var(--border-active)',
                  borderRadius: 10, overflow: 'hidden', zIndex: 200, minWidth: 150,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setCityDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '10px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                        fontSize: 13, fontFamily: 'Space Grotesk, sans-serif',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>{city}</span>
                      {liveAQI[city] && (
                        <span className={`mono aqi-${liveAQI[city].category?.toLowerCase().replace(' ', '')}`} style={{ fontSize: 12 }}>
                          {liveAQI[city].aqi}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<CommandCenter city={selectedCity} liveAQI={liveAQI} alerts={alerts} />} />
            <Route path="/enforcement" element={<Enforcement city={selectedCity} />} />
            <Route path="/citizen" element={<CitizenChat city={selectedCity} />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;
