import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { RotateCw, Compass, Activity, ZoomIn, ZoomOut } from 'lucide-react';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const isValidMapboxToken = (token) =>
  token && token.startsWith('pk.') && !token.includes('demo') && token.length > 50;

// All 32 State & UT Capital Coordinates of India
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

// High-Definition Vector Outline of India (Geographic Lng, Lat)
const INDIA_BORDER_GEO = [
  { lng: 74.5, lat: 35.5 }, { lng: 77.8, lat: 35.5 }, { lng: 78.8, lat: 34.2 },
  { lng: 80.5, lat: 31.0 }, { lng: 88.2, lat: 27.8 }, { lng: 88.6, lat: 27.2 },
  { lng: 92.0, lat: 27.8 }, { lng: 95.5, lat: 28.2 }, { lng: 96.5, lat: 28.0 },
  { lng: 95.0, lat: 24.5 }, { lng: 92.8, lat: 23.0 }, { lng: 91.5, lat: 23.5 },
  { lng: 89.5, lat: 26.5 }, { lng: 88.2, lat: 22.5 }, { lng: 87.0, lat: 21.5 },
  { lng: 85.0, lat: 19.8 }, { lng: 83.2, lat: 17.5 }, { lng: 80.2, lat: 13.0 },
  { lng: 79.8, lat: 10.2 }, { lng: 77.5, lat: 8.1  }, { lng: 76.5, lat: 9.8  },
  { lng: 74.8, lat: 12.8 }, { lng: 73.8, lat: 15.5 }, { lng: 72.8, lat: 19.0 },
  { lng: 72.6, lat: 21.0 }, { lng: 70.0, lat: 21.0 }, { lng: 69.0, lat: 23.0 },
  { lng: 70.5, lat: 24.2 }, { lng: 71.2, lat: 26.5 }, { lng: 73.8, lat: 29.8 },
  { lng: 74.5, lat: 32.8 }, { lng: 74.5, lat: 35.5 }
];

export default function India3DMap({ liveAQI = {}, onSelectCity }) {
  const mapContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [useMapbox] = useState(() => isValidMapboxToken(MAPBOX_TOKEN));

  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [rotation, setRotation] = useState({ pitch: 0.7, yaw: 0 });
  const [zoom, setZoom] = useState(1.2);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // -------------------------------------------------------------
  // MODE A: MAPBOX GL 3D GLOBE ENGINE (If token present)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!useMapbox || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 20.5937], // India Center
      zoom: 4.2,
      pitch: 55,
      bearing: -10,
      projection: 'globe',
    });

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(11, 24, 44)',
        'high-color': 'rgb(36, 92, 160)',
        'space-color': 'rgb(4, 8, 16)',
        'horizon-blend': 0.05,
      });

      // Add 3D AQI Markers for all cities
      INDIA_CITIES.forEach((city) => {
        const liveData = liveAQI[city.name];
        const aqi = liveData?.aqi || city.baseAqi;
        const color = getAQIColor(aqi);

        const el = document.createElement('div');
        el.className = 'mapbox-3d-pillar';
        el.style.width = '16px';
        el.style.height = `${Math.min(180, Math.max(30, aqi * 0.4))}px`;
        el.style.background = `linear-gradient(to top, ${color}33, ${color})`;
        el.style.borderRadius = '8px';
        el.style.border = `1.5px solid ${color}`;
        el.style.boxShadow = `0 0 16px ${color}`;
        el.style.cursor = 'pointer';

        el.addEventListener('click', () => {
          setSelectedCity(city);
          if (onSelectCity) onSelectCity(city.name);
        });

        new mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .addTo(map);
      });
    });

    mapInstanceRef.current = map;
    return () => map.remove();
  }, [useMapbox, liveAQI, onSelectCity]);

  // -------------------------------------------------------------
  // MODE B: ULTRA-DETAILED HIGH PERFORMANCE 3D CANVAS ENGINE
  // -------------------------------------------------------------
  const mapTo3D = useCallback((lat, lng, aqi = 100, width, height) => {
    const minLng = 67.0, maxLng = 97.5;
    const minLat = 7.5,  maxLat = 36.5;

    const normX = (lng - minLng) / (maxLng - minLng) - 0.5;
    const normY = (lat - minLat) / (maxLat - minLat) - 0.5; // Positive = North (Kashmir)

    const mapScale = Math.min(width, height) * 0.8 * zoom;
    const worldX = -normX * mapScale; // West on LEFT, East on RIGHT
    const worldY = normY * mapScale;  // Down to Up perspective projection
    const worldZ = (aqi / 500) * 190 * zoom;

    return { worldX, worldY, worldZ };
  }, [zoom]);

  const project3D = useCallback((worldX, worldY, worldZ, pitch, yaw, centerX, centerY) => {
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const x1 = worldX * cosY - worldY * sinY;
    const y1 = worldX * sinY + worldY * cosY;

    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const y2 = y1 * cosP - worldZ * sinP;
    const z2 = y1 * sinP + worldZ * cosP;

    const perspective = 900;
    const scale = perspective / (perspective + y2 + 250);

    const screenX = centerX + x1 * scale;
    const screenY = centerY + z2 * scale;

    return { screenX, screenY, scale, depth: y2 };
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((prev) => Math.max(0.5, Math.min(3.5, prev + zoomFactor)));
  };

  useEffect(() => {
    if (useMapbox) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [useMapbox]);

  useEffect(() => {
    if (useMapbox) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = canvas.parentElement.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement.clientHeight || 600);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement.clientWidth || 800;
      height = canvas.height = canvas.parentElement.clientHeight || 600;
    };
    window.addEventListener('resize', handleResize);

    let pulseTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      pulseTime += 0.04;

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw Atmospheric Space Glow Background
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, width * 0.6);
      bgGrad.addColorStop(0, '#0f243a');
      bgGrad.addColorStop(0.7, '#081220');
      bgGrad.addColorStop(1, '#03060a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw 3D India Geographic Outline Polygon & Landmass Base
      ctx.save();
      ctx.beginPath();
      INDIA_BORDER_GEO.forEach((pt, idx) => {
        const { worldX, worldY } = mapTo3D(pt.lat, pt.lng, 0, width, height);
        const proj = project3D(worldX, worldY, 0, rotation.pitch, rotation.yaw, centerX, centerY);
        if (idx === 0) ctx.moveTo(proj.screenX, proj.screenY);
        else ctx.lineTo(proj.screenX, proj.screenY);
      });
      ctx.closePath();

      // Landmass Gradient Fill
      const landGrad = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, width * 0.4);
      landGrad.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
      landGrad.addColorStop(0.8, 'rgba(10, 30, 55, 0.45)');
      landGrad.addColorStop(1, 'rgba(4, 12, 24, 0.6)');
      ctx.fillStyle = landGrad;
      ctx.fill();

      // Outer Glowing India Border Line
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 3. Draw 3D Grid Lat/Lng Mesh lines inside India map
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
      ctx.lineWidth = 1;
      const gridSteps = 12;
      const mapScale = Math.min(width, height) * 0.8 * zoom;
      const stepSize = mapScale / gridSteps;

      for (let i = -gridSteps / 2; i <= gridSteps / 2; i++) {
        const p1 = project3D(i * stepSize, (-gridSteps / 2) * stepSize, 0, rotation.pitch, rotation.yaw, centerX, centerY);
        const p2 = project3D(i * stepSize, (gridSteps / 2) * stepSize, 0, rotation.pitch, rotation.yaw, centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.stroke();

        const p3 = project3D((-gridSteps / 2) * stepSize, i * stepSize, 0, rotation.pitch, rotation.yaw, centerX, centerY);
        const p4 = project3D((gridSteps / 2) * stepSize, i * stepSize, 0, rotation.pitch, rotation.yaw, centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(p3.screenX, p3.screenY);
        ctx.lineTo(p4.screenX, p4.screenY);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Prepare 3D Pillars for Cities & Sort by Depth for Depth Sorting
      const renderedCities = INDIA_CITIES.map((city) => {
        const liveData = liveAQI[city.name];
        const aqi = liveData?.aqi || city.baseAqi;
        const color = getAQIColor(aqi);

        const { worldX, worldY, worldZ } = mapTo3D(city.lat, city.lng, aqi, width, height);

        const baseProj = project3D(worldX, worldY, 0, rotation.pitch, rotation.yaw, centerX, centerY);
        const topProj = project3D(worldX, worldY, worldZ, rotation.pitch, rotation.yaw, centerX, centerY);

        return {
          ...city,
          aqi,
          color,
          category: liveData?.category || getAQICategory(aqi),
          baseX: baseProj.screenX,
          baseY: baseProj.screenY,
          topX: topProj.screenX,
          topY: topProj.screenY,
          scale: topProj.scale,
          depth: topProj.depth,
        };
      }).sort((a, b) => b.depth - a.depth);

      // 5. Render Volumetric 3D Shaded Pillars
      renderedCities.forEach((city) => {
        const isHovered = hoveredCity?.name === city.name;
        const isSelected = selectedCity?.name === city.name;
        const radius = (isHovered || isSelected ? 9 : 5) * city.scale;

        // Ground reflection circle
        ctx.beginPath();
        ctx.ellipse(city.baseX, city.baseY, radius * 1.5, radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fillStyle = `${city.color}33`;
        ctx.fill();

        // Pulsing radar ring
        const ringPulse = (Math.sin(pulseTime * 2.5 + city.aqi) + 1) * 0.5;
        ctx.beginPath();
        ctx.ellipse(city.baseX, city.baseY, (radius * 1.5 + ringPulse * 16) * city.scale, (radius * 0.75 + ringPulse * 8) * city.scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${city.color}${Math.round((0.5 - ringPulse * 0.4) * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Volumetric 3D Cylinder Body Fill
        const colGrad = ctx.createLinearGradient(city.baseX, city.baseY, city.topX, city.topY);
        colGrad.addColorStop(0, `${city.color}33`);
        colGrad.addColorStop(0.5, city.color);
        colGrad.addColorStop(1, '#ffffff');

        // Draw pillar core beam
        ctx.beginPath();
        ctx.moveTo(city.baseX - radius, city.baseY);
        ctx.lineTo(city.topX - radius, city.topY);
        ctx.lineTo(city.topX + radius, city.topY);
        ctx.lineTo(city.baseX + radius, city.baseY);
        ctx.closePath();
        ctx.fillStyle = colGrad;
        ctx.fill();

        // Pillar glowing edges
        ctx.beginPath();
        ctx.moveTo(city.baseX, city.baseY);
        ctx.lineTo(city.topX, city.topY);
        ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : city.color;
        ctx.lineWidth = (isHovered || isSelected ? 6 : 3.5) * city.scale;
        ctx.shadowColor = city.color;
        ctx.shadowBlur = isHovered || isSelected ? 22 : 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Top Cap Ellipse
        ctx.beginPath();
        ctx.ellipse(city.topX, city.topY, radius, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = isHovered || isSelected ? '#ffffff' : city.color;
        ctx.shadowColor = city.color;
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // City & AQI Labels (for hovered/selected or major cities)
        if (isHovered || isSelected || ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Jaipur', 'Lucknow'].includes(city.name)) {
          ctx.font = `bold ${Math.round(11 * city.scale)}px Space Grotesk, sans-serif`;
          ctx.fillStyle = isHovered || isSelected ? '#00e5ff' : 'rgba(240, 246, 252, 0.9)';
          ctx.fillText(city.name, city.topX + radius + 6, city.topY + 3);

          ctx.font = `bold ${Math.round(10 * city.scale)}px JetBrains Mono, monospace`;
          ctx.fillStyle = city.color;
          ctx.fillText(`${city.aqi}`, city.topX + radius + 6, city.topY - 10);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMapbox, rotation, zoom, liveAQI, hoveredCity, selectedCity, mapTo3D, project3D]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (useMapbox) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;

      setRotation((prev) => ({
        yaw: prev.yaw + deltaX * 0.006,
        pitch: Math.max(0.25, Math.min(1.35, prev.pitch + deltaY * 0.006)),
      }));

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let found = null;
    for (const city of INDIA_CITIES) {
      const liveData = liveAQI[city.name];
      const aqi = liveData?.aqi || city.baseAqi;
      const { worldX, worldY, worldZ } = mapTo3D(city.lat, city.lng, aqi, width, height);
      const topProj = project3D(worldX, worldY, worldZ, rotation.pitch, rotation.yaw, centerX, centerY);

      const dx = mouseX - topProj.screenX;
      const dy = mouseY - topProj.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 22 * topProj.scale) {
        found = { ...city, aqi, category: liveData?.category || getAQICategory(aqi) };
        break;
      }
    }
    setHoveredCity(found);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (hoveredCity) {
      setSelectedCity(hoveredCity);
      if (onSelectCity) onSelectCity(hoveredCity.name);
    }
  };

  const activeCardCity = hoveredCity || selectedCity || INDIA_CITIES[0];
  const activeColor = getAQIColor(activeCardCity.aqi || activeCardCity.baseAqi);
  const cigsEquivalent = (Math.max(0, ((activeCardCity.aqi || 140) - 20) * 0.03)).toFixed(1);

  return (
    <div
      style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 40%, #0c1c30 0%, #05080f 85%)',
        cursor: isDraggingRef.current ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      {/* HUD Top Bar */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Compass size={16} color="var(--cyan-bright)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            INDIA 3D AIR QUALITY ATMOSPHERE
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Real Geographic Border · Scroll to Zoom · Drag Mouse to Orbit 360°
        </div>
      </div>

      {/* Orbit & Zoom Controls */}
      <div style={{
        position: 'absolute', top: 20, right: 24, zIndex: 10,
        display: 'flex', gap: 8, background: 'rgba(9,14,23,0.88)',
        border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 4,
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => { setRotation({ pitch: 0.6, yaw: 0 }); setZoom(1.25); }}
          title="Reset Orbit View"
          style={{
            padding: '6px 10px', borderRadius: 6, border: 'none',
            background: 'var(--bg-surface)', color: 'var(--cyan-bright)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          <RotateCw size={12} />
          <span>Reset</span>
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.25))}
          title="Zoom In"
          style={{
            padding: '6px 10px', borderRadius: 6, border: 'none',
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          <ZoomIn size={12} />
          <span>Zoom +</span>
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          title="Zoom Out"
          style={{
            padding: '6px 10px', borderRadius: 6, border: 'none',
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          <ZoomOut size={12} />
          <span>Zoom -</span>
        </button>
      </div>

      {/* RENDER ENGINE (Mapbox GL Container vs 3D Canvas) */}
      {useMapbox ? (
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      )}

      {/* Live City Node HUD Card */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24, zIndex: 20,
        width: 320, background: 'rgba(12, 20, 33, 0.94)',
        border: `1px solid ${activeColor}66`, borderRadius: 16,
        padding: '16px 20px', boxShadow: `0 20px 60px rgba(0,0,0,0.85), 0 0 30px ${activeColor}22`,
        backdropFilter: 'blur(20px)', animation: 'slide-up 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {activeCardCity.state || 'India Capital'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeCardCity.name}
            </div>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: activeColor,
            background: `${activeColor}20`, border: `1px solid ${activeColor}44`,
            borderRadius: 999, padding: '3px 10px',
          }}>
            {activeCardCity.category || getAQICategory(activeCardCity.aqi || 140)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 42, fontWeight: 700, color: activeColor, lineHeight: 1 }}>
            {activeCardCity.aqi || activeCardCity.baseAqi}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            AQI Column Height
          </div>
        </div>

        {/* Visceral Health Impact Meter */}
        <div style={{
          background: 'var(--bg-surface)', borderRadius: 10, padding: '10px 12px',
          borderLeft: `3px solid ${activeColor}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            🫁 8-Hour Outdoor Exposure Impact
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            Equivalent to smoking <span style={{ color: activeColor, fontWeight: 700 }}>{cigsEquivalent} cigarettes</span> today
          </div>
        </div>

        <button
          onClick={() => onSelectCity && onSelectCity(activeCardCity.name)}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 8,
            background: 'linear-gradient(135deg, #00e5ff 0%, #007a8c 100%)',
            border: 'none', color: '#030509', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 0 16px rgba(0,229,255,0.4)', transition: 'all 0.15s',
          }}
        >
          <Activity size={14} />
          <span>Switch Command Center to {activeCardCity.name}</span>
        </button>
      </div>

      {/* Legend Bar */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24, zIndex: 10,
        display: 'flex', gap: 14, background: 'rgba(9, 14, 23, 0.88)',
        border: '1px solid var(--border-subtle)', borderRadius: 10,
        padding: '8px 16px', backdropFilter: 'blur(12px)', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Good (0-50)', color: '#00e676' },
          { label: 'Satisfactory (51-100)', color: '#76ff03' },
          { label: 'Moderate (101-200)', color: '#ffea00' },
          { label: 'Poor (201-300)', color: '#ff6d00' },
          { label: 'Very Poor (301-400)', color: '#d50000' },
          { label: 'Severe (401+)', color: '#6a0080' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
