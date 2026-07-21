import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  Wind, MapPin, ShieldAlert, MessageSquare, Activity, Bell, ChevronDown, Wifi,
  X, AlertTriangle, Zap, Info, CheckCircle, Home
} from 'lucide-react';
import LandingPage from './pages/LandingPage';
import CommandCenter from './pages/CommandCenter';
import Enforcement from './pages/Enforcement';
import CitizenChat from './pages/CitizenChat';
import { getSocket, subscribeToCity } from './socket';
import { Starfield } from './components/Starfield';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#d50000', bg: 'rgba(213,0,0,0.1)', border: 'rgba(213,0,0,0.25)', icon: Zap },
  HIGH:     { color: '#ff6d00', bg: 'rgba(255,109,0,0.1)', border: 'rgba(255,109,0,0.25)', icon: AlertTriangle },
  MEDIUM:   { color: '#ffd600', bg: 'rgba(255,214,0,0.1)', border: 'rgba(255,214,0,0.2)',  icon: Bell },
  LOW:      { color: '#00e676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', icon: Info },
};

function getTimeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Patna', 'Bhubaneswar',
  'Thiruvananthapuram', 'Bhopal', 'Visakhapatnam', 'Guwahati', 'Ranchi',
  'Raipur', 'Dehradun', 'Shimla', 'Srinagar', 'Panaji', 'Leh', 'Puducherry',
  'Agartala', 'Shillong', 'Imphal', 'Kohima', 'Aizawl', 'Itanagar', 'Gangtok', 'Pune'
];

function MainLayout() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [alerts, setAlerts] = useState([]);
  const [liveAQI, setLiveAQI] = useState({});
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('ALL');
  const [isConnected, setIsConnected] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getSocket();
    setIsConnected(socket.connected);
    subscribeToCity(selectedCity);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

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
    Poor: '#ff6d00', 'Very Poor': '#d50000', Severe: '#9c27b0',
  };
  const aqiColor = aqiColorMap[cityAQI?.category] || '#00e5ff';
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  useEffect(() => {
    if (!cityDropdownOpen && !notifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      setCityDropdownOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [cityDropdownOpen, notifOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'transparent', position: 'relative' }}>

      {/* STARFIELD BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Starfield
          starCount={15000}
          waveFrequency={15}
          starEscapeWidth={450}
          voidWidth={80}
          starColor={{ r: 0, g: 229, b: 255 }}
          maxOpacity={220}
          rotationSpeed={0.0003}
          waveSpeed={0.006}
        />
      </div>

      {/* TOP NAV */}
      <nav style={{
        height: 56,
        background: 'rgba(9, 14, 23, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,229,255,0.15)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 20, flexShrink: 0, zIndex: 100,
        position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 4, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #00e5ff 0%, #007a8c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0,229,255,0.4)',
          }}>
            <Wind size={18} color="#030509" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Vayu Intelligence
            </div>
            <div style={{ fontSize: 9, color: '#57606a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Urban Air Quality Platform
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { to: '/app', icon: Activity, label: 'Command Center' },
            { to: '/app/enforcement', icon: ShieldAlert, label: 'Enforcement' },
            { to: '/app/citizen', icon: MessageSquare, label: 'Citizen AI' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                textDecoration: 'none', fontSize: 12, fontWeight: 600,
                color: isActive ? '#00e5ff' : '#8b949e',
                background: isActive ? 'rgba(0,229,255,0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,229,255,0.3)' : 'transparent'}`,
                transition: 'all 0.15s',
              })}
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Home / Landing button */}
          <button
            onClick={() => navigate('/')}
            title="Landing Page"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(14,22,35,0.6)', border: '1px solid rgba(0,229,255,0.15)',
              color: '#8b949e', fontSize: 12, cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#00e5ff'; e.currentTarget.style.borderColor = '#00e5ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.15)'; }}
          >
            <Home size={13} />
            <span>Home</span>
          </button>

          {/* Connection status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isConnected ? '#00e676' : '#ff6d00',
              boxShadow: isConnected ? '0 0 6px #00e676' : '0 0 6px #ff6d00',
            }} />
            <span style={{ fontSize: 10, color: '#57606a' }}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* Live AQI Badge */}
          {cityAQI && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(14,22,35,0.8)', border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 8, padding: '4px 12px',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: aqiColor, animation: 'pulse-dot 2s infinite',
              }} />
              <span style={{ fontSize: 11, color: '#8b949e' }}>AQI</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: aqiColor }}>
                {cityAQI.aqi}
              </span>
              <span style={{ fontSize: 10, color: '#57606a' }}>{cityAQI.category}</span>
            </div>
          )}

          {/* Alerts Bell */}
          <div style={{ position: 'relative' }} ref={notifRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 10px', position: 'relative', background: notifOpen ? 'var(--bg-hover)' : 'transparent' }}
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={14} />
              {criticalCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#d50000', boxShadow: '0 0 8px #d50000',
                  animation: 'pulse-dot 1.5s infinite',
                }} />
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 360, maxHeight: 520,
                background: 'rgba(16, 26, 42, 0.95)',
                border: '1px solid var(--border-active)',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(20px)',
                zIndex: 300, display: 'flex', flexDirection: 'column',
                animation: 'slide-up 0.2s ease',
              }}>
                <div style={{
                  padding: '14px 16px 10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={13} color="var(--cyan-bright)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live Alerts</span>
                    {criticalCount > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#d50000',
                        background: 'rgba(213,0,0,0.15)', borderRadius: 999,
                        padding: '2px 8px', border: '1px solid rgba(213,0,0,0.3)',
                      }}>
                        {criticalCount} CRITICAL
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 4, flexShrink: 0 }}>
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((f) => {
                    const cfg = SEVERITY_CONFIG[f] || {};
                    const isActive = notifFilter === f;
                    return (
                      <button key={f} onClick={() => setNotifFilter(f)} style={{
                        padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                        fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 600,
                        border: isActive ? `1px solid ${f === 'ALL' ? 'var(--border-active)' : cfg.border}` : '1px solid transparent',
                        background: isActive ? (f === 'ALL' ? 'var(--cyan-glow)' : cfg.bg) : 'transparent',
                        color: isActive ? (f === 'ALL' ? 'var(--cyan-bright)' : cfg.color) : 'var(--text-muted)',
                        letterSpacing: '0.04em',
                      }}>{f}</button>
                    );
                  })}
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
                  {(() => {
                    const filtered = notifFilter === 'ALL' ? alerts : alerts.filter(a => a.severity === notifFilter);
                    const display = filtered.length > 0 ? filtered : getDemoAlerts(selectedCity);
                    if (display.length === 0) return (
                      <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                        <CheckCircle size={28} color="#00e676" style={{ marginBottom: 10 }} />
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No active alerts</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Air quality is being monitored</div>
                      </div>
                    );
                    return display.map((alert, i) => {
                      const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.MEDIUM;
                      const Icon = cfg.icon;
                      return (
                        <div key={alert._id || i} className="animate-slide-up" style={{
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                          borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                        }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                              background: `${cfg.color}22`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon size={12} color={cfg.color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  {alert.severity}
                                </span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{getTimeAgo(alert.timestamp)}</span>
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 3 }}>
                                {alert.title}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {alert.message?.substring(0, 110)}{alert.message?.length > 110 ? '...' : ''}
                              </div>
                              {alert.aqi && (
                                <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-muted)' }}>
                                  AQI: <span className="mono" style={{ color: cfg.color, fontWeight: 700 }}>{alert.aqi}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div style={{
                  padding: '8px 16px', borderTop: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', animation: 'pulse-dot 2s infinite' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Live monitoring · updates every 15 min</span>
                </div>
              </div>
            )}
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
              <CityDropdownMenu
                cities={CITIES}
                selectedCity={selectedCity}
                liveAQI={liveAQI}
                aqiColorMap={aqiColorMap}
                onSelect={(city) => {
                  setSelectedCity(city);
                  setCityDropdownOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </nav>

      {/* MAIN PLATFORM ROUTES */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<CommandCenter city={selectedCity} liveAQI={liveAQI} alerts={alerts} />} />
          <Route path="/enforcement" element={<Enforcement city={selectedCity} />} />
          <Route path="/citizen" element={<CitizenChat city={selectedCity} />} />
        </Routes>
      </div>

      {/* FOOTER */}
      <footer style={{
        height: 32, flexShrink: 0,
        background: 'rgba(9,14,23,0.92)',
        borderTop: '1px solid rgba(0,229,255,0.12)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 20, zIndex: 100, position: 'relative',
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
          Times of India Hackathon Entry
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wifi size={10} color={isConnected ? '#00e676' : '#ff6d00'} />
          <span style={{ fontSize: 10, color: isConnected ? '#00e676' : '#ff6d00' }}>
            {isConnected ? 'Real-time feed active' : 'Connecting...'}
          </span>
        </div>
      </footer>
    </div>
  );
}

function CityDropdownMenu({ cities, selectedCity, liveAQI, aqiColorMap, onSelect }) {
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}

export default App;

function getDemoAlerts(city) {
  const cityWards = {
    Mumbai: ['Dharavi', 'Andheri', 'Kurla', 'Malad', 'Worli'],
    Chennai: ['Manali', 'Velachery', 'Guindy', 'Royapuram', 'Ambattur'],
    Delhi: ['Anand Vihar', 'Okhla', 'Jahangirpuri', 'Dwarka', 'Punjabi Bagh'],
    Bengaluru: ['Peenya', 'Silk Board', 'Whitefield', 'Electronic City', 'Indiranagar'],
    Kolkata: ['Howrah', 'Rabindra Bharati', 'New Town', 'Ballygunge', 'Jadavpur'],
    Pune: ['Hadapsar', 'Pimpri', 'Hinjewadi', 'Kothrud', 'Swargate'],
  };
  const w = cityWards[city] || cityWards['Mumbai'];

  return [
    {
      _id: 'dn1', severity: 'CRITICAL', title: `Severe AQI Spike — ${w[0]} (${city})`,
      message: `AQI has reached 312 at ${w[0]} CAAQMS station in ${city}. PM2.5 is at 3.2x safe limits. Immediate enforcement required.`,
      aqi: 312, timestamp: new Date(Date.now() - 8 * 60000),
    },
    {
      _id: 'dn2', severity: 'HIGH', title: `Forecast: AQI >250 in ${w[1]} by 6PM`,
      message: `AI prediction indicates elevated PM2.5 threshold in ${w[1]}, ${city} within 4 hours based on wind and traffic patterns.`,
      aqi: 251, timestamp: new Date(Date.now() - 22 * 60000),
    },
    {
      _id: 'dn3', severity: 'HIGH', title: `Dust Emission Source — ${w[2]}`,
      message: `AI attribution identified 3 construction/industrial sites responsible for localized PM10 elevation in ${w[2]}, ${city}.`,
      aqi: 228, timestamp: new Date(Date.now() - 45 * 60000),
    },
    {
      _id: 'dn4', severity: 'MEDIUM', title: `Thermal Anomaly Detected — ${w[3]}`,
      message: `Satellite thermal sensor detected waste burning signature near ${w[3]}, ${city}. Enforcement team dispatched.`,
      aqi: 189, timestamp: new Date(Date.now() - 90 * 60000),
    },
    {
      _id: 'dn5', severity: 'MEDIUM', title: `Health Advisory — ${w[4]}`,
      message: `AQI above 200 recorded in ${w[4]}, ${city}. Sensitive groups advised to minimize prolonged outdoor exertion.`,
      aqi: 203, timestamp: new Date(Date.now() - 120 * 60000),
    },
  ];
}
