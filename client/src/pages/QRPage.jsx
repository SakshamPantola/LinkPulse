
import { useState, useEffect, useCallback } from 'react';
import api, { getToken, API_BASE } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function QRPage() {
  const toast = useToast();
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [qrInfo, setQrInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [error, setError] = useState('');

  const [darkColor, setDarkColor] = useState('#000000');
  const [size, setSize] = useState('320');
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const res = await api.get('/api/links?limit=100');
      const fetched = res.links || [];
      setLinks(fetched);
      if (fetched.length > 0 && !selectedLinkId) {
        setSelectedLinkId(fetched[0].id);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch links');
    } finally {
      setLinksLoading(false);
    }
  }, [selectedLinkId, toast]);

  const fetchQrInfo = useCallback(async (id) => {
    if (!id) return;
    setInfoLoading(true);
    try {
      const res = await api.get(`/api/links/${id}/qr-info`);
      setQrInfo(res);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch QR details');
    } finally {
      setInfoLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    if (selectedLinkId) {
      fetchQrInfo(selectedLinkId);
    }
  }, [selectedLinkId, fetchQrInfo]);

  async function handleDownload(format) {
    if (!selectedLinkId || !qrInfo) return;
    setDownloading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        format,
        size,
        dark: darkColor,
        download: 'true',
      });

      const fullUrl = `${API_BASE}/api/links/${selectedLinkId}/qr?${params}`;
      const response = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Failed to generate QR code for download');

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `qr-${qrInfo.link?.short_code || 'linkpulse'}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      toast.success(`Downloaded QR Code (${format.toUpperCase()})`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  }

  function handleCopyTarget() {
    if (!qrInfo?.targetUrl) return;
    navigator.clipboard.writeText(qrInfo.targetUrl).then(() => {
      setCopiedLink(true);
      toast.success('QR target URL copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 1500);
    }).catch(() => {
      toast.error('Failed to copy QR target URL');
    });
  }

  return (
    <div>
      
      <div className="page-header">
        <h1>QR Code Studio</h1>
        <p>Create branded, trackable QR codes for your short links with real-time scan analytics</p>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {linksLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '4rem' }}>
          <div className="spinner"></div>
          <span className="text-muted">Loading your links…</span>
        </div>
      ) : links.length === 0 ? (
        <div className="empty-state fade-in">
          <h2 className="empty-state-title">No links available for QR codes</h2>
          <p className="empty-state-text">
            Create your first short link to start generating custom, trackable QR codes.
          </p>
          <a href="/links/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            + Create Link
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          <div className="card fade-in">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Select Link & Styling
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Select Target Link</label>
              <select
                value={selectedLinkId}
                onChange={e => setSelectedLinkId(e.target.value)}
                style={{ width: '100%' }}
              >
                {links.map(l => (
                  <option key={l.id} value={l.id}>
                    /{l.short_code} — {l.destination_url.slice(0, 45)}
                  </option>
                ))}
              </select>
            </div>

            {qrInfo?.link && (
              <div style={{
                background: '#0a0a0f', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '0.85rem', marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                  Destination URL
                </div>
                <div style={{ fontSize: '0.84rem', wordBreak: 'break-all', color: '#e4e4ef' }}>
                  {qrInfo.link.destination_url}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <code style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>
                    {qrInfo.targetUrl ? qrInfo.targetUrl.replace(/http:\/\/localhost:\d+/, 'https://linkpulse-fbk6.onrender.com') : ''}
                  </code>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                    onClick={handleCopyTarget}
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Foreground Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="color"
                    value={darkColor}
                    onChange={e => setDarkColor(e.target.value)}
                    style={{ width: 42, height: 38, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={darkColor}
                    onChange={e => setDarkColor(e.target.value)}
                    style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Export Resolution</label>
                <select
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  style={{ width: '100%', height: 38 }}
                >
                  <option value="250">250 x 250 px (Small)</option>
                  <option value="320">320 x 320 px (Standard)</option>
                  <option value="600">600 x 600 px (HD Print)</option>
                  <option value="1000">1000 x 1000 px (Ultra HD)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Color Presets</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { name: 'Classic Dark', color: '#000000' },
                  { name: 'Purple Accent', color: '#6c5ce7' },
                  { name: 'Cyan', color: '#00cec9' },
                  { name: 'Emerald', color: '#00b894' },
                ].map(p => (
                  <button
                    key={p.color}
                    className="btn btn-ghost"
                    style={{
                      fontSize: '0.72rem', padding: '0.25rem 0.5rem',
                      border: darkColor === p.color ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                    }}
                    onClick={() => setDarkColor(p.color)}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem' }}
                disabled={downloading || infoLoading}
                onClick={() => handleDownload('png')}
              >
                {downloading ? 'Preparing…' : 'Download PNG'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, padding: '0.65rem', border: '1px solid var(--color-border)' }}
                disabled={downloading || infoLoading}
                onClick={() => handleDownload('svg')}
              >
                Download SVG
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="card fade-in" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Live QR Code Preview
              </h3>

              <div style={{
                display: 'inline-block',
                background: '#ffffff',
                padding: '1.25rem',
                borderRadius: 16,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                marginBottom: '1.25rem',
              }}>
                {infoLoading ? (
                  <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e1e2e' }}>
                    Generating…
                  </div>
                ) : qrInfo?.qrDataUrl ? (
                  <img
                    src={qrInfo.qrDataUrl}
                    alt="Short Link QR Code"
                    style={{ width: 220, height: 220, display: 'block', borderRadius: 6 }}
                  />
                ) : (
                  <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    Select a link
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f0f5' }}>
                Scan with any smartphone camera
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Points to: <code>{qrInfo?.targetUrl ? qrInfo.targetUrl.replace(/http:\/\/localhost:\d+/, 'https://linkpulse-fbk6.onrender.com') : ''}</code>
              </p>
            </div>

            {qrInfo && (
              <div className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Scan Attribution Metrics</h3>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.45rem',
                    borderRadius: 4, background: '#00cec920', color: 'var(--color-accent)',
                  }}>
                    QR Tracked
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                  <div style={{ background: '#0a0a0f', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={metricLabelStyle}>QR Scans</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {(qrInfo.qrScans || 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0f', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={metricLabelStyle}>Total Clicks</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e4e4ef' }}>
                      {(qrInfo.totalClicks || 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0f', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={metricLabelStyle}>QR Traffic Share</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
                      {qrInfo.qrPercentage || 0}%
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.85rem', lineHeight: 1.4 }}>
                  Whenever someone scans this QR code, the redirect engine automatically records <code>source: "qr"</code> in the background click event worker without requiring any extra setup.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const metricLabelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.3rem',
};
