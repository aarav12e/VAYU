import React, { useState, useEffect } from 'react';
import { Clock, Wind, Droplets, Car, Leaf, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAQIColor } from '../utils/aqiUtils';
import api from '../services/api';

// Simulated meteorological + emission drivers per city
const CITY_DRIVERS = {
  Delhi:     { wind: 4.2, humidity: 58, trafficIndex: 82, seasonIndex: 74 },
  Mumbai:    { wind: 12.1, humidity: 78, trafficIndex: 71, seasonIndex: 52 },
  Bengaluru: { wind: 8.5, humidity: 65, trafficIndex: 68, seasonIndex: 40 },
  Chennai:   { wind: 10.2, humidity: 72, trafficIndex: 64, seasonIndex: 45 },
  Kolkata:   { wind: 6.3, humidity: 70, trafficIndex: 75, seasonIndex: 68 },
  _default:  { wind: 7.0, humidity: 62, trafficIndex: 65, seasonIndex: 55 },
};

function getInterventionLabel(aqi) {
  if (aqi > 300) return { label: 'Emergency Advisory', color: '#d50000', icon: '🚨', action: 'Ban outdoor activity & vehicle movement' };
  if (aqi > 200) return { label: 'Health Alert', color: '#ff6d00', icon: '⚠️', action: 'Issue public health advisory — avoid outdoors' };
  if (aqi > 100) return { label: 'Schedule Intervention', color: '#ffd600', icon: '📋', action: 'Deploy dust suppression & traffic management' };
  return { label: 'Clear Window', color: '#00e676', icon: '✅', action: 'Favourable window — defer heavy transport' };
}

export default function ForecastSlider({ city, value, onChange }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);

  const drivers = CITY_DRIVERS[city] || CITY_DRIVERS._default;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/forecast/${city}?hours=72`);
        const data = res.data.data || [];
        setForecasts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Forecast error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city]);

  const options = [
    { label: 'Now',  hours: 0,  tooltip: 'Current reading' },
    { label: '+24h', hours: 24, tooltip: '24-hour forecast' },
    { label: '+48h', hours: 48, tooltip: '48-hour forecast' },
    { label: '+72h', hours: 72, tooltip: '72-hour forecast' },
  ];

  const getForecastAQI = (hours) => {
    if (hours === 0) return null;
    if (forecasts.length > 0) {
      const match = forecasts.find((fc) => {
        const diff = (new Date(fc.forecastTime) - new Date()) / 3600000;
        return Math.abs(diff - hours) <= 6;
      });
      if (match?.predictedAQI) return match.predictedAQI;
      const idx = Math.min(forecasts.length - 1, Math.max(0, hours - 1));
      if (forecasts[idx]?.predictedAQI) return forecasts[idx].predictedAQI;
    }
    const baseAQIs = { Mumbai: 145, Delhi: 210, Kolkata: 168, Bengaluru: 95, Chennai: 112, Pune: 130 };
    const base = baseAQIs[city] || 150;
    const multipliers = { 24: 1.12, 48: 1.22, 72: 1.30 };
    return Math.round(base * (multipliers[hours] || 1.1));
  };

  const selectedAQI = getForecastAQI(value) || 150;
  const intervention = getInterventionLabel(selectedAQI);

  return (
    <div style={{
      background: 'rgba(9,14,23,0.95)', backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-active)', borderRadius: 14,
      padding: '10px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      minWidth: 0,
    }}>
      {/* Row 1: Label + Hour tabs + Spinner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <Clock size={13} color="var(--cyan-bright)" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            72h Forecast
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {options.map(({ label, hours }) => {
            const forecastAQI = getForecastAQI(hours);
            const isActive = value === hours;
            const color = forecastAQI ? getAQIColor(forecastAQI) : 'var(--cyan-bright)';
            return (
              <button
                key={hours}
                onClick={() => onChange(hours)}
                title={label}
                style={{
                  padding: '5px 12px', borderRadius: 7,
                  border: isActive ? `1px solid ${color}` : '1px solid var(--border-subtle)',
                  background: isActive ? `${color}22` : 'rgba(14,22,35,0.6)',
                  color: isActive ? color : 'var(--text-secondary)',
                  fontSize: 11, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 48,
                }}
              >
                <span>{label}</span>
                {hours > 0 && forecastAQI && (
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, color }}>{forecastAQI}</span>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,229,255,0.2)', borderTop: '2px solid #00e5ff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        )}

        {/* Toggle Drivers */}
        <button
          onClick={() => setShowDrivers(s => !s)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 9, color: 'var(--cyan-bright)', fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
          }}
        >
          {showDrivers ? 'Hide Drivers' : 'Show Drivers'}
        </button>
      </div>

      {/* Row 2: Intervention window */}
      {value > 0 && (
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 7,
          background: `${intervention.color}12`, border: `1px solid ${intervention.color}33`,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ fontSize: 13 }}>{intervention.icon}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: intervention.color }}>{intervention.label}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{intervention.action}</div>
          </div>
        </div>
      )}

      {/* Row 3: Meteorological drivers */}
      {showDrivers && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { icon: <Wind size={10} />, label: 'Wind', value: `${drivers.wind} km/h`, color: '#00e5ff', good: drivers.wind > 8 },
            { icon: <Droplets size={10} />, label: 'Humidity', value: `${drivers.humidity}%`, color: '#0ea5e9', good: drivers.humidity < 65 },
            { icon: <Car size={10} />, label: 'Traffic Idx', value: drivers.trafficIndex, color: '#ff6d00', good: drivers.trafficIndex < 60 },
            { icon: <Leaf size={10} />, label: 'Season Idx', value: drivers.seasonIndex, color: '#76ff03', good: drivers.seasonIndex < 55 },
          ].map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-surface)', borderRadius: 6, padding: '4px 8px',
              border: '1px solid var(--border-subtle)',
            }}>
              <span style={{ color: d.color }}>{d.icon}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.label}</span>
              <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: d.color }}>{d.value}</span>
              {d.good
                ? <CheckCircle size={8} color="#00e676" />
                : <AlertTriangle size={8} color="#ff6d00" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
