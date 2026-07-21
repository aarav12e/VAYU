import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Wind } from 'lucide-react';
import { getAQIColor } from '../utils/aqiUtils';
import AQIHeatmap from '../components/AQIHeatmap';
import AlertsTicker from '../components/AlertsTicker';
import ForecastSlider from '../components/ForecastSlider';
import SourceAttribution from '../components/SourceAttribution';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function CommandCenter({ city, liveAQI, alerts }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [wardReadings, setWardReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecastHours, setForecastHours] = useState(24);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, histRes, wardRes] = await Promise.all([
          axios.get(`${API}/api/aqi/stats/${city}`),
          axios.get(`${API}/api/aqi/history/${city}`),
          axios.get(`${API}/api/aqi/city/${city}`),
        ]);
        setStats(statsRes.data.data);
        setHistory(histRes.data.data || []);
        setWardReadings(wardRes.data.data || []);
      } catch (err) {
        console.error('Load error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const currentAQI = liveAQI[city]?.aqi || stats?.current || 150;
  const currentCategory = liveAQI[city]?.category || stats?.category || 'Moderate';
  const aqiColor = getAQIColor(currentAQI);

  // Format history for chart
  const chartData = history.slice(-48).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    aqi: r.aqi,
    fill: getAQIColor(r.aqi),
  }));

  // criticalAlerts available via: alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH')
  const activeWards = wardReadings.filter(w => w.aqi > 200);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* LEFT PANEL */}
      <div style={{
        width: 320, flexShrink: 0, background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* City AQI Hero */}
        <div style={{
          padding: '20px 20px 16px',
          background: `linear-gradient(135deg, ${aqiColor}18, transparent)`,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Current AQI — {city}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
            <div className="mono" style={{ fontSize: 64, fontWeight: 700, color: aqiColor, lineHeight: 1 }}>
              {currentAQI}
            </div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: aqiColor,
                background: `${aqiColor}22`, padding: '2px 10px',
                borderRadius: 999, border: `1px solid ${aqiColor}44`,
              }}>
                {currentCategory}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: '24h Avg', value: stats?.avg24h || '--' },
              { label: '24h Max', value: stats?.max24h || '--' },
              { label: 'Wards >200', value: activeWards.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward Readings */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Ward Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {wardReadings.slice(0, 6).map((ward) => {
              const color = getAQIColor(ward.aqi);
              const pct = Math.min(100, (ward.aqi / 400) * 100);
              return (
                <div key={ward.ward || ward.station}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ward.ward || ward.station}</span>
                    <span className="mono" style={{ fontSize: 12, color, fontWeight: 600 }}>{ward.aqi}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24h Trend Chart */}
        <div style={{ padding: '14px 20px', flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            24h AQI Trend
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={aqiColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={aqiColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={7} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  itemStyle={{ color: aqiColor }}
                />
                <Area type="monotone" dataKey="aqi" stroke={aqiColor} strokeWidth={2} fill="url(#aqiGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Loading trend data...
            </div>
          )}
        </div>

        {/* Source Attribution */}
        <SourceAttribution city={city} />
      </div>

      {/* CENTER: MAP */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AQIHeatmap city={city} forecastHours={forecastHours} />

        {/* Forecast Slider overlay */}
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <ForecastSlider city={city} value={forecastHours} onChange={setForecastHours} />
        </div>
      </div>

      {/* RIGHT PANEL: Alerts */}
      <div style={{
        width: 300, flexShrink: 0, background: 'var(--bg-deep)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <AlertsTicker alerts={alerts} city={city} />
      </div>

    </div>
  );
}
