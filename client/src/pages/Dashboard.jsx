
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const COLORS = ['#6366f1', '#818cf8', '#10b981', '#f59e0b', '#a855f7', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetchDashboard = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/dashboard?period=${selectedPeriod}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  const isAdmin = user?.role === 'admin';
  const alerts = data?.alerts || {};
  const totalAlertCount = (alerts.expiringSoon?.length || 0) +
    (alerts.limitReached?.length || 0) +
    (alerts.disabledLinks?.length || 0) +
    (alerts.botSpikes?.length || 0);

  return (
    <div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1>Dashboard</h1>
            {isAdmin && (
              <span style={{
                background: '#6c5ce725', border: '1px solid #6c5ce750',
                color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 600,
                padding: '0.15rem 0.5rem', borderRadius: 4, textTransform: 'uppercase',
              }}>
                Platform View (Admin)
              </span>
            )}
          </div>
          <p>Welcome back, {user?.name || user?.email}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', background: '#12121a', border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '0.2rem', gap: '0.2rem',
          }}>
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                className={`btn ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', textTransform: 'uppercase' }}
                onClick={() => setPeriod(p)}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          <Link to="/links/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            + Create Link
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '4rem' }}>
          <div className="spinner"></div>
          <span className="text-muted">Loading dashboard analytics…</span>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={cardLabelStyle}>Total Links</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {(data.totalLinks ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="card fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={cardLabelStyle}>Active Links</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                {(data.activeLinks ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="card fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={cardLabelStyle}>Total Clicks ({period.toUpperCase()})</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ffffff' }}>
                {(data.totalClicks ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="card fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={cardLabelStyle}>Unique Visitors ({period.toUpperCase()})</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ffffff' }}>
                {(data.uniqueVisitors ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            <div className="card fade-in">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Clicks Trend ({period.toUpperCase()})
              </h2>
              {data.clicksOverTime?.length > 0 ? (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <AreaChart data={data.clicksOverTime}>
                      <defs>
                        <linearGradient id="dashClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: '#121216', border: '1px solid #27272a', borderRadius: 8, fontSize: '0.8rem', color: '#ffffff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#dashClicks)"
                        dot={{ fill: '#6366f1', r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  No click events recorded in this period.
                </div>
              )}
            </div>

            <div className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Campaign Performance</h2>
                <Link to="/campaigns" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                  All Campaigns →
                </Link>
              </div>
              {data.campaignPerformance?.length > 0 ? (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.campaignPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ background: '#121216', border: '1px solid #27272a', borderRadius: 8, fontSize: '0.8rem', color: '#ffffff' }}
                      />
                      <Bar dataKey="clicks" name="Clicks" radius={[0, 4, 4, 0]}>
                        {data.campaignPerformance.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.75rem' }}>No campaign clicks in this period.</p>
                  <Link to="/campaigns" className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
                    Create a Campaign
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Top 5 Performing Links</h2>
                <Link to="/links" style={{ fontSize: '0.78rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  View All Links →
                </Link>
              </div>

              {data.topLinks?.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No clicks recorded yet.
                </div>
              ) : (
                <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={thStyle}>Short Link</th>
                      <th style={thStyle}>Destination</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Clicks</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Analytics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topLinks.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>/{l.short_code}</span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 180 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {l.destination_url}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {l.clicks}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <Link
                            to={`/links/${l.id}`}
                            className="btn btn-ghost"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', textDecoration: 'none' }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            <div className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Link Alerts & Health</span>
                  {totalAlertCount > 0 && (
                    <span style={{
                      background: '#ff6b6b25', color: 'var(--color-danger)', border: '1px solid #ff6b6b50',
                      fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 10,
                    }}>
                      {totalAlertCount} active
                    </span>
                  )}
                </h2>
              </div>

              {totalAlertCount === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-success)' }}>
                  <div style={{ fontWeight: 600 }}>All Systems Healthy</div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    No expiring links, limit warnings, or bot spikes detected.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {alerts.expiringSoon?.length > 0 && (
                    <div style={alertCardStyle('#fdcb6e')}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fdcb6e', marginBottom: '0.25rem' }}>
                        Expiring in the Next 7 Days ({alerts.expiringSoon.length})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#dcdce8' }}>
                        {alerts.expiringSoon.map(l => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <Link to={`/links/${l.id}`} style={{ color: 'var(--color-primary)' }}>/{l.short_code}</Link>
                            <span>Expires {new Date(l.expires_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {alerts.limitReached?.length > 0 && (
                    <div style={alertCardStyle('#ff7675')}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#ff7675', marginBottom: '0.25rem' }}>
                        Click Limit Reached ({alerts.limitReached.length})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#dcdce8' }}>
                        {alerts.limitReached.map(l => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <Link to={`/links/${l.id}`} style={{ color: 'var(--color-primary)' }}>/{l.short_code}</Link>
                            <span>{l.clicks} / {l.click_limit} clicks</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {alerts.disabledLinks?.length > 0 && (
                    <div style={alertCardStyle('#74b9ff')}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#74b9ff', marginBottom: '0.25rem' }}>
                        Disabled Links ({alerts.disabledLinks.length})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#dcdce8' }}>
                        {alerts.disabledLinks.slice(0, 3).map(l => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <Link to={`/links/${l.id}`} style={{ color: 'var(--color-primary)' }}>/{l.short_code}</Link>
                            <span>Disabled</span>
                          </div>
                        ))}
                        {alerts.disabledLinks.length > 3 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                            +{alerts.disabledLinks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {alerts.botSpikes?.length > 0 && (
                    <div style={alertCardStyle('#a29bfe')}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#a29bfe', marginBottom: '0.25rem' }}>
                        Bot Traffic Detected
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#dcdce8' }}>
                        {alerts.botSpikes.map((b, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <span>Date: {b.date}</span>
                            <span>{b.bot_clicks} bot clicks ({b.bot_percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
};

const alertCardStyle = (accentColor) => ({
  background: '#0a0a0f',
  border: `1px solid ${accentColor}40`,
  borderLeft: `3px solid ${accentColor}`,
  borderRadius: 6,
  padding: '0.65rem 0.8rem',
});

const thStyle = {
  textAlign: 'left',
  padding: '0.7rem 0.85rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
};

const tdStyle = {
  padding: '0.65rem 0.85rem',
  fontSize: '0.85rem',
};
