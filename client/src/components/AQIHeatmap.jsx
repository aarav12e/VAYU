import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getAQIColor, getAQICategory } from '../utils/aqiUtils';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// City center coordinates
const CITY_CENTERS = {
  Mumbai: { center: [72.8777, 19.076], zoom: 11 },
  Delhi: { center: [77.209, 28.6139], zoom: 11 },
  Kolkata: { center: [88.3639, 22.5726], zoom: 11 },
  Bengaluru: { center: [77.5946, 12.9716], zoom: 11 },
  Chennai: { center: [80.2707, 13.0827], zoom: 11 },
  Pune: { center: [73.8567, 18.5204], zoom: 11 },
};

export default function AQIHeatmap({ city, forecastHours }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [geojson, setGeojson] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxAvailable, setMapboxAvailable] = useState(!!MAPBOX_TOKEN);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/aqi/heatmap/${city}`);
        setGeojson(res.data.data);
      } catch (err) {
        console.error('Heatmap data error:', err.message);
      }
    };
    load();
  }, [city, forecastHours]);

  // Try to load Mapbox
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || mapRef.current) return;

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

        map.on('load', () => {
          setMapLoaded(true);
          mapRef.current = map;
        });
      } catch (err) {
        console.error('Mapbox load error:', err);
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

      // Heatmap layer
      map.addLayer({
        id: 'aqi-heatmap',
        type: 'heatmap',
        source: 'aqi-points',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'aqi'], 0, 0, 500, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 12, 40],
          'heatmap-opacity': 0.7,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0, 230, 118, 0)',
            0.2, 'rgba(118, 255, 3, 0.6)',
            0.4, 'rgba(255, 234, 0, 0.7)',
            0.6, 'rgba(255, 109, 0, 0.8)',
            0.8, 'rgba(213, 0, 0, 0.9)',
            1, 'rgba(106, 0, 128, 1)',
          ],
        },
      });

      // Circle layer for individual stations
      map.addLayer({
        id: 'aqi-circles',
        type: 'circle',
        source: 'aqi-points',
        minzoom: 10,
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'interpolate', ['linear'], ['get', 'aqi'],
            0, '#00e676', 100, '#76ff03', 200, '#ffea00', 300, '#ff6d00', 400, '#d50000', 500, '#6a0080',
          ],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
      });

      // Popups
      const { default: mapboxgl } = require('mapbox-gl');
      map.on('click', 'aqi-circles', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup({ closeButton: false, maxWidth: '240px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: Space Grotesk, sans-serif;">
              <div style="font-weight:700; font-size:14px; margin-bottom:6px; color:#e8f4f8;">${props.ward || props.station}</div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:28px; font-weight:700; font-family:JetBrains Mono,monospace; color:${getAQIColor(props.aqi)}">${props.aqi}</span>
                <span style="font-size:12px; color:${getAQIColor(props.aqi)}; background:${getAQIColor(props.aqi)}22; padding:2px 8px; border-radius:999px;">${getAQICategory(props.aqi)}</span>
              </div>
              ${props.pm25 ? `<div style="font-size:11px; color:#7ea8c0;">PM2.5: ${Math.round(props.pm25)} µg/m³</div>` : ''}
              <div style="font-size:10px; color:#3d6070; margin-top:4px;">${new Date(props.timestamp).toLocaleTimeString('en-IN')}</div>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'aqi-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'aqi-circles', () => { map.getCanvas().style.cursor = ''; });
    }
  }, [geojson, mapLoaded]);

  // Fly to new city
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const config = CITY_CENTERS[city] || CITY_CENTERS.Mumbai;
    map.flyTo({ center: config.center, zoom: config.zoom, duration: 1500, essential: true });
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
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--cyan-dim)',
            borderTop: '3px solid var(--cyan-bright)',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading map...</div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// SVG fallback map when Mapbox token not configured
function FallbackMap({ city, geojson }) {
  const features = geojson?.features || [];

  return (
    <div style={{
      width: '100%', height: '100%', background: 'var(--bg-surface)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--cyan-bright)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontSize: 48, fontWeight: 700, color: 'var(--cyan-bright)',
          fontFamily: 'JetBrains Mono', marginBottom: 8,
        }}>
          🗺️
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          AQI Map — {city}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.6, marginBottom: 20 }}>
          Add your Mapbox token in <code style={{ color: 'var(--cyan-bright)', fontSize: 11 }}>client/.env</code> for the interactive heatmap
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 400 }}>
          {features.slice(0, 8).map((f, i) => {
            const { aqi, ward } = f.properties;
            const color = getAQIColor(aqi);
            return (
              <div key={i} style={{
                background: `${color}22`, border: `1px solid ${color}44`,
                borderRadius: 8, padding: '8px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{ward}</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 700, color }}>{aqi}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
