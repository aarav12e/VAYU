import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Detect placeholder/demo tokens that will never work
const isValidMapboxToken = (token) =>
  token &&
  token.startsWith('pk.') &&
  !token.includes('demo') &&
  token.length > 80;

const CITY_CENTERS = {
  Mumbai:    { center: [72.8777, 19.076],  zoom: 11 },
  Delhi:     { center: [77.209,  28.6139], zoom: 11 },
  Kolkata:   { center: [88.3639, 22.5726], zoom: 11 },
  Bengaluru: { center: [77.5946, 12.9716], zoom: 11 },
  Chennai:   { center: [80.2707, 13.0827], zoom: 11 },
  Pune:      { center: [73.8567, 18.5204], zoom: 11 },
};

export default function AQIHeatmap({ city, forecastHours }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [geojson, setGeojson] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxAvailable, setMapboxAvailable] = useState(isValidMapboxToken(MAPBOX_TOKEN));

  useEffect(() => {
    axios.get(`${API}/api/aqi/heatmap/${city}`)
      .then((res) => setGeojson(res.data.data))
      .catch(() => {});
  }, [city, forecastHours]);

  // Try to load Mapbox only if token looks real
  useEffect(() => {
    if (!isValidMapboxToken(MAPBOX_TOKEN) || !mapContainer.current || mapRef.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
        mapboxgl.default.accessToken = MAPBOX_TOKEN;
        const cityConfig = CITY_CENTERS[city] || CITY_CENTERS.Mumbai;

        const map = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: cityConfig.center,
          zoom: cityConfig.zoom,
        });

        map.on('load', () => { setMapLoaded(true); mapRef.current = map; });
      } catch (err) {
        setMapboxAvailable(false);
      }
    };
    initMap();
  }, [city]);

  // Update heatmap data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !geojson) return;
    if (map.getSource('aqi-points')) {
      map.getSource('aqi-points').setData(geojson);
    } else {
      map.addSource('aqi-points', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'aqi-heatmap', type: 'heatmap', source: 'aqi-points',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'aqi'], 0, 0, 500, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 12, 40],
          'heatmap-opacity': 0.7,
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,230,118,0)', 0.2, 'rgba(118,255,3,0.6)',
            0.4, 'rgba(255,234,0,0.7)', 0.6, 'rgba(255,109,0,0.8)',
            0.8, 'rgba(213,0,0,0.9)', 1, 'rgba(106,0,128,1)'],
        },
      });
      map.addLayer({
        id: 'aqi-circles', type: 'circle', source: 'aqi-points', minzoom: 10,
        paint: {
          'circle-radius': 10,
          'circle-color': ['interpolate', ['linear'], ['get', 'aqi'],
            0, '#00e676', 100, '#76ff03', 200, '#ffea00', 300, '#ff6d00', 400, '#d50000', 500, '#6a0080'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
      });
    }
  }, [geojson, mapLoaded]);

  // Fly to new city
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const config = CITY_CENTERS[city] || CITY_CENTERS.Mumbai;
    map.flyTo({ center: config.center, zoom: config.zoom, duration: 1500 });
  }, [city, mapLoaded]);

  if (!mapboxAvailable) {
    return <FallbackMap city={city} geojson={geojson} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {!mapLoaded && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-surface)', gap: 12,
        }}>
          <div className="spinner" />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading map...</div>
        </div>
      )}
    </div>
  );
}

function FallbackMap({ city, geojson }) {
  const features = geojson?.features || [];
  const [selected, setSelected] = useState(null);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 30% 40%, #0d2035 0%, #080c12 70%)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#00e5ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glowing orbs */}
      <div style={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%', top: '10%', left: '20%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200,
        borderRadius: '50%', bottom: '20%', right: '15%',
        background: 'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, zIndex: 1,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Air Quality Map
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {city} <span style={{ color: 'var(--cyan-bright)' }}>Ward Overview</span>
          </div>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--cyan-dim)', background: 'var(--cyan-glow)',
          border: '1px solid var(--border-active)', borderRadius: 6, padding: '4px 10px',
        }}>
          {features.length} stations
        </div>
      </div>

      {/* Ward grid */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '20px 28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12, alignContent: 'start', zIndex: 1,
      }}>
        {features.length === 0 ? (
          <div style={{
            gridColumn: '1/-1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 0',
          }}>
            <div style={{ fontSize: 40 }}>🌫️</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading station data for {city}...</div>
          </div>
        ) : (
          features.map((f, i) => {
            const { aqi, ward, station, pm25 } = f.properties;
            const color = getAQIColor(aqi);
            const isSelected = selected === i;
            return (
              <div
                key={i}
                onClick={() => setSelected(isSelected ? null : i)}
                style={{
                  background: isSelected ? `${color}18` : 'rgba(13,21,32,0.8)',
                  border: `1px solid ${isSelected ? color : 'rgba(0,229,255,0.1)'}`,
                  borderRadius: 12, padding: '14px 16px',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = `${color}60`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ward || station}
                </div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>
                  {aqi}
                </div>
                <div style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 600,
                  color, background: `${color}18`,
                  border: `1px solid ${color}30`, borderRadius: 999,
                  padding: '1px 8px', marginBottom: isSelected ? 8 : 0,
                }}>
                  {getAQICategory(aqi)}
                </div>
                {isSelected && pm25 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    PM2.5: <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{Math.round(pm25)} µg/m³</span>
                  </div>
                )}
                {/* AQI bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginTop: 10 }}>
                  <div style={{
                    width: `${Math.min(100, (aqi / 400) * 100)}%`,
                    height: '100%', background: color, borderRadius: 1,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px 28px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: 16, flexShrink: 0, zIndex: 1,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Good', color: '#00e676', range: '0–50' },
          { label: 'Satisfactory', color: '#76ff03', range: '51–100' },
          { label: 'Moderate', color: '#ffea00', range: '101–200' },
          { label: 'Poor', color: '#ff6d00', range: '201–300' },
          { label: 'Very Poor', color: '#d50000', range: '301–400' },
          { label: 'Severe', color: '#6a0080', range: '401+' },
        ].map(({ label, color, range }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>({range})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
