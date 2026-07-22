import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Wind, MapPin, ShieldAlert, MessageSquare, Activity, Bell, ChevronDown, Wifi,
  X, AlertTriangle, Zap, Info
} from 'lucide-react';
import { getSocket, subscribeToCity } from './services/socket';
import api from './services/api';
import { CITIES, AQI_COLOR_MAP } from './config/constants';
import Starfield from './components/layout/Starfield';
import CityDropdownMenu from './components/layout/CityDropdownMenu';
import HealthPlannerModal from './components/HealthPlannerModal';
import CityComparisonModal from './components/CityComparisonModal';
import ThemeSwitcher, { useTheme } from './components/ThemeSwitcher';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const Enforcement = lazy(() => import('./pages/Enforcement'));
const CitizenChat = lazy(() => import('./pages/CitizenChat'));

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

function MainLayout() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [alerts, setAlerts] = useState([]);
  const [liveAQI, setLiveAQI] = useState({});
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('ALL');
  const [isConnected, setIsConnected] = useState(false);
  const [healthPlannerOpen, setHealthPlannerOpen] = useState(false);
  const [cityComparisonOpen, setCityComparisonOpen] = useState(false);
  const { theme, setTheme } = useTheme();
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
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [selectedCity]);

  useEffect(() => {
    api.get('/api/aqi/live').then((res) => {
      const map = {};
      res.data.data?.forEach((r) => { map[r.city] = { aqi: r.aqi, category: r.category }; });
      setLiveAQI(map);
    }).catch(() => {});

    api.get(`/api/aqi/alerts/${selectedCity}`).then((res) => {
      setAlerts(res.data.data || []);
    }).catch(() => {});
  }, [selectedCity]);

  const cityAQI = liveAQI[selectedCity];
  const aqiColor = AQI_COLOR_MAP[cityAQI?.category] || '#00e5ff';
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

      {/* ── TOP NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        height: 60,
        background: 'var(--nav-bg, rgba(6,10,18,0.96))',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--nav-border)',
        display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 0,
        flexShrink: 0, zIndex: 200, position: 'relative',
      }}>

        {/* ── LEFT: Logo ─────────────────────────── */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginRight: 20, flexShrink: 0 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--cyan-bright) 0%, var(--cyan-dim) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px var(--cyan-glow)',
          }}>
            <Wind size={18} color="#030509" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              VAYU
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
              Intelligence
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', marginRight: 16, flexShrink: 0 }} />

        {/* ── CENTER: Nav Links ───────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { to: '/app',              icon: Activity,      label: 'Command' },
            { to: '/app/enforcement',  icon: ShieldAlert,   label: 'Enforcement' },
            { to: '/app/citizen',      icon: MessageSquare, label: 'Citizen AI' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 7,
                textDecoration: 'none', fontSize: 12, fontWeight: 600,
                color: isActive ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                background: isActive ? 'var(--cyan-glow)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-active)' : 'transparent'}`,
                transition: 'all 0.15s',
              })}
            >
              <Icon size={12} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', margin: '0 14px', flexShrink: 0 }} />

        {/* ── FEATURE TOOLS ──────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setHealthPlannerOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              background: 'var(--cyan-glow)', border: '1px solid var(--border-subtle)',
              color: 'var(--cyan-bright)', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12 }}>🫁</span>
            <span>Health</span>
          </button>

          <button
            onClick={() => setCityComparisonOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              background: 'rgba(118,255,3,0.08)', border: '1px solid rgba(118,255,3,0.2)',
              color: '#76ff03', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12 }}>⚖️</span>
            <span>Compare</span>
          </button>
        </div>

        {/* ── RIGHT: Controls ─────────────────────── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Live AQI badge */}
          {cityAQI && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '4px 10px', flexShrink: 0,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: aqiColor, animation: 'pulse-dot 2s infinite', flexShrink: 0,
              }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>AQI</span>
              <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: aqiColor, lineHeight: 1 }}>
                {cityAQI.aqi}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: aqiColor,
                background: `${aqiColor}18`, borderRadius: 4, padding: '1px 5px',
              }}>{cityAQI.category}</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', flexShrink: 0 }} />

          {/* Theme switcher */}
          <ThemeSwitcher theme={theme} setTheme={setTheme} />

          {/* City Selector */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-ghost"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              style={{
                gap: 6, minWidth: 120, justifyContent: 'space-between',
                fontSize: 12, padding: '5px 10px',
              }}
            >
              <MapPin size={12} color="var(--cyan-bright)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCity}</span>
              <ChevronDown
                size={11}
                color="var(--text-muted)"
                style={{ transition: 'transform 0.2s', transform: cityDropdownOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            {cityDropdownOpen && (
              <CityDropdownMenu
                cities={CITIES}
                selectedCity={selectedCity}
                liveAQI={liveAQI}
                aqiColorMap={AQI_COLOR_MAP}
                onSelect={(city) => { setSelectedCity(city); setCityDropdownOpen(false); }}
              />
            )}
          </div>

          {/* Alerts Bell */}
          <div style={{ position: 'relative' }} ref={notifRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-ghost"
              style={{ padding: '5px 9px', position: 'relative', background: notifOpen ? 'var(--bg-hover)' : 'transparent' }}
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={14} color="var(--text-secondary)" />
              {criticalCount > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
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
                background: 'var(--bg-card)',
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Live Alerts</span>
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
                  <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div style={{
                  display: 'flex', gap: 4, padding: '8px 16px',
                  borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}>
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setNotifFilter(f)}
                      style={{
                        padding: '3px 10px', borderRadius: 6, border: 'none',
                        fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        background: notifFilter === f ? 'var(--cyan-dim)' : 'transparent',
                        color: notifFilter === f ? 'var(--bg-void)' : 'var(--text-muted)',
                        fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Alert List */}
                <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
                  {(() => {
                    const displayAlerts = alerts.length > 0 ? alerts : getDemoAlerts(selectedCity);
                    const filtered = displayAlerts.filter(a => notifFilter === 'ALL' || a.severity === notifFilter);
                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                          No {notifFilter.toLowerCase()} alerts for {selectedCity}
                        </div>
                      );
                    }
                    return filtered.map((alert) => {
                      const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.LOW;
                      const IconComp = cfg.icon;
                      return (
                        <div
                          key={alert._id || alert.id}
                          style={{
                            padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                            background: cfg.bg, border: `1px solid ${cfg.border}`,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: `${cfg.color}20`, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                            }}>
                              <IconComp size={12} color={cfg.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{alert.severity}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{getTimeAgo(alert.timestamp)}</span>
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                                {alert.title}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {alert.message}
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

          {/* Live connection pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 999, padding: '3px 9px', flexShrink: 0,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isConnected ? '#00e676' : '#ff6d00',
              boxShadow: `0 0 6px ${isConnected ? '#00e676' : '#ff6d00'}`,
              animation: isConnected ? 'pulse-dot 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, color: isConnected ? '#00e676' : '#ff6d00', letterSpacing: '0.06em' }}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={
          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--cyan-bright)' }}>
            <div style={{ animation: 'pulse-dot 1.5s infinite', width: 12, height: 12, background: 'var(--cyan-bright)', borderRadius: '50%' }}></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<PageTransition><CommandCenter city={selectedCity} liveAQI={liveAQI} alerts={alerts} onSelectCity={(c) => setSelectedCity(c)} /></PageTransition>} />
            <Route path="/enforcement" element={<PageTransition><Enforcement city={selectedCity} /></PageTransition>} />
            <Route path="/citizen" element={<PageTransition><CitizenChat city={selectedCity} liveAQI={liveAQI[selectedCity]} /></PageTransition>} />
          </Routes>
        </Suspense>
      </div>

      {/* FEATURE MODALS */}
      {healthPlannerOpen && (
        <HealthPlannerModal
          city={selectedCity}
          currentAQI={liveAQI[selectedCity]?.aqi || 140}
          onClose={() => setHealthPlannerOpen(false)}
        />
      )}

      {cityComparisonOpen && (
        <CityComparisonModal
          defaultCity={selectedCity}
          onClose={() => setCityComparisonOpen(false)}
        />
      )}

      {/* FOOTER */}
      <footer style={{
        height: 28, background: 'var(--nav-bg, rgba(6,10,18,0.95))', borderTop: '1px solid var(--nav-border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: 11, color: 'var(--text-muted)',
        flexShrink: 0, zIndex: 100, position: 'relative',
      }}>
        <span>Vayu Intelligence · Air Quality &amp; AI Enforcement Platform</span>
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

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AnimatedAppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith('/app') ? '/app' : location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ height: '100vh' }}>
            <LandingPage />
          </motion.div>
        } />
        <Route path="/app/*" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ height: '100vh' }}>
            <MainLayout />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#030509' }}>
          <div style={{ animation: 'pulse-dot 1.5s infinite', width: 16, height: 16, background: '#00e5ff', borderRadius: '50%' }}></div>
        </div>
      }>
        <AnimatedAppRoutes />
      </Suspense>
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
