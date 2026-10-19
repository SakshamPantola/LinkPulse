
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function AnalyticsPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/links?limit=100')
      .then(res => setLinks(res.links || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...links].sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0));
  const totalClicks = sorted.reduce((sum, l) => sum + (l.click_count ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Insights across all your links</p>
      </div>

      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No links yet</h2>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Create links to start seeing analytics.</p>
          <Link to="/links/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Create Link
          </Link>
        </div>
      ) : (
        <>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <SummaryCard label="Total Links" value={sorted.length} color="var(--color-primary)" />
            <SummaryCard label="Total Clicks" value={totalClicks} color="#ffffff" />
            <SummaryCard
              label="Top Performer"
              value={sorted[0]?.short_code ? `/${sorted[0].short_code}` : '—'}
              color="var(--color-warning)"
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Short URL', 'Clicks', 'Status', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((link, i) => (
                  <tr key={link.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={tdStyle}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>/{link.short_code}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                        {link.destination_url}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>
                        {(link.click_count ?? 0).toLocaleString()}
                      </span>
                      {totalClicks > 0 && (
                        <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden', width: 80 }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: 'var(--color-primary)',
                            width: `${Math.max(2, ((link.click_count ?? 0) / totalClicks) * 100)}%`,
                            transition: 'width 0.4s',
                          }} />
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block', padding: '0.15rem 0.4rem', borderRadius: 4,
                        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                        background: link.status === 'active' ? '#00b89420' : '#ff6b6b20',
                        color: link.status === 'active' ? '#00b894' : '#ff6b6b',
                        border: `1px solid ${link.status === 'active' ? '#00b89440' : '#ff6b6b40'}`,
                      }}>
                        {link.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <Link
                        to={`/links/${link.id}`}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
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
        fontSize: '1.8rem', fontWeight: 700, color,
        lineHeight: 1, letterSpacing: '-0.02em',
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)',
};

const tdStyle = {
  padding: '0.75rem 1rem', fontSize: '0.88rem',
};
