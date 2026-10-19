
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getShortBaseUrl } from '../lib/api';
import { useToast } from '../context/ToastContext';

function getDisplayStatus(link) {
  if (link.status === 'disabled') return { key: 'disabled', label: 'Disabled' };
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { key: 'expired', label: 'Expired' };
  if (link.click_limit && link.click_count >= link.click_limit) return { key: 'expired', label: 'Limit Reached' };
  return { key: 'active', label: 'Active' };
}

function StatusBadge({ link }) {
  const s = getDisplayStatus(link);
  return (
    <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <span className={`badge badge-${s.key}`}>
        {s.label}
      </span>
      {link.has_password && (
        <span className="badge badge-locked" title="Password protected">
          Locked
        </span>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Short link copied to clipboard!');
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, [text, toast]);

  return (
    <button
      className="btn btn-ghost"
      onClick={handleCopy}
      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function LinksPage() {
  const toast = useToast();
  const [links, setLinks]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch]       = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags]           = useState([]);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);

  const [editingLink, setEditingLink] = useState(null);
  const [editForm, setEditForm]       = useState({
    destination_url: '',
    status: 'active',
    expires_at: '',
    click_limit: '',
    password: '',
  });
  const [editingTags, setEditingTags] = useState([]);
  const [tagToAdd, setTagToAdd]       = useState('');
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState('');

  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName]     = useState('');
  const [tagModalError, setTagModalError] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep]           = useState(1); 
  const [csvContent, setCsvContent]           = useState('');
  const [importFileName, setImportFileName]   = useState('');
  const [importReport, setImportReport]       = useState(null);
  const [importLoading, setImportLoading]     = useState(false);
  const [importError, setImportError]         = useState('');
  const [importSuccess, setImportSuccess]     = useState('');

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.get('/api/tags');
      setTags(res.tags || []);
    } catch {
      setTags([]);
    }
  }, []);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (selectedTag) params.set('tag', selectedTag);
      const res = await api.get(`/api/links?${params}`);
      setLinks(res.links);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedTag, toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function handleDisable(id) {
    if (!confirm('Disable this link? It will keep its analytics.')) return;
    try {
      await api.delete(`/api/links/${id}`);
      toast.info('Link disabled successfully');
      fetchLinks();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openEditModal(link) {
    setEditingLink(link);
    setEditingTags(link.tags || []);
    setTagToAdd('');
    setEditForm({
      destination_url: link.destination_url || '',
      status: link.status || 'active',
      expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '',
      click_limit: link.click_limit != null ? String(link.click_limit) : '',
      password: '',
      removePassword: false,
      reset_clicks: false,
    });
    setEditError('');
  }

  async function handleAttachTag() {
    if (!tagToAdd.trim() || !editingLink) return;
    try {
      const res = await api.post(`/api/links/${editingLink.id}/tags`, { name: tagToAdd.trim() });
      setEditingTags(prev => [...prev, { id: res.tag_id, name: tagToAdd.trim() }]);
      setTagToAdd('');
      fetchTags();
      fetchLinks();
    } catch (err) {
      setEditError(err.message);
    }
  }

  async function handleDetachTag(tagId) {
    if (!editingLink) return;
    try {
      await api.delete(`/api/links/${editingLink.id}/tags/${tagId}`);
      setEditingTags(prev => prev.filter(t => t.id !== tagId));
      fetchTags();
      fetchLinks();
    } catch (err) {
      setEditError(err.message);
    }
  }

  async function handleSaveModal(e) {
    e.preventDefault();
    if (!editingLink) return;
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {
        destination_url: editForm.destination_url,
        status: editForm.status,
        expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : null,
        click_limit: editForm.click_limit ? parseInt(editForm.click_limit, 10) : null,
        reset_clicks: editForm.reset_clicks || undefined,
      };
      if (editForm.removePassword) {
        payload.password = null;
      } else if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      await api.patch(`/api/links/${editingLink.id}`, payload);
      setEditingLink(null);
      fetchLinks();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleCreateTag(e) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setTagModalError('');
    try {
      await api.post('/api/tags', { name: newTagName.trim() });
      setNewTagName('');
      fetchTags();
    } catch (err) {
      setTagModalError(err.message);
    }
  }

  async function handleDeleteTag(tagId) {
    if (!confirm('Delete this tag? Links will not be deleted.')) return;
    try {
      await api.delete(`/api/tags/${tagId}`);
      if (selectedTag === tags.find(t => t.id === tagId)?.name) {
        setSelectedTag('');
      }
      fetchTags();
      fetchLinks();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleCsvFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result || '');
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
  }

  async function handleRunPreview(e) {
    e.preventDefault();
    if (!csvContent.trim()) {
      setImportError('Please select a CSV file or paste CSV content');
      return;
    }
    setImportLoading(true);
    setImportError('');
    try {
      const res = await api.post('/api/links/import', {
        csv: csvContent,
        dryRun: true,
      });
      setImportReport(res);
      setImportStep(2);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!csvContent.trim()) return;
    setImportLoading(true);
    setImportError('');
    try {
      const res = await api.post('/api/links/import', {
        csv: csvContent,
        dryRun: false,
      });
      setImportSuccess(`Successfully imported ${res.summary.imported} links!`);
      fetchLinks();
      fetchTags();
      setTimeout(() => {
        setShowImportModal(false);
        setImportStep(1);
        setCsvContent('');
        setImportFileName('');
        setImportReport(null);
        setImportSuccess('');
      }, 1800);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  }

  function downloadSampleCsv() {
    const sample = `destination_url,alias,campaign,tags,expires_at
https://github.com/facebook/react,react-hub,Dev Tools,"react,frontend,open-source",2026-12-31T23:59:59Z
https://tailwindcss.com,tailwind-css,Dev Tools,"css,styling",
https://vite.dev,vite-bundler,Launch 2026,"bundler,speed",2026-11-30T12:00:00Z`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'linkpulse-sample-links.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const shortBase = getShortBaseUrl();

  return (
    <div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Links</h1>
          <p>Manage your shortened URLs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
            onClick={() => {
              setShowImportModal(true);
              setImportStep(1);
              setImportReport(null);
              setImportError('');
              setImportSuccess('');
            }}
          >
            Import CSV
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
            onClick={() => setShowTagModal(true)}
          >
            Manage Tags
          </button>
          <Link to="/links/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            + Create Link
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ flex: '1 1 300px', maxWidth: 400 }}>
          <input
            id="search-links"
            type="text"
            placeholder="Search by short code or URL…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <button
            className={`btn ${selectedTag === '' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            onClick={() => { setSelectedTag(''); setPage(1); }}
          >
            All Links
          </button>
          {tags.map(t => (
            <button
              key={t.id}
              className={`btn ${selectedTag === t.name ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              onClick={() => { setSelectedTag(selectedTag === t.name ? '' : t.name); setPage(1); }}
            >
              #{t.name} {t.link_count > 0 && <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>({t.link_count})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '4rem' }}>
          <div className="spinner"></div>
          <span className="text-muted">Loading your links…</span>
        </div>
      ) : links.length === 0 ? (
        <div className="empty-state fade-in">
          <h2 className="empty-state-title">
            {selectedTag ? `No links tagged with #${selectedTag}` : 'No links found'}
          </h2>
          <p className="empty-state-text">
            {selectedTag ? 'Try clearing the tag filter or create a new link with this tag.' : 'Create your first short link or import a batch via CSV to get started.'}
          </p>
          {selectedTag ? (
            <button className="btn btn-ghost" onClick={() => setSelectedTag('')}>
              Clear Tag Filter
            </button>
          ) : (
            <Link to="/links/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              + Create Link
            </Link>
          )}
        </div>
      ) : (
        <>
          
          <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Short URL', 'Destination', 'Status', 'Clicks', 'Created', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a
                          href={`${shortBase}/${link.short_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-accent)', fontSize: '0.88rem', fontWeight: 500 }}
                        >
                          /{link.short_code}
                        </a>
                        <CopyButton text={`${shortBase}/${link.short_code}`} />
                      </div>
                      
                      {link.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                          {link.tags.map(tg => (
                            <span
                              key={tg.id}
                              style={{
                                fontSize: '0.68rem', padding: '0.1rem 0.35rem',
                                borderRadius: 4, background: '#1e1e2e', color: 'var(--color-text-muted)',
                              }}
                            >
                              #{tg.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td style={{ ...tdStyle, maxWidth: 250 }}>
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.84rem',
                          color: 'var(--color-text-muted)',
                        }}
                        title={link.destination_url}
                      >
                        {link.destination_url}
                      </span>
                      {link.campaign_name && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', display: 'block', marginTop: '0.2rem' }}>
                          {link.campaign_name}
                        </span>
                      )}
                    </td>

                    <td style={tdStyle}><StatusBadge link={link} /></td>

                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {link.click_count ?? 0}
                      </span>
                      {link.click_limit && (
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          /{link.click_limit}
                        </span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(link.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Link
                          to={`/links/${link.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}
                        >
                          Analytics
                        </Link>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => openEditModal(link)}
                        >
                          Edit
                        </button>
                        {getDisplayStatus(link) !== 'disabled' && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: 'var(--color-danger)' }}
                            onClick={() => handleDisable(link.id)}
                          >
                            Disable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {pagination && pagination.pages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '0.5rem',
              marginTop: '1.25rem',
            }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`btn ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {editingLink && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card fade-in" style={{ maxWidth: 520, width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Edit Link: <span className="text-accent">/{editingLink.short_code}</span>
              </h2>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.5rem' }}
                onClick={() => setEditingLink(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={modalLabelStyle}>Destination URL *</label>
                <input
                  type="url"
                  required
                  value={editForm.destination_url}
                  onChange={e => setEditForm(prev => ({ ...prev, destination_url: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={modalLabelStyle}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label style={{ ...modalLabelStyle, marginBottom: 0 }}>Click Limit</label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      Current Clicks: {editingLink.click_count || 0}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited (leave blank)"
                    value={editForm.click_limit}
                    onChange={e => setEditForm(prev => ({ ...prev, click_limit: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                  {(editingLink.click_count > 0) && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--color-accent)', marginTop: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.reset_clicks}
                        onChange={e => setEditForm(prev => ({ ...prev, reset_clicks: e.target.checked }))}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>Reset clicks to 0</span>
                    </label>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={modalLabelStyle}>Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.expires_at}
                    onChange={e => setEditForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={modalLabelStyle}>Password Protection</label>
                  {editingLink.has_password && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-warning)', marginBottom: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editForm.removePassword}
                        onChange={e => setEditForm(prev => ({ ...prev, removePassword: e.target.checked, password: '' }))}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>Remove password</span>
                    </label>
                  )}
                  {!editForm.removePassword && (
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder={editingLink.has_password ? "Enter new password to change" : "Leave blank for no password"}
                      value={editForm.password}
                      onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#0a0a0f', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <label style={modalLabelStyle}>Attached Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
                  {editingTags.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>No tags attached to this link yet.</span>
                  ) : (
                    editingTags.map(t => (
                      <span
                        key={t.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          background: '#1e1e2e', border: '1px solid #2a2a3e',
                          borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.78rem',
                        }}
                      >
                        #{t.name}
                        <button
                          type="button"
                          onClick={() => handleDetachTag(t.id)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--color-danger)',
                            cursor: 'pointer', padding: 0, fontSize: '0.75rem', lineHeight: 1,
                          }}
                          title="Detach tag"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Type a tag name (e.g. promo, twitter)..."
                    value={tagToAdd}
                    onChange={e => setTagToAdd(e.target.value)}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleAttachTag}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', whiteSpace: 'nowrap' }}
                  >
                    + Attach Tag
                  </button>
                </div>
              </div>

              {editError && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>{editError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingLink(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTagModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card fade-in" style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Manage Tags</h2>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.5rem' }}
                onClick={() => setShowTagModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTag} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="New tag name (e.g. social, launch)"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                Add Tag
              </button>
            </form>

            {tagModalError && (
              <div className="error-message" style={{ marginBottom: '1rem' }}>{tagModalError}</div>
            )}

            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {tags.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem' }}>
                  No tags yet. Add one above!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tags.map(t => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0.75rem', background: '#0a0a0f', borderRadius: 6,
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        #{t.name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({t.link_count} links)</span>
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ color: 'var(--color-danger)', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                        onClick={() => handleDeleteTag(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowTagModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card fade-in" style={{ maxWidth: importStep === 2 ? 800 : 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                  Bulk Import Short Links from CSV
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {importStep === 1 ? 'Step 1: Upload or paste CSV' : 'Step 2: Review & Validate Before Import'}
                </span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.5rem' }}
                onClick={() => setShowImportModal(false)}
              >
                ✕
              </button>
            </div>

            {importSuccess ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-success)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{importSuccess}</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Your new links have been added to your dashboard.
                </p>
              </div>
            ) : importStep === 1 ? (
              
              <div>
                <div style={{
                  background: '#0a0a0f', border: '1px dashed var(--color-border)',
                  borderRadius: 10, padding: '1.75rem', textAlign: 'center', marginBottom: '1.25rem',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                    Select a .csv file from your computer
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Columns: <code>destination_url</code>, <code>alias</code>, <code>campaign</code>, <code>tags</code>, <code>expires_at</code>
                  </p>

                  <input
                    type="file"
                    accept=".csv,text/csv"
                    id="csv-file-input"
                    onChange={handleCsvFileSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file-input" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    {importFileName ? `Selected: ${importFileName}` : 'Choose CSV File'}
                  </label>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={modalLabelStyle}>Or paste raw CSV text</label>
                    <button
                      type="button"
                      onClick={downloadSampleCsv}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                    >
                      Download Sample CSV template
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="destination_url,alias,campaign,tags,expires_at&#10;https://example.com/one,alias1,Launch,&quot;tag1,tag2&quot;,"
                    value={csvContent}
                    onChange={e => setCsvContent(e.target.value)}
                    style={{
                      width: '100%', background: '#0a0a0f', color: '#e4e4ef',
                      border: '1px solid var(--color-border)', borderRadius: 8,
                      padding: '0.65rem 0.85rem', fontSize: '0.8rem', fontFamily: 'monospace',
                    }}
                  />
                </div>

                {importError && (
                  <div className="error-message" style={{ marginBottom: '1.25rem' }}>{importError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={importLoading || !csvContent.trim()}
                    onClick={handleRunPreview}
                  >
                    {importLoading ? 'Validating…' : 'Inspect & Preview →'}
                  </button>
                </div>
              </div>
            ) : (
              
              <div>
                
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem', marginBottom: '1.25rem', textAlign: 'center',
                }}>
                  <div style={{ background: '#0a0a0f', padding: '0.65rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Rows</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f0f0f5' }}>
                      {importReport?.summary?.total || 0}
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0f', padding: '0.65rem', borderRadius: 8, border: '1px solid #00b89440' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', textTransform: 'uppercase' }}>Valid to Import</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-success)' }}>
                      {importReport?.summary?.valid || 0}
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0f', padding: '0.65rem', borderRadius: 8, border: '1px solid #ff767540' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', textTransform: 'uppercase' }}>Errors</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                      {importReport?.summary?.errors || 0}
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0f', padding: '0.65rem', borderRadius: 8, border: '1px solid #fdcb6e40' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', textTransform: 'uppercase' }}>Duplicates</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                      {importReport?.summary?.duplicates || 0}
                    </div>
                  </div>
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: '1.25rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#12121a', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Destination URL</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Alias</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Notes / Error Reasons</th>
                      </tr>
                    </thead>
                    <tbody>
                      
                      {importReport?.validRows?.map(r => (
                        <tr key={`v-${r.line}`} style={{ borderBottom: '1px solid var(--color-border)', background: '#00b89408' }}>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>{r.line}</td>
                          <td style={{ padding: '0.5rem 0.75rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.destination_url}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-accent)' }}>
                            {r.alias ? `/${r.alias}` : '(auto)'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: '#00b89425', color: 'var(--color-success)', fontWeight: 600 }}>
                              VALID
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            {r.campaign && `Campaign: ${r.campaign}`} {r.tags?.length > 0 && `| Tags: ${r.tags.join(', ')}`}
                          </td>
                        </tr>
                      ))}

                      {importReport?.errorRows?.map(r => (
                        <tr key={`e-${r.line}`} style={{ borderBottom: '1px solid var(--color-border)', background: '#ff76750c' }}>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>{r.line}</td>
                          <td style={{ padding: '0.5rem 0.75rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ff7675' }}>
                            {r.destination_url || '(empty URL)'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>
                            {r.alias ? `/${r.alias}` : '-'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: '#ff767525', color: 'var(--color-danger)', fontWeight: 600 }}>
                              ERROR
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#ff7675', fontSize: '0.75rem' }}>
                            {r.errors?.join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importError && (
                  <div className="error-message" style={{ marginBottom: '1.25rem' }}>{importError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setImportStep(1)}
                  >
                    ← Back to Upload
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowImportModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={importLoading || !importReport?.validRows?.length}
                      onClick={handleConfirmImport}
                    >
                      {importLoading
                        ? 'Importing…'
                        : `Confirm Import (${importReport?.summary?.valid || 0} Links)`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const modalLabelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const thStyle = {
  textAlign: 'left',
  padding: '0.85rem 1rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.88rem',
};
