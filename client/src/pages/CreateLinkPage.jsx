
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getShortBaseUrl } from '../lib/api';
import { useToast } from '../context/ToastContext';

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CreateLinkPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const shortBase = getShortBaseUrl();
  const [step, setStep] = useState(1);

  const [url, setUrl]         = useState('');
  const [alias, setAlias]     = useState('');
  const [validation, setValidation] = useState(null); 
  const [validating, setValidating] = useState(false);

  const [expiresAt, setExpiresAt]         = useState('');
  const [clickLimit, setClickLimit]       = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword]           = useState('');
  const [campaignId, setCampaignId]       = useState('');
  const [tagsInput, setTagsInput]         = useState('');
  const [campaigns, setCampaigns]         = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/api/campaigns')
      .then(res => setCampaigns(res.campaigns || []))
      .catch(() => setCampaigns([]));
  }, []);

  const debouncedUrl   = useDebounce(url, 400);
  const debouncedAlias = useDebounce(alias, 400);
  const prevValidation = useRef('');

  useEffect(() => {
    if (!debouncedUrl) {
      setValidation(null);
      return;
    }

    const key = `${debouncedUrl}::${debouncedAlias}`;
    if (key === prevValidation.current) return;
    prevValidation.current = key;

    setValidating(true);
    api.post('/api/links/validate', {
      destination_url: debouncedUrl,
      alias: debouncedAlias || undefined,
    })
      .then(res => setValidation(res))
      .catch(() => setValidation({ valid: false, errors: ['Validation request failed'], warnings: [] }))
      .finally(() => setValidating(false));
  }, [debouncedUrl, debouncedAlias]);

  function goToStep2() {
    if (!validation?.valid) return;
    setStep(2);
  }

  const handlePublish = useCallback(async () => {
    setError('');
    setSubmitting(true);
    try {
      const body = {
        destination_url: url,
        alias: alias || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        click_limit: clickLimit ? parseInt(clickLimit, 10) : undefined,
        password: (enablePassword && password.trim()) ? password.trim() : undefined,
        campaign_id: campaignId || undefined,
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      };
      await api.post('/api/links', body);
      toast.success('Link created and published successfully!');
      navigate('/links');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to create link');
    } finally {
      setSubmitting(false);
    }
  }, [url, alias, expiresAt, clickLimit, password, campaignId, tagsInput, navigate, toast]);

  return (
    <div>
      <div className="page-header">
        <h1>Create Link</h1>
        <p>Shorten a URL in two quick steps</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1, 2].map(n => (
          <div
            key={n}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: step >= n
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                : 'var(--color-border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="card fade-in" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Step 1 — Destination & Alias
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Destination URL *</label>
            <input
              id="destination-url"
              type="url"
              placeholder="https://example.com/your-long-url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Custom Alias (optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                {shortBase.replace(/^https?:\/\//, '')}/
              </span>
              <input
                id="alias-input"
                type="text"
                placeholder="my-link"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {validating && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Validating…
            </div>
          )}

          {validation && !validating && (
            <div style={{ marginBottom: '0.75rem' }}>
              {validation.errors?.map((e, i) => (
                <div key={i} className="error-message" style={{ marginBottom: '0.35rem' }}>{e}</div>
              ))}
              {validation.warnings?.map((w, i) => (
                <div key={i} style={{
                  background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--color-warning)', fontSize: '0.825rem',
                  padding: '0.45rem 0.65rem', borderRadius: '6px', marginBottom: '0.35rem'
                }}>{w}</div>
              ))}
              {validation.valid && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--color-success)', fontSize: '0.825rem',
                  padding: '0.45rem 0.65rem', borderRadius: '6px'
                }}>
                  URL is valid{alias ? ` - alias "${alias}" is available` : ''}
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={!validation?.valid || validating}
            onClick={goToStep2}
            style={{ marginTop: '0.5rem' }}
          >
            Continue to Options →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in" style={{ maxWidth: 600 }}>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Step 2 — Options
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Click Limit</label>
                <input
                  id="click-limit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={clickLimit}
                  onChange={e => setClickLimit(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#0a0a0f', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  id="enable-password-checkbox"
                  checked={enablePassword}
                  onChange={e => {
                    setEnablePassword(e.target.checked);
                    if (!e.target.checked) setPassword('');
                  }}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <span>🔒 Protect with Password</span>
              </label>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', marginLeft: '1.6rem' }}>
                Require visitors to enter a password before being redirected.
              </div>
              {enablePassword && (
                <div style={{ marginTop: '0.75rem', marginLeft: '1.6rem' }}>
                  <input
                    id="link-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter unlock password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', maxWidth: 320 }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Campaign (optional)</label>
              <select
                id="campaign-select"
                value={campaignId}
                onChange={e => setCampaignId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">None (No Campaign)</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input
                id="tags-input"
                type="text"
                placeholder="marketing, launch, social"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
              Review Summary
            </h3>
            <div style={reviewRow}>
              <span className="text-muted">Destination</span>
              <span style={{ wordBreak: 'break-all' }}>{url}</span>
            </div>
            <div style={reviewRow}>
              <span className="text-muted">Short URL</span>
              <span className="text-accent" style={{ fontWeight: 600 }}>{shortBase}/{alias || '(auto-generated)'}</span>
            </div>
            {campaignId && (
              <div style={reviewRow}>
                <span className="text-muted">Campaign</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                  {campaigns.find(c => c.id === campaignId)?.name || 'Selected'}
                </span>
              </div>
            )}
            {expiresAt && (
              <div style={reviewRow}>
                <span className="text-muted">Expires</span>
                <span>{new Date(expiresAt).toLocaleString()}</span>
              </div>
            )}
            {clickLimit && (
              <div style={reviewRow}>
                <span className="text-muted">Click Limit</span>
                <span>{clickLimit} clicks</span>
              </div>
            )}
            <div style={reviewRow}>
              <span className="text-muted">Password</span>
              {enablePassword && password.trim() ? (
                <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>Protected (password required)</span>
              ) : (
                <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>None (Direct Redirect)</span>
              )}
            </div>
            {tagsInput && (
              <div style={reviewRow}>
                <span className="text-muted">Tags</span>
                <span>{tagsInput}</span>
              </div>
            )}
          </div>

          {validation?.warnings?.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                color: 'var(--color-warning)',
                fontWeight: 600,
                fontSize: '0.82rem',
                marginBottom: '0.4rem',
              }}>
                Review Warnings Before Publishing:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e5e7eb', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {validation.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="btn btn-primary"
              disabled={submitting}
              onClick={handlePublish}
              style={{ flex: 1 }}
            >
              {submitting ? 'Publishing…' : 'Publish Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const reviewRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.45rem 0',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '0.88rem',
};
