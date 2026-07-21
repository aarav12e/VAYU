import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Activity, Compass } from 'lucide-react';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

// All 32 State & UT Capitals of India
const INDIA_CITIES = [
  { name: 'Mumbai',             state: 'Maharashtra',        lat: 19.0760, lng: 72.8777, baseAqi: 145 },
  { name: 'Delhi',              state: 'NCR',                lat: 28.6139, lng: 77.2090, baseAqi: 240 },
  { name: 'Bengaluru',          state: 'Karnataka',          lat: 12.9716, lng: 77.5946, baseAqi: 95  },
  { name: 'Chennai',            state: 'Tamil Nadu',         lat: 13.0827, lng: 80.2707, baseAqi: 112 },
  { name: 'Kolkata',            state: 'West Bengal',        lat: 22.5726, lng: 88.3639, baseAqi: 168 },
  { name: 'Hyderabad',          state: 'Telangana',          lat: 17.3850, lng: 78.4867, baseAqi: 115 },
  { name: 'Ahmedabad',          state: 'Gujarat',            lat: 23.0225, lng: 72.5714, baseAqi: 155 },
  { name: 'Jaipur',             state: 'Rajasthan',          lat: 26.9124, lng: 75.7873, baseAqi: 160 },
  { name: 'Lucknow',            state: 'Uttar Pradesh',      lat: 26.8467, lng: 80.9462, baseAqi: 195 },
  { name: 'Chandigarh',         state: 'Punjab / Haryana',   lat: 30.7333, lng: 76.7794, baseAqi: 120 },
  { name: 'Patna',              state: 'Bihar',              lat: 25.5941, lng: 85.1376, baseAqi: 220 },
  { name: 'Bhubaneswar',        state: 'Odisha',             lat: 20.2961, lng: 85.8245, baseAqi: 125 },
  { name: 'Thiruvananthapuram', state: 'Kerala',             lat: 8.5241,  lng: 76.9366, baseAqi: 65  },
  { name: 'Bhopal',             state: 'Madhya Pradesh',     lat: 23.2599, lng: 77.4126, baseAqi: 135 },
  { name: 'Visakhapatnam',      state: 'Andhra Pradesh',     lat: 17.6868, lng: 83.2185, baseAqi: 110 },
  { name: 'Guwahati',           state: 'Assam',              lat: 26.1445, lng: 91.7362, baseAqi: 140 },
  { name: 'Ranchi',             state: 'Jharkhand',          lat: 23.3441, lng: 85.3096, baseAqi: 130 },
  { name: 'Raipur',             state: 'Chhattisgarh',       lat: 21.2514, lng: 81.6296, baseAqi: 150 },
  { name: 'Dehradun',           state: 'Uttarakhand',        lat: 30.3165, lng: 78.0322, baseAqi: 105 },
  { name: 'Shimla',             state: 'Himachal Pradesh',   lat: 31.1048, lng: 77.1734, baseAqi: 45  },
  { name: 'Srinagar',           state: 'Jammu & Kashmir',    lat: 34.0837, lng: 74.7973, baseAqi: 85  },
  { name: 'Panaji',             state: 'Goa',                lat: 15.4909, lng: 73.8278, baseAqi: 55  },
  { name: 'Leh',                state: 'Ladakh',             lat: 34.1526, lng: 77.5771, baseAqi: 35  },
  { name: 'Puducherry',         state: 'Puducherry',         lat: 11.9416, lng: 79.8083, baseAqi: 75  },
  { name: 'Agartala',           state: 'Tripura',            lat: 23.8315, lng: 91.2868, baseAqi: 110 },
  { name: 'Shillong',           state: 'Meghalaya',          lat: 25.5788, lng: 91.8933, baseAqi: 40  },
  { name: 'Imphal',             state: 'Manipur',            lat: 24.8170, lng: 93.9368, baseAqi: 60  },
  { name: 'Kohima',             state: 'Nagaland',           lat: 25.6751, lng: 94.1086, baseAqi: 50  },
  { name: 'Aizawl',             state: 'Mizoram',            lat: 23.7271, lng: 92.7176, baseAqi: 30  },
  { name: 'Itanagar',           state: 'Arunachal Pradesh',  lat: 27.0844, lng: 93.6053, baseAqi: 45  },
  { name: 'Gangtok',            state: 'Sikkim',             lat: 27.3389, lng: 88.6065, baseAqi: 35  },
  { name: 'Pune',               state: 'Maharashtra',        lat: 18.5204, lng: 73.8567, baseAqi: 130 },
];

// Improved India outline — more points for a realistic shape
const INDIA_BORDER = [
  // Starting from top-left (Kashmir) going clockwise
  [74.5, 35.5], [75.5, 35.8], [77.0, 35.6], [77.8, 35.5],
  [78.8, 34.2], [79.5, 32.5], [80.5, 31.0], [81.0, 29.5],
  [82.5, 29.0], [84.0, 28.5], [85.5, 28.0], [86.5, 27.5],
  [87.5, 27.8], [88.2, 27.8], [88.6, 27.2], [88.9, 26.5],
  [90.0, 26.8], [91.0, 27.0], [92.0, 27.8], [93.5, 27.5],
  [95.0, 28.2], [96.5, 28.0], [97.0, 27.0], [96.5, 24.5],
  [95.0, 24.0], [93.0, 23.5], [92.8, 23.0], [92.5, 22.5],
  [91.5, 23.5], [91.0, 24.0], [90.5, 25.0], [89.5, 26.5],
  [89.0, 25.0], [88.5, 23.5], [88.2, 22.5], [87.5, 22.0],
  [87.0, 21.5], [86.5, 20.5], [85.0, 19.8], [84.5, 19.0],
  [83.5, 18.5], [83.2, 17.5], [82.0, 16.5], [81.0, 15.5],
  [80.2, 13.0], [80.0, 12.0], [79.8, 10.2], [79.0, 9.5],
  [78.5, 9.0], [77.5, 8.1], [77.0, 8.5], [76.5, 9.8],
  [76.0, 10.5], [75.5, 11.5], [75.0, 12.5], [74.8, 12.8],
  [73.8, 15.5], [73.5, 17.0], [73.0, 18.0], [72.8, 19.0],
  [72.6, 21.0], [71.5, 21.5], [70.0, 21.0], [69.5, 22.0],
  [69.0, 23.0], [70.0, 23.8], [70.5, 24.2], [71.2, 25.0],
  [71.5, 26.5], [72.5, 28.0], [73.8, 29.8], [74.0, 31.0],
  [74.5, 32.8], [74.5, 33.5], [74.5, 35.5],
];

// Geographic bounds of India
const GEO = { minLng: 67.0, maxLng: 97.5, minLat: 6.5, maxLat: 36.5 };

export default function India3DMap({ liveAQI = {}, onSelectCity }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const stateRef = useRef({ yaw: 0.0, pitch: 0.55, zoom: 1.1 });

  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [viewState, setViewState] = useState({ yaw: 0.0, pitch: 0.55, zoom: 1.1 });

  // Convert geographic (lat, lng) → flat 3D world coordinates
  // West India on left, East on right, South at bottom, North at top
  const geoToWorld = useCallback((lat, lng, zoom) => {
    const scaleBase = 360; // base world units
    const scale = scaleBase * zoom;
    // Normalize 0..1, flip Y so north is up
    const nx = (lng - GEO.minLng) / (GEO.maxLng - GEO.minLng);
    const ny = (lat - GEO.minLat) / (GEO.maxLat - GEO.minLat);
    const x = (nx - 0.5) * scale;
    const y = (ny - 0.5) * scale; // positive = north
    return { x, y };
  }, []);

  // 3D rotation + perspective projection
  const project = useCallback((wx, wy, wz, yaw, pitch, cx, cy) => {
    // Rotate around Z axis (yaw = horizontal spin)
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const rx = wx * cosYaw - wy * sinYaw;
    const ry = wx * sinYaw + wy * cosYaw;

    // Rotate around X axis (pitch = tilt)
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
    const ry2 = ry * cosPitch - wz * sinPitch;
    const rz  = ry * sinPitch + wz * cosPitch;

    // Perspective divide
    const fov = 1100;
    const depth = fov + ry2 + 400;
    const s = fov / depth;

    return {
      sx: cx + rx * s,
      sy: cy - rz * s,   // canvas Y is flipped so up = up
      scale: s,
      depth: ry2,
    };
  }, []);

  // Main render loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 + H * 0.06; // slightly below center feels more natural

    const { yaw, pitch, zoom } = stateRef.current;

    // ── Background ──────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, 60, cx, cy * 0.5, W * 0.75);
    bg.addColorStop(0, '#0d1f33');
    bg.addColorStop(0.6, '#06101a');
    bg.addColorStop(1, '#020508');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle star field
    ctx.save();
    const starSeed = 42;
    for (let i = 0; i < 120; i++) {
      const sx = ((starSeed * (i * 97 + 13)) % W + W) % W;
      const sy = ((starSeed * (i * 53 + 7))  % H + H) % H;
      const sz = (i % 5) * 0.12 + 0.08;
      ctx.beginPath();
      ctx.arc(sx, sy, sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,200,255,${sz})`;
      ctx.fill();
    }
    ctx.restore();

    // ── Grid floor plane ─────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(0,229,255,0.055)';
    ctx.lineWidth = 1;
    const gScale = 380 * zoom;
    const gSteps = 10;
    for (let i = -gSteps; i <= gSteps; i++) {
      const t = (i / gSteps) * gScale;
      const a = project(-gScale, t, 0, yaw, pitch, cx, cy);
      const b = project( gScale, t, 0, yaw, pitch, cx, cy);
      const c = project(t, -gScale, 0, yaw, pitch, cx, cy);
      const d = project(t,  gScale, 0, yaw, pitch, cx, cy);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy); ctx.stroke();
    }
    ctx.restore();

    // ── India landmass fill ──────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    INDIA_BORDER.forEach(([lng, lat], i) => {
      const { x, y } = geoToWorld(lat, lng, zoom);
      const { sx, sy } = project(x, y, 0, yaw, pitch, cx, cy);
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    });
    ctx.closePath();

    const landFill = ctx.createRadialGradient(cx, cy, 30, cx, cy, W * 0.45);
    landFill.addColorStop(0,   'rgba(0,229,255,0.18)');
    landFill.addColorStop(0.7, 'rgba(8,28,52,0.50)');
    landFill.addColorStop(1,   'rgba(4,10,22,0.65)');
    ctx.fillStyle = landFill;
    ctx.fill();

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── City AQI pillars ─────────────────────────────────────────
    const now = Date.now() / 1000;

    const rendered = INDIA_CITIES.map(city => {
      const live = liveAQI[city.name];
      const aqi  = live?.aqi || city.baseAqi;
      const color = getAQIColor(aqi);
      const category = live?.category || getAQICategory(aqi);

      // pillar height proportional to AQI
      const pillarH = (aqi / 500) * 160 * Math.sqrt(zoom);

      const { x, y } = geoToWorld(city.lat, city.lng, zoom);
      const base = project(x, y, 0,       yaw, pitch, cx, cy);
      const top  = project(x, y, pillarH, yaw, pitch, cx, cy);

      return { ...city, aqi, color, category, base, top, pillarH };
    }).sort((a, b) => b.base.depth - a.base.depth); // back-to-front

    rendered.forEach(city => {
      const isHov = hoveredCity?.name === city.name;
      const isSel = selectedCity?.name === city.name;
      const r = (isSel || isHov ? 7 : 4) * Math.max(0.4, city.base.scale);
      const pulse = (Math.sin(now * 2.2 + city.aqi * 0.05) + 1) * 0.5;

      // Ground glow halo
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(city.base.sx, city.base.sy, r * 2.5 + pulse * 10, r * 1.2 + pulse * 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${city.color}28`;
      ctx.fill();

      // Pulsing radar ring
      ctx.beginPath();
      ctx.ellipse(city.base.sx, city.base.sy, r * 2.5 + pulse * 18, r * 1.2 + pulse * 9, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${city.color}${Math.round((0.45 - pulse * 0.35) * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Pillar body
      ctx.save();
      const dx = city.top.sx - city.base.sx;
      const dy = city.top.sy - city.base.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx2 = -dy / len * r;
      const ny2 =  dx / len * r;

      const grad = ctx.createLinearGradient(city.base.sx, city.base.sy, city.top.sx, city.top.sy);
      grad.addColorStop(0,   `${city.color}44`);
      grad.addColorStop(0.5,  city.color);
      grad.addColorStop(1,   '#ffffff');

      ctx.beginPath();
      ctx.moveTo(city.base.sx - nx2, city.base.sy - ny2);
      ctx.lineTo(city.base.sx + nx2, city.base.sy + ny2);
      ctx.lineTo(city.top.sx  + nx2, city.top.sy  + ny2);
      ctx.lineTo(city.top.sx  - nx2, city.top.sy  - ny2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Glowing spine line
      ctx.beginPath();
      ctx.moveTo(city.base.sx, city.base.sy);
      ctx.lineTo(city.top.sx, city.top.sy);
      ctx.strokeStyle = isHov || isSel ? '#ffffff' : city.color;
      ctx.lineWidth = (isHov || isSel ? 4 : 2) * Math.max(0.5, city.base.scale);
      ctx.shadowColor = city.color;
      ctx.shadowBlur = isHov || isSel ? 24 : 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Top cap disc
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(city.top.sx, city.top.sy, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = isHov || isSel ? '#ffffff' : city.color;
      ctx.shadowColor = city.color;
      ctx.shadowBlur = isHov || isSel ? 28 : 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Labels
      const majorCities = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Jaipur', 'Lucknow', 'Pune', 'Ahmedabad'];
      if (isHov || isSel || majorCities.includes(city.name)) {
        const fs = Math.max(8, Math.round(10 * Math.max(0.6, city.top.scale)));
        ctx.save();
        ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = isHov || isSel ? '#00e5ff' : 'rgba(220,235,250,0.9)';
        ctx.fillText(city.name, city.top.sx + r + 5, city.top.sy + 3);
        ctx.font = `700 ${Math.max(7, fs - 1)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = city.color;
        ctx.fillText(`AQI ${city.aqi}`, city.top.sx + r + 5, city.top.sy - fs + 1);
        ctx.restore();
      }
    });

    animRef.current = requestAnimationFrame(draw);
  }, [geoToWorld, project, liveAQI, hoveredCity, selectedCity]);

  // Start render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.parentElement?.clientWidth  || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    resize();
    window.addEventListener('resize', resize);

    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  // ── Mouse interaction handlers ───────────────────────────────
  const onMouseDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      stateRef.current = {
        ...stateRef.current,
        yaw:   stateRef.current.yaw + dx * 0.007,
        pitch: Math.max(0.1, Math.min(1.3, stateRef.current.pitch - dy * 0.006)),
      };
      setViewState({ ...stateRef.current }); // trigger re-label sync
      return;
    }

    // Hover detection
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2 + H * 0.06;
    const { yaw, pitch, zoom } = stateRef.current;

    let found = null;
    for (const city of INDIA_CITIES) {
      const live = liveAQI[city.name];
      const aqi  = live?.aqi || city.baseAqi;
      const pillarH = (aqi / 500) * 160 * Math.sqrt(zoom);
      const { x, y } = geoToWorld(city.lat, city.lng, zoom);
      const top = project(x, y, pillarH, yaw, pitch, cx, cy);
      const dist = Math.hypot(mx - top.sx, my - top.sy);
      if (dist < 18 * Math.max(0.5, top.scale)) { found = { ...city, aqi }; break; }
    }
    setHoveredCity(found);
  }, [geoToWorld, project, liveAQI]);

  const onMouseUp = () => { isDragging.current = false; };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    stateRef.current = {
      ...stateRef.current,
      zoom: Math.max(0.45, Math.min(3.8, stateRef.current.zoom + delta)),
    };
    setViewState({ ...stateRef.current });
  };

  const onClick = () => {
    if (hoveredCity) {
      setSelectedCity(hoveredCity);
      if (onSelectCity) onSelectCity(hoveredCity.name);
    }
  };

  const resetView = () => {
    stateRef.current = { yaw: 0.0, pitch: 0.55, zoom: 1.1 };
    setViewState({ yaw: 0.0, pitch: 0.55, zoom: 1.1 });
  };
  const zoomIn  = () => { stateRef.current.zoom = Math.min(3.8, stateRef.current.zoom + 0.2); setViewState({ ...stateRef.current }); };
  const zoomOut = () => { stateRef.current.zoom = Math.max(0.45, stateRef.current.zoom - 0.2); setViewState({ ...stateRef.current }); };

  // Info card data
  const activeCity  = hoveredCity || selectedCity || INDIA_CITIES[0];
  const activeLive  = liveAQI[activeCity.name];
  const activeAQI   = activeLive?.aqi || activeCity.baseAqi;
  const activeColor = getAQIColor(activeAQI);
  const cigs        = Math.max(0, ((activeAQI - 20) * 0.03)).toFixed(1);

  return (
    <div
      style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        background: '#020508',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={onClick}
      onWheel={onWheel}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* ── HUD Top-Left ──────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <Compass size={14} color="#00e5ff" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc', letterSpacing: '0.05em' }}>
            INDIA 3D AIR QUALITY MAP
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#57606a' }}>
          🖱 Drag to orbit · Scroll to zoom · Click city to select
        </div>
      </div>

      {/* ── Controls Top-Right ────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 16, right: 20, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { label: 'Reset',   icon: <RotateCw  size={12} />, action: resetView, color: '#00e5ff' },
          { label: 'Zoom +',  icon: <ZoomIn    size={12} />, action: zoomIn,    color: '#f0f6fc' },
          { label: 'Zoom −',  icon: <ZoomOut   size={12} />, action: zoomOut,   color: '#f0f6fc' },
        ].map(({ label, icon, action, color }) => (
          <button
            key={label}
            onClick={(e) => { e.stopPropagation(); action(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 11px', borderRadius: 7,
              background: 'rgba(9,14,23,0.85)', border: '1px solid rgba(0,229,255,0.2)',
              color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
              backdropFilter: 'blur(8px)',
            }}
          >
            {icon}<span>{label}</span>
          </button>
        ))}
        <div style={{
          fontSize: 10, color: '#444c56', textAlign: 'right',
          fontFamily: 'JetBrains Mono, monospace', marginTop: 2,
        }}>
          ⤢ {viewState.zoom.toFixed(2)}x
        </div>
      </div>

      {/* ── City Info Card ────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20, zIndex: 20,
        width: 300,
        background: 'rgba(10,18,30,0.95)',
        border: `1px solid ${activeColor}55`,
        borderRadius: 14, padding: '14px 18px',
        boxShadow: `0 16px 50px rgba(0,0,0,0.8), 0 0 24px ${activeColor}1a`,
        backdropFilter: 'blur(20px)',
        transition: 'border-color 0.3s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {activeCity.state}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', lineHeight: 1.2 }}>
              {activeCity.name}
            </div>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: activeColor,
            background: `${activeColor}18`, border: `1px solid ${activeColor}44`,
            borderRadius: 999, padding: '3px 9px', flexShrink: 0,
          }}>
            {activeLive?.category || getAQICategory(activeAQI)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: activeColor, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>
            {activeAQI}
          </span>
          <span style={{ fontSize: 11, color: '#57606a' }}>AQI Index</span>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '8px 10px',
          borderLeft: `3px solid ${activeColor}`, marginBottom: 12,
        }}>
          <div style={{ fontSize: 9, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            🫁 8-Hour Lung Exposure
          </div>
          <div style={{ fontSize: 12, color: '#c9d1d9' }}>
            ≈ smoking <span style={{ color: activeColor, fontWeight: 700 }}>{cigs} cigarettes</span> today
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (onSelectCity) onSelectCity(activeCity.name); }}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 7,
            background: `linear-gradient(135deg, #00e5ff, #007a8c)`,
            border: 'none', color: '#030509', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 0 14px rgba(0,229,255,0.35)',
          }}
        >
          <Activity size={12} />
          View {activeCity.name} in Command Center
        </button>
      </div>

      {/* ── AQI Legend ────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, zIndex: 10,
        background: 'rgba(9,14,23,0.88)', border: '1px solid rgba(0,229,255,0.12)',
        borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(10px)',
      }}>
        {[
          ['Good',       '0–50',    '#00e676'],
          ['Satisfact.', '51–100',  '#76ff03'],
          ['Moderate',   '101–200', '#ffea00'],
          ['Poor',       '201–300', '#ff6d00'],
          ['Very Poor',  '301–400', '#d50000'],
          ['Severe',     '401+',    '#7b1fa2'],
        ].map(([label, range, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, color: '#8b949e' }}>{label}</span>
            <span style={{ fontSize: 9, color: '#444c56', marginLeft: 'auto', fontFamily: 'JetBrains Mono' }}>{range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
