import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TrendIcon = ({ trend }) => {
  if (trend === 'increasing') return <TrendingUp size={10} color="#ff6d00" />;
  if (trend === 'decreasing') return <TrendingDown size={10} color="#00e676" />;
  return <Minus size={10} color="#7ea8c0" />;
};

export default function SourceAttribution({ city }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/forecast/attribution/${city}`);
        setData(res.data.data || []);
      } catch (err) {
        console.error('Attribution error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-active)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12,
      }}>
        <div style={{ fontWeight: 600, color: item.color, marginBottom: 2 }}>{item.source}</div>
        <div style={{ color: 'var(--text-primary)' }}>{item.contribution}% contribution</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Confidence: {Math.round((item.confidence || 0.8) * 100)}%</div>
      </div>
    );
  };

  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Pollution Sources
      </div>
      {loading ? (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Attributing sources...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ResponsiveContainer width={80} height={80}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={38}
                dataKey="contribution"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.slice(0, 4).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.source}
                </span>
                <TrendIcon trend={item.trend} />
                <span className="mono" style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>
                  {item.contribution}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
