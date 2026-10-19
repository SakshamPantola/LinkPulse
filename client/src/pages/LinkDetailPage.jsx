
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import api from '../lib/api';

const COLORS = ['#6366f1', '#818cf8', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#f97316'];

const statusColors = {
  active:   { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
  disabled: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
  expired:  { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
};

function getDisplayStatus(link) {
  if (link.status === 'disabled') return 'disabled';
  if (link.expires_at && new Date(link.expires_at) < new Date()) return 'expired';
  return 'active';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#121216', border: '1px solid #27272a', borderRadius: 8,
      padding: '0.6rem 0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,.6)',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600, fontSize: '0.85rem' }}>
          {p.value} {p.name}
        </div>
      ))}
    </div>
  );
}

export default function LinkDetailPage() {
  const { id } = useParams();
  const [link, setLink] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('area'); 

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includeBots, setIncludeBots] = useState(false);

  const shortBase = import.meta.env.DEV
    ? 'http://localhost:3001'
    : `${window.location.protocol}//${window.location.host}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (includeBots) params.set('include_bots', 'true');

      const [linkRes, analyticsRes] = await Promise.all([
        api.get(`/api/links/${id}`),
        api.get(`/api/links/${id}/analytics?${params}`),
      ]);
      setLink(linkRes.link);
      setAnalytics(analyticsRes.analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, from, to, includeBots]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-muted" style={{ padding: '2rem' }}>Loading analytics…</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!link || !analytics) return null;

  const displayStatus = getDisplayStatus(link);
  const s = statusColors[displayStatus];
  const qrClicks = analytics.sourceSplit?.find(src => src.source === 'qr')?.clicks || 0;

  return (
    <div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to="/links" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            ← Back to Links
          </Link>
          <h1 style={{ marginTop: '0.5rem' }}>Link Analytics</h1>
          <p>Detailed performance data</p>
        </div>
      </div>

      <div className="card fade-in" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <a
                href={`${shortBase}/${link.short_code}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent)', fontSize: '1.1rem', fontWeight: 600 }}
              >
                {shortBase}/{link.short_code}
              </a>
              <span style={{
                display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '6px',
                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.04em', background: s.bg, color: s.color,
                border: `1px solid ${s.border}`,
              }}>
                {displayStatus}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              → {link.destination_url}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
              Created {new Date(link.created_at).toLocaleDateString()}
              {link.campaign_name && <span> · Campaign: <strong>{link.campaign_name}</strong></span>}
              {link.click_limit && <span> · Limit: {link.click_count ?? 0}/{link.click_limit}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card fade-in" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeBots}
            onChange={e => setIncludeBots(e.target.checked)}
            style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
          />
          Include bots
        </label>
        {(from || to) && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            onClick={() => { setFrom(''); setTo(''); }}
          >
            Clear dates
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <StatCard label="Total Clicks" value={analytics.totalClicks} color="var(--color-primary)" />
        <StatCard label="Unique Visitors" value={analytics.uniqueVisitors} color="#ffffff" />
        <StatCard label="QR Scans" value={qrClicks} color="var(--color-warning)" />
        <StatCard
          label="Click Rate"
          value={analytics.totalClicks > 0 && analytics.uniqueVisitors > 0
            ? `${(analytics.totalClicks / analytics.uniqueVisitors).toFixed(1)}x`
            : '—'}
          color="var(--color-success)"
        />
      </div>

      {analytics.clicksOverTime.length > 0 && (
        <div className="card fade-in" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Clicks Over Time</h3>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button
                className={`btn ${chartType === 'area' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setChartType('area')}
              >
                Area
              </button>
              <button
                className={`btn ${chartType === 'line' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setChartType('line')}
              >
                Line
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              {chartType === 'area' ? (
                <AreaChart data={analytics.clicksOverTime}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#6c5ce7"
                    strokeWidth={2}
                    fill="url(#colorClicks)"
                    dot={{ fill: '#6c5ce7', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={analytics.clicksOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#00cec9"
                    strokeWidth={2.5}
                    dot={{ fill: '#00cec9', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {analytics.deviceSplit.length > 0 && (
          <div className="card fade-in">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Devices</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={analytics.deviceSplit}
                    dataKey="clicks"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#7a7a8e' }}
                  >
                    {analytics.deviceSplit.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {analytics.browserSplit.length > 0 && (
          <div className="card fade-in">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Browsers</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={analytics.browserSplit} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="browser"
                    width={80}
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="clicks" name="Clicks" radius={[0, 4, 4, 0]}>
                    {analytics.browserSplit.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {analytics.countrySplit.length > 0 && (
          <div className="card fade-in">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Countries</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={analytics.countrySplit} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="country"
                    width={60}
                    tick={{ fill: '#7a7a8e', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="clicks" name="Clicks" radius={[0, 4, 4, 0]}>
                    {analytics.countrySplit.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {analytics.topReferrers.length > 0 && (
          <div className="card fade-in">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Top Referrers</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Source</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Clicks</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topReferrers.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: COLORS[i % COLORS.length], flexShrink: 0,
                        }} />
                        {r.referrer}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {r.clicks}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {analytics.totalClicks > 0 ? `${((r.clicks / analytics.totalClicks) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {analytics.totalClicks === 0 && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No click data yet</h2>
          <p className="text-muted">Share your link to start seeing analytics.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card fade-in">
      <div style={{
        fontSize: '0.75rem', color: 'var(--color-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '0.5rem',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '2rem', fontWeight: 700, color,
        lineHeight: 1, letterSpacing: '-0.02em',
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left', padding: '0.7rem 0.75rem', fontSize: '0.72rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)',
};

const tdStyle = {
  padding: '0.6rem 0.75rem', fontSize: '0.85rem',
};
