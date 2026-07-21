import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, MapPin, ChevronRight, CheckCircle, Truck } from 'lucide-react';
import { getAQIColor } from '../utils/aqiUtils';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SITE_TYPE_CONFIG = {
  CONSTRUCTION: { label: 'Construction', color: '#FFA07A', emoji: '🏗️' },
  INDUSTRY: { label: 'Industry', color: '#FFD700', emoji: '🏭' },
  WASTE_BURNING: { label: 'Waste Burning', color: '#FF6B6B', emoji: '🔥' },
  DIESEL_FLEET: { label: 'Diesel Fleet', color: '#87CEEB', emoji: '🚛' },
  TRAFFIC_HOTSPOT: { label: 'Traffic', color: '#DDA0DD', emoji: '🚦' },
};

const STATUS_CONFIG = {
  PENDING: { color: '#ffd600', label: 'Pending', bg: 'rgba(255,214,0,0.1)' },
  DISPATCHED: { color: '#00b4cc', label: 'Dispatched', bg: 'rgba(0,180,204,0.1)' },
  INSPECTED: { color: '#76ff03', label: 'Inspected', bg: 'rgba(118,255,3,0.1)' },
  RESOLVED: { color: '#00e676', label: 'Resolved', bg: 'rgba(0,230,118,0.1)' },
};

function PriorityMeter({ score }) {
  const color = score >= 85 ? '#d50000' : score >= 70 ? '#ff6d00' : score >= 50 ? '#ffd600' : '#00e676';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-surface)', borderRadius: 3 }}>
        <div style={{
          width: `${score}%`, height: '100%', background: color,
          borderRadius: 3, transition: 'width 0.6s ease',
          boxShadow: `0 0 6px ${color}88`,
        }} />
      </div>
      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
    </div>
  );
}

function EnforcementCard({ site, onStatusChange, rank }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const typeConfig = SITE_TYPE_CONFIG[site.siteType] || SITE_TYPE_CONFIG.INDUSTRY;
  const statusConfig = STATUS_CONFIG[site.status] || STATUS_CONFIG.PENDING;
  const aqiColor = getAQIColor(site.nearbyAQI);

  const handleDispatch = async () => {
    setUpdating(true);
    try {
      await axios.patch(`${API}/api/enforcement/${site._id}/status`, { status: 'DISPATCHED' });
      onStatusChange(site._id, 'DISPATCHED');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${site.priorityScore >= 85 ? 'rgba(213,0,0,0.25)' : 'var(--border-subtle)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Card Header */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: rank <= 2 ? 'rgba(213,0,0,0.15)' : 'var(--bg-surface)',
          border: rank <= 2 ? '1px solid rgba(213,0,0,0.3)' : '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          color: rank <= 2 ? '#ff5252' : 'var(--text-muted)',
          flexShrink: 0,
        }}>
          #{rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {site.siteName}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 999,
              background: `${typeConfig.color}22`, color: typeConfig.color,
              border: `1px solid ${typeConfig.color}44`, fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {typeConfig.emoji} {typeConfig.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            <MapPin size={9} style={{ display: 'inline', marginRight: 3 }} />
            {site.address}
          </div>
          <PriorityMeter score={site.priorityScore} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 999,
            background: statusConfig.bg, color: statusConfig.color,
          }}>
            {statusConfig.label}
          </div>
          {site.nearbyAQI && (
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: aqiColor }}>
              {site.nearbyAQI}
            </div>
          )}
          <ChevronRight
            size={14}
            color="var(--text-muted)"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}
          className="animate-fade-in">

          {/* AI Reasoning */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--cyan-bright)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              🤖 AI Analysis
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
              background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 10px',
              borderLeft: '2px solid var(--cyan-dim)',
            }}>
              {site.aiReasoning}
            </div>
          </div>

          {/* Recommended Action */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#ffd600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              📋 Recommended Action
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {site.recommendedAction}
            </div>
          </div>

          {/* Evidence Data */}
          {site.evidenceData && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {site.evidenceData.timeOfPeak && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '6px 10px', flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>PEAK TIME</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{site.evidenceData.timeOfPeak}</div>
                </div>
              )}
              {site.evidenceData.windDirection && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '6px 10px', flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>WIND DIR</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{site.evidenceData.windDirection}</div>
                </div>
              )}
              {site.estimatedContribution && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '6px 10px', flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>AQI IMPACT</div>
                  <div className="mono" style={{ fontSize: 12, color: '#ff6d00' }}>~{site.estimatedContribution}%</div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {site.status === 'PENDING' && (
            <button
              onClick={handleDispatch}
              disabled={updating}
              style={{
                width: '100%', padding: '9px 16px', borderRadius: 8,
                background: 'linear-gradient(135deg, #00b4cc, #007a8c)',
                border: 'none', color: 'var(--bg-void)', fontSize: 12, fontWeight: 700,
                cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1,
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Truck size={13} />
              {updating ? 'Dispatching...' : 'Dispatch Inspection Team'}
            </button>
          )}
          {site.status === 'DISPATCHED' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              background: 'rgba(0,180,204,0.1)', border: '1px solid rgba(0,180,204,0.3)',
              color: '#00b4cc', fontSize: 12, fontWeight: 600,
            }}>
              <Truck size={13} />
              Team Dispatched
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Enforcement({ city }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/enforcement/recommendations/${city}`);
        setSites(res.data.data || []);
      } catch (err) {
        console.error('Enforcement error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city]);

  const handleStatusChange = (id, newStatus) => {
    setSites(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
  };

  const siteTypes = ['ALL', 'CONSTRUCTION', 'INDUSTRY', 'WASTE_BURNING', 'DIESEL_FLEET'];
  const filtered = filter === 'ALL' ? sites : sites.filter(s => s.siteType === filter);

  const pendingCount = sites.filter(s => s.status === 'PENDING').length;
  const dispatchedCount = sites.filter(s => s.status === 'DISPATCHED').length;
  const totalContribution = sites.reduce((sum, s) => sum + (s.estimatedContribution || 0), 0);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* LEFT: Stats + List */}
      <div style={{
        width: 420, flexShrink: 0,
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldAlert size={16} color="var(--cyan-bright)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Enforcement Intelligence
            </span>
          </div>
          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Sites Ranked', value: sites.length, color: 'var(--cyan-bright)' },
              { label: 'Pending', value: pendingCount, color: '#ffd600' },
              { label: 'Dispatched', value: dispatchedCount, color: '#00b4cc' },
              { label: 'AQI Impact', value: `~${Math.round(totalContribution)}%`, color: '#ff6d00' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1, background: 'var(--bg-surface)', borderRadius: 8,
                padding: '8px', textAlign: 'center',
              }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Type Filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {siteTypes.map(type => {
              const cfg = SITE_TYPE_CONFIG[type];
              const isActive = filter === type;
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    border: isActive
                      ? `1px solid ${cfg?.color || 'var(--border-active)'}`
                      : '1px solid var(--border-subtle)',
                    background: isActive
                      ? `${cfg?.color || 'var(--cyan-bright)'}22`
                      : 'transparent',
                    color: isActive ? (cfg?.color || 'var(--cyan-bright)') : 'var(--text-muted)',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}
                >
                  {cfg ? `${cfg.emoji} ${cfg.label}` : 'All Sites'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Site List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ marginBottom: 10 }}>🤖 AI analyzing violation sites...</div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--cyan-dim)', borderTop: '2px solid var(--cyan-bright)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={28} color="var(--aqi-good)" style={{ marginBottom: 8 }} />
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No violation sites found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((site, i) => (
                <EnforcementCard
                  key={site._id || i}
                  site={site}
                  rank={i + 1}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Map + Summary */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Summary Banner */}
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(213,0,0,0.08), transparent)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--cyan-bright)', fontWeight: 600 }}>AI Enforcement Engine</span>
            {' '}has ranked <span style={{ color: '#ffd600', fontWeight: 600 }}>{sites.length} violation sites</span> in {city} by pollution impact score.
            Estimated combined contribution to current AQI: <span style={{ color: '#ff6d00', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>~{Math.round(totalContribution)}%</span>.
            Priority sites identified using satellite thermal data, sensor correlation, and permit violation history.
          </div>
        </div>

        {/* Enforcement Map placeholder */}
        <div style={{ flex: 1, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.04 }}>
            <defs>
              <pattern id="enfGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--cyan-bright)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#enfGrid)" />
          </svg>

          <div style={{ zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Enforcement Heatmap — {city}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6, marginBottom: 20 }}>
              Add Mapbox token to see violation sites plotted on the live city map with AI reasoning overlays
            </div>
            {/* Enforcement site pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
              {sites.slice(0, 5).map((site, i) => {
                const cfg = SITE_TYPE_CONFIG[site.siteType] || SITE_TYPE_CONFIG.INDUSTRY;
                return (
                  <div key={i} style={{
                    background: `${cfg.color}15`, border: `1px solid ${cfg.color}44`,
                    borderRadius: 10, padding: '10px 14px', textAlign: 'left', minWidth: 160,
                  }}>
                    <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700, marginBottom: 3 }}>
                      {cfg.emoji} #{i + 1} — {cfg.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>{site.siteName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{site.ward}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <span className="mono" style={{ fontSize: 11, color: '#ff6d00' }}>Score: {site.priorityScore}</span>
                      <span className="mono" style={{ fontSize: 11, color: getAQIColor(site.nearbyAQI) }}>AQI: {site.nearbyAQI}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
