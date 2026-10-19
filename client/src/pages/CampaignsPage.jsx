
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function CampaignsPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [formName, setFormName]     = useState('');
  const [formDesc, setFormDesc]     = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError]   = useState('');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/campaigns');
      setCampaigns(res.campaigns || []);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  function openCreateModal() {
    setEditingId(null);
    setFormName('');
    setFormDesc('');
    setModalError('');
    setShowModal(true);
  }

  function openEditModal(c) {
    setEditingId(c.id);
    setFormName(c.name);
    setFormDesc(c.description || '');
    setModalError('');
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setModalSaving(true);
    setModalError('');
    try {
      if (editingId) {
        await api.patch(`/api/campaigns/${editingId}`, {
          name: formName,
          description: formDesc,
        });
        toast.success('Campaign updated successfully!');
      } else {
        await api.post('/api/campaigns', {
          name: formName,
          description: formDesc,
        });
        toast.success('Campaign created successfully!');
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (err) {
      setModalError(err.message);
      toast.error(err.message);
    } finally {
      setModalSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete campaign "${name}"? Links will be unassigned but not deleted.`)) return;
    try {
      await api.delete(`/api/campaigns/${id}`);
      toast.info(`Campaign "${name}" deleted`);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Campaigns</h1>
          <p>Group and track your marketing campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create Campaign
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '4rem' }}>
          <div className="spinner"></div>
          <span className="text-muted">Loading campaigns…</span>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state fade-in">
          <h2 className="empty-state-title">No campaigns yet</h2>
          <p className="empty-state-text">
            Group your short links into campaigns to track performance across channels, social media pushes, and marketing initiatives.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create First Campaign
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {campaigns.map(c => (
            <div key={c.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{c.name}</h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                      onClick={() => openEditModal(c)}
                      title="Edit Campaign"
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                      onClick={() => handleDelete(c.id, c.name)}
                      title="Delete Campaign"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', minHeight: '2.4rem' }}>
                  {c.description || 'No description provided.'}
                </p>

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem', background: '#0a0a0f', padding: '0.75rem',
                  borderRadius: 8, border: '1px solid var(--color-border)',
                  marginBottom: '1.25rem', textAlign: 'center',
                }}>
                  <div>
                    <div style={metricLabelStyle}>Links</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {c.total_links ?? 0}
                    </div>
                  </div>
                  <div>
                    <div style={metricLabelStyle}>Clicks</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {(c.total_clicks ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={metricLabelStyle}>Visitors</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>
                      {(c.unique_visitors ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to={`/campaigns/${c.id}`}
                className="btn btn-primary"
                style={{ textAlign: 'center', textDecoration: 'none', fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                View Campaign Analytics →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card fade-in" style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {editingId ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.5rem' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={modalLabelStyle}>Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Launch 2026"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={modalLabelStyle}>Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Goals, target audiences, or social channels…"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{
                    width: '100%', background: '#0a0a0f', color: '#e4e4ef',
                    border: '1px solid var(--color-border)', borderRadius: 8,
                    padding: '0.6rem 0.8rem', fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>

              {modalError && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>{modalError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalSaving}
                >
                  {modalSaving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Campaign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const metricLabelStyle = {
  fontSize: '0.68rem',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.2rem',
};

const modalLabelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};
