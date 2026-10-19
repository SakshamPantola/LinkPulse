
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../lib/api';

const COLORS = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#00b894', '#e17055', '#74b9ff'];

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/campaigns/${id}`);
      setCampaign(res.campaign);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  if (loading) return <div className="text-muted" style={{ padding: '2rem' }}>Loading campaign details…</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!campaign) return null;

  const topChartData = (campaign.links || []).slice(0, 8).map(l => ({
    name: `/${l.short_code}`,
    clicks: l.click_count || 0,
  }));

  return (
    <div>
      
      <div className="page-header">
        <Link to="/campaigns" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          ← Back to Campaigns
        </Link>
        <h1 style={{ marginTop: '0.5rem' }}>{campaign.name}</h1>
        {campaign.description && (
          <p style={{ marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>{campaign.description}</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card fade-in">
          <div style={cardLabelStyle}>Total Links</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {campaign.total_links ?? 0}
          </div>
        </div>
        <div className="card fade-in">
          <div style={cardLabelStyle}>Total Clicks</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff' }}>
            {(campaign.total_clicks ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="card fade-in">
          <div style={cardLabelStyle}>Unique Visitors</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {(campaign.unique_visitors ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="card fade-in">
          <div style={cardLabelStyle}>Avg Clicks/Link</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>
            {campaign.total_links > 0
              ? Math.round(campaign.total_clicks / campaign.total_links)
              : 0}
          </div>
        </div>
      </div>

      {topChartData.length > 0 && topChartData.some(d => d.clicks > 0) && (
        <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Top Links Performance
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="name" tick={{ fill: '#7a7a8e', fontSize: 11 }} />
                <YAxis tick={{ fill: '#7a7a8e', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: '0.8rem' }}
                />
                <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]}>
                  {topChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Links in this Campaign</h2>
          <Link to="/links/new" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', textDecoration: 'none' }}>
            + Add Link
          </Link>
        </div>

        {campaign.links?.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No links have been tagged with this campaign yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={thStyle}>Short Code</th>
                <th style={thStyle}>Destination URL</th>
                <th style={thStyle}>Clicks</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {campaign.links.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>/{l.short_code}</span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 300 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {l.destination_url}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{l.click_count || 0}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4,
                      textTransform: 'uppercase', fontWeight: 600,
                      background: l.status === 'active' ? '#00b89420' : '#ff6b6b20',
                      color: l.status === 'active' ? '#00b894' : '#ff6b6b',
                    }}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link
                      to={`/links/${l.id}`}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}
                    >
                      📊 Analytics
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

const thStyle = {
  textAlign: 'left',
  padding: '0.75rem 1rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.85rem',
};
