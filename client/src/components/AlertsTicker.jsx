import React, { useState } from 'react';
import { AlertTriangle, Zap, Info, Bell, CheckCircle } from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#d50000', bg: 'rgba(213,0,0,0.1)', border: 'rgba(213,0,0,0.25)', icon: Zap, label: 'CRITICAL' },
  HIGH:     { color: '#ff6d00', bg: 'rgba(255,109,0,0.1)', border: 'rgba(255,109,0,0.25)', icon: AlertTriangle, label: 'HIGH' },
  MEDIUM:   { color: '#ffd600', bg: 'rgba(255,214,0,0.1)', border: 'rgba(255,214,0,0.2)', icon: Bell, label: 'MEDIUM' },
  LOW:      { color: '#00e676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', icon: Info, label: 'LOW' },
};

const TYPE_LABELS = {
  SPIKE_DETECTED: 'AQI Spike',
  FORECAST_WARNING: 'Forecast Alert',
  ENFORCEMENT_ALERT: 'Enforcement',
  HEALTH_ADVISORY: 'Health Advisory',
  SOURCE_IDENTIFIED: 'Source Found',
};

function AlertCard({ alert, onDismiss }) {
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.MEDIUM;
  const Icon = config.icon;
  const timeAgo = getTimeAgo(alert.timestamp);

  return (
    <div
      className="animate-slide-up"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 8,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${config.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={13} color={config.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: config.color,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {config.label}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {timeAgo}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.3 }}>
            {alert.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {alert.message?.substring(0, 100)}{alert.message?.length > 100 ? '...' : ''}
          </div>
          {alert.aqi && (
            <div style={{ marginTop: 5, display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>AQI:</span>
              <span className="mono" style={{ fontSize: 10, color: config.color, fontWeight: 700 }}>
                {alert.aqi}
              </span>
            </div>
          )}
          {alert.messageHindi && (
            <div style={{
              marginTop: 6, fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--bg-surface)', borderRadius: 5, padding: '4px 8px',
              lineHeight: 1.4,
            }}>
              {alert.messageHindi?.substring(0, 80)}{alert.messageHindi?.length > 80 ? '...' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function AlertsTicker({ alerts, city }) {
  const [filter, setFilter] = useState('ALL');

  const filters = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];
  const filtered = filter === 'ALL'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  // Generate demo alerts if none
  const displayAlerts = filtered.length > 0 ? filtered : DEMO_ALERTS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={13} color="var(--cyan-bright)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Live Alerts
            </span>
          </div>
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
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {filters.map(f => {
            const cfg = SEVERITY_CONFIG[f] || { color: 'var(--cyan-bright)', bg: 'var(--cyan-glow)' };
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '3px 8px', borderRadius: 5,
                  border: isActive ? `1px solid ${f === 'ALL' ? 'var(--border-active)' : cfg.border}` : '1px solid transparent',
                  background: isActive ? (f === 'ALL' ? 'var(--cyan-glow)' : cfg.bg) : 'transparent',
                  color: isActive ? (f === 'ALL' ? 'var(--cyan-bright)' : cfg.color) : 'var(--text-muted)',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  letterSpacing: '0.04em',
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 12px' }}>
        {displayAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle size={28} color="var(--aqi-good)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No active alerts</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Air quality is being monitored</div>
          </div>
        ) : (
          displayAlerts.map((alert, i) => (
            <AlertCard key={alert._id || i} alert={alert} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--aqi-good)', animation: 'pulse-dot 2s infinite' }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Live monitoring • Updates every 15 min
        </span>
      </div>
    </div>
  );
}

const DEMO_ALERTS = [
  {
    _id: 'demo1',
    severity: 'CRITICAL',
    type: 'SPIKE_DETECTED',
    title: 'Severe AQI Spike — Dharavi',
    message: 'AQI has reached 312 at Dharavi CAAQMS. PM2.5 at 3.2x safe limit. Immediate enforcement action recommended.',
    messageHindi: 'धारावी में AQI 312 पहुंचा। तत्काल कार्रवाई आवश्यक है।',
    aqi: 312,
    timestamp: new Date(Date.now() - 8 * 60000),
  },
  {
    _id: 'demo2',
    severity: 'HIGH',
    type: 'FORECAST_WARNING',
    title: 'Forecast: AQI >250 in Andheri by 6PM',
    message: 'AI model predicts AQI will cross 250 threshold in Andheri West within 4 hours based on wind direction and traffic patterns.',
    aqi: 251,
    timestamp: new Date(Date.now() - 22 * 60000),
  },
  {
    _id: 'demo3',
    severity: 'HIGH',
    type: 'SOURCE_IDENTIFIED',
    title: 'Construction Dust Source — Kurla',
    message: 'AI attribution engine identified 3 construction sites responsible for 34% of local PM10 elevation in Kurla ward.',
    aqi: 228,
    timestamp: new Date(Date.now() - 45 * 60000),
  },
  {
    _id: 'demo4',
    severity: 'MEDIUM',
    type: 'ENFORCEMENT_ALERT',
    title: 'Waste Burning Detected — Malad',
    message: 'Thermal anomaly and CO spike correlated with waste burning activity near Malad depot. Enforcement team dispatched.',
    aqi: 189,
    timestamp: new Date(Date.now() - 90 * 60000),
  },
  {
    _id: 'demo5',
    severity: 'MEDIUM',
    type: 'HEALTH_ADVISORY',
    title: 'Health Advisory — Worli, Powai',
    message: 'AQI above 200 in Worli and Powai wards. Children and elderly advised to stay indoors. Outdoor events should be rescheduled.',
    messageHindi: 'वर्ली और पवई में AQI 200 से ऊपर। बच्चे और बुजुर्ग घर के अंदर रहें।',
    aqi: 203,
    timestamp: new Date(Date.now() - 120 * 60000),
  },
];
