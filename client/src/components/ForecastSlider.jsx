import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock } from 'lucide-react';
import { getAQIColor } from '../utils/aqiUtils';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ForecastSlider({ city, value, onChange }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/forecast/${city}?hours=72`);
        setForecasts(res.data.data || []);
      } catch (err) {
        console.error('Forecast error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city]);

  const options = [
    { label: 'Now', hours: 0 },
    { label: '+24h', hours: 24 },
    { label: '+48h', hours: 48 },
    { label: '+72h', hours: 72 },
  ];

  const getForecastAQI = (hours) => {
    if (hours === 0) return null;
    const f = forecasts.find(fc => {
      const diff = (new Date(fc.forecastTime) - new Date()) / 3600000;
      return Math.abs(diff - hours) < 2;
    });
    return f?.predictedAQI || null;
  };

  return (
    <div style={{
      background: 'rgba(13, 21, 32, 0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-active)',
      borderRadius: 12,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <Clock size={13} color="var(--text-muted)" />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Forecast
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map(({ label, hours }) => {
          const forecastAQI = getForecastAQI(hours);
          const isActive = value === hours;
          const color = forecastAQI ? getAQIColor(forecastAQI) : 'var(--cyan-bright)';
          return (
            <button
              key={hours}
              onClick={() => onChange(hours)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: isActive ? `1px solid ${color}` : '1px solid var(--border-subtle)',
                background: isActive ? `${color}20` : 'transparent',
                color: isActive ? color : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span>{label}</span>
              {forecastAQI && (
                <span className="mono" style={{ fontSize: 10, color }}>
                  {forecastAQI}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {loading && (
        <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--cyan-dim)', borderTop: '2px solid var(--cyan-bright)', animation: 'spin 0.8s linear infinite' }} />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
