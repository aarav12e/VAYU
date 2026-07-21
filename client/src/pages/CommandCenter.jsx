import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { getAQIColor } from '../utils/aqiUtils';
import AQIHeatmap from '../components/AQIHeatmap';
import AlertsTicker from '../components/AlertsTicker';
import ForecastSlider from '../components/ForecastSlider';
import SourceAttribution from '../components/SourceAttribution';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function CommandCenter({ city, liveAQI, alerts }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [wardReadings, setWardReadings] = useState([]);
  const [forecastHours, setForecastHours] = useState(24);

  // Reset state when city changes
  useEffect(() => {
    setStats(null);
    setHistory([]);
    setWardReadings([]);
  }, [city]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, histRes, wardRes] = await Promise.all([
          axios.get(`${API}/api/aqi/stats/${city}`),
          axios.get(`${API}/api/aqi/history/${city}`),
          axios.get(`${API}/api/aqi/city/${city}`),
        ]);
        setStats(statsRes.data.data);
        setHistory(histRes.data.data || []);
        const raw = wardRes.data.data;
        setWardReadings(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error('Load error:', err.message);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const currentAQI = liveAQI[city]?.aqi || stats?.current || 150;
  const currentCategory = liveAQI[city]?.category || stats?.category || 'Moderate';
  const aqiColor = getAQIColor(currentAQI);

  const chartData = history.slice(-48).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    aqi: r.aqi,
  }));

  // For non-Mumbai cities, show city-level reading as single "station"
  const displayReadings = wardReadings.length > 0 ? wardReadings : (
    currentAQI ? [{ ward: city, station: `${city} Central`, aqi: currentAQI, category: currentCategory }] : []
  );

  const activeWards = wardReadings.filter(w => w.aqi > 200).length;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* LEFT PANEL */}
      <div style={{
        width: 300, flexShrink: 0, background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* City AQI Hero */}
        <div style={{
          padding: '20px 20px 16px',
          background: `linear-gradient(135deg, ${aqiColor}15 0%, transparent 60%)`,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Current AQI — <span style={{ color: 'var(--cyan-bright)' }}>{city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
            <div className="mono" style={{
              fontSize: 72, fontWeight: 700, color: aqiColor,
              lineHeight: 1, textShadow: `0 0 40px ${aqiColor}60`,
            }}>
              {currentAQI}
            </div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: aqiColor,
                background: `${aqiColor}20`, padding: '3px 10px',
                borderRadius: 999, border: `1px solid ${aqiColor}40`,
              }}>
                {currentCategory}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: '24h Avg', value: stats?.avg24h || '--' },
              { label: '24h Max', value: stats?.max24h || '--' },
              { label: 'Alerts', value: activeWards || alerts?.filter(a => a.city === city).length || 0 },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward / Station Breakdown */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {wardReadings.length > 1 ? 'Ward Breakdown' : 'Station Data'} — {city}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayReadings.slice(0, 7).map((ward, i) => {
              const color = getAQIColor(ward.aqi);
              const pct = Math.min(100, (ward.aqi / 400) * 100);
              const label = ward.ward && ward.ward !== city ? ward.ward : ward.station;
              return (
                <div key={ward.ward || ward.station || i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {label}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color, fontWeight: 600 }}>{ward.aqi}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: `linear-gradient(90deg, ${color}90, ${color})`,
                      borderRadius: 2, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24h Trend Chart */}
        <div style={{ padding: '14px 20px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            24h AQI Trend
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id={`aqiGrad-${city}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={aqiColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={aqiColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={7} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12, padding: '6px 10px' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: aqiColor }}
                />
                <Area type="monotone" dataKey="aqi" stroke={aqiColor} strokeWidth={2} fill={`url(#aqiGrad-${city})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Collecting trend data...</div>
            </div>
          )}
        </div>

        {/* Source Attribution */}
        <SourceAttribution city={city} />
      </div>

      {/* CENTER: MAP */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AQIHeatmap city={city} forecastHours={forecastHours} />
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <ForecastSlider city={city} value={forecastHours} onChange={setForecastHours} />
        </div>
      </div>

      {/* RIGHT PANEL: Alerts */}
      <div style={{
        width: 290, flexShrink: 0, background: 'var(--bg-deep)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <AlertsTicker alerts={alerts} city={city} />
      </div>

    </div>
  );
}
