
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api, { getShortBaseUrl } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function AdminPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [links, setLinks] = useState([]);
  const [linksPagination, setLinksPagination] = useState(null);
  const [linksSearch, setLinksSearch] = useState('');
  const [linksStatus, setLinksStatus] = useState('');
  const [linksPage, setLinksPage] = useState(1);
  const [linksLoading, setLinksLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  const [blockedDomains, setBlockedDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domainSubmitting, setDomainSubmitting] = useState(false);
  const [domainError, setDomainError] = useState('');

  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const params = new URLSearchParams({ page: linksPage, limit: 15 });
      if (linksSearch) params.set('search', linksSearch);
      if (linksStatus) params.set('status', linksStatus);
      const res = await api.get(`/api/admin/links?${params}`);
      setLinks(res.links || []);
      setLinksPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLinksLoading(false);
    }
  }, [linksPage, linksSearch, linksStatus]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: usersPage, limit: 15 });
      if (usersSearch) params.set('search', usersSearch);
      const res = await api.get(`/api/admin/users?${params}`);
      setUsers(res.users || []);
      setUsersPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, usersSearch]);

  const fetchBlockedDomains = useCallback(async () => {
    setDomainsLoading(true);
    try {
      const res = await api.get('/api/admin/blocked-domains');
      setBlockedDomains(res.blockedDomains || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDomainsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'links') fetchLinks();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'domains') fetchBlockedDomains();
  }, [activeTab, fetchLinks, fetchUsers, fetchBlockedDomains]);

  async function handleToggleLink(linkId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${newStatus} this link platform-wide?`)) return;

    setActionInProgress(linkId);
    try {
      await api.post(`/api/admin/links/${linkId}/${newStatus}`);
      toast.success(`Link platform-wide ${newStatus}d (cache invalidated)`);
      fetchLinks();
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleAddDomain(e) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setDomainSubmitting(true);
    setDomainError('');
    try {
      await api.post('/api/admin/blocked-domains', { domain: newDomain.trim() });
      toast.success(`Domain "${newDomain.trim()}" blocked`);
      setNewDomain('');
      fetchBlockedDomains();
      fetchStats();
    } catch (err) {
      setDomainError(err.message);
      toast.error(err.message);
    } finally {
      setDomainSubmitting(false);
    }
  }

  async function handleDeleteDomain(id, domain) {
    if (!confirm(`Remove "${domain}" from blocked domains?`)) return;
    try {
      await api.delete(`/api/admin/blocked-domains/${id}`);
      toast.info(`Domain "${domain}" unblocked`);
      fetchBlockedDomains();
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const shortBase = getShortBaseUrl();

  return (
    <div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1>Admin Control Panel</h1>
            <span style={{
              background: '#6c5ce725', border: '1px solid #6c5ce760',
              color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 700,
              padding: '0.2rem 0.6rem', borderRadius: 6, textTransform: 'uppercase',
            }}>
              Super Admin
            </span>
          </div>
          <p>Platform-wide oversight, security enforcement, and moderation</p>
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <div style={{
        display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)',
        marginBottom: '1.5rem', paddingBottom: '0.25rem', overflowX: 'auto',
      }}>
        {[
          { id: 'overview', label: 'Platform Analytics' },
          { id: 'links',    label: 'All Links' },
          { id: 'domains',  label: 'Blocked Domains' },
          { id: 'users',    label: 'Users Directory' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="fade-in">
          {statsLoading && !stats ? (
            <div className="text-muted" style={{ padding: '2rem' }}>Loading platform metrics…</div>
          ) : stats ? (
            <>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card fade-in">
                  <div style={cardLabelStyle}>Total Users</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {(stats.totalUsers ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="card fade-in">
                  <div style={cardLabelStyle}>Total Links</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff' }}>
                    {(stats.totalLinks ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="card fade-in">
                  <div style={cardLabelStyle}>Active Links</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    {(stats.activeLinks ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="card fade-in">
                  <div style={cardLabelStyle}>Disabled Links</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                    {(stats.disabledLinks ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="card fade-in">
                  <div style={cardLabelStyle}>Total Clicks</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff' }}>
                    {(stats.totalClicks ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="card fade-in">
                  <div style={cardLabelStyle}>Blocked Domains</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                    {(stats.blockedDomainsCount ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                <div className="card fade-in">
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Platform Click Volume (Last 30 Days)
                  </h2>
                  {stats.clicksOverTime?.length > 0 ? (
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <AreaChart data={stats.clicksOverTime}>
                          <defs>
                            <linearGradient id="adminClicks" x1="0" y1="0" x2="0" y2="1">
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
                            fill="url(#adminClicks)"
                            dot={{ fill: '#6366f1', r: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                      No clicks recorded across the platform yet.
                    </div>
                  )}
                </div>

                <div className="card fade-in">
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Top Target Domains
                  </h2>
                  {stats.topDomains?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {stats.topDomains.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.65rem 0.85rem', background: '#0a0a0f', borderRadius: 6,
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>🌐 {d.domain}</span>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                            {d.link_count} links
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                      No links created yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="fade-in">
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ flex: '1 1 280px', maxWidth: 420 }}>
              <input
                type="text"
                placeholder="Search short code, URL, or owner email…"
                value={linksSearch}
                onChange={e => { setLinksSearch(e.target.value); setLinksPage(1); }}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['', 'active', 'disabled'].map(st => (
                <button
                  key={st}
                  className={`btn ${linksStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', textTransform: 'capitalize' }}
                  onClick={() => { setLinksStatus(st); setLinksPage(1); }}
                >
                  {st === '' ? 'All Status' : st}
                </button>
              ))}
            </div>
          </div>

          {linksLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '3.5rem' }}>
              <div className="spinner"></div>
              <span className="text-muted">Loading platform links…</span>
            </div>
          ) : links.length === 0 ? (
            <div className="empty-state fade-in">
              <div className="empty-state-icon">🔗</div>
              <h2 className="empty-state-title">No Links Found</h2>
              <p className="empty-state-text">No platform links match the current search or status filter.</p>
            </div>
          ) : (
            <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>Short Link</th>
                    <th style={thStyle}>Destination</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Clicks</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>
                        <a
                          href={`${shortBase}/${l.short_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          /{l.short_code}
                        </a>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {l.destination_url}
                        </span>
                        {l.campaign_name && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                            🎯 {l.campaign_name}
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.82rem', color: '#e4e4ef' }}>{l.user_email}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{l.click_count || 0}</span>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${l.status === 'active' ? 'badge-active' : 'badge-disabled'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            className={`btn ${l.status === 'active' ? 'btn-ghost' : 'btn-primary'}`}
                            style={{
                              fontSize: '0.72rem', padding: '0.25rem 0.6rem',
                              color: l.status === 'active' ? 'var(--color-danger)' : undefined,
                            }}
                            disabled={actionInProgress === l.id}
                            onClick={() => handleToggleLink(l.id, l.status)}
                          >
                            {actionInProgress === l.id
                              ? 'Saving…'
                              : l.status === 'active'
                              ? '🚫 Disable'
                              : '✅ Enable'}
                          </button>
                          <Link
                            to={`/links/${l.id}`}
                            className="btn btn-ghost"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}
                            title="View Link Analytics"
                          >
                            📊
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {linksPagination?.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Page {linksPagination.page} of {linksPagination.pages} ({linksPagination.total} total links)
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost"
                      disabled={linksPage <= 1}
                      onClick={() => setLinksPage(p => p - 1)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      ← Prev
                    </button>
                    <button
                      className="btn btn-ghost"
                      disabled={linksPage >= linksPagination.pages}
                      onClick={() => setLinksPage(p => p + 1)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="fade-in" style={{ maxWidth: 750 }}>
          
          <div style={{
            background: '#12121a', border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-primary)', borderRadius: 8,
            padding: '1rem', marginBottom: '1.5rem',
          }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              🛡️ Subdomain-Aware Domain Filtering
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Domains added to this blocklist are immediately blocked across all link creation wizard and CSV import attempts.
              <strong> Any subdomain is automatically rejected</strong> (e.g., adding <code>example.com</code> will also block <code>bad.example.com</code> and <code>malicious.sub.example.com</code>).
            </p>
          </div>

          <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="e.g. phishingsite.com or scammer.net"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={domainSubmitting}>
              {domainSubmitting ? 'Adding…' : '+ Block Domain'}
            </button>
          </form>

          {domainError && <div className="error-message" style={{ marginBottom: '1rem' }}>{domainError}</div>}

          <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600 }}>Currently Blocked Domains ({blockedDomains.length})</h3>
            </div>

            {domainsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '3rem' }}>
                <div className="spinner"></div>
                <span className="text-muted">Loading blocklist…</span>
              </div>
            ) : blockedDomains.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No domains in the blocklist.
              </div>
            ) : (
              <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>Domain</th>
                    <th style={thStyle}>Added Date</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedDomains.map(bd => (
                    <tr key={bd.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>🚫 {bd.domain}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.15rem' }}>
                          Blocks: *.{bd.domain}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {new Date(bd.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ color: 'var(--color-danger)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => handleDeleteDomain(bd.id, bd.domain)}
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="fade-in">
          
          <div style={{ maxWidth: 400, marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="Search user name or email…"
              value={usersSearch}
              onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }}
              style={{ width: '100%' }}
            />
          </div>

          {usersLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '3.5rem' }}>
              <div className="spinner"></div>
              <span className="text-muted">Loading platform users…</span>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state fade-in">
              <div className="empty-state-icon">👥</div>
              <h2 className="empty-state-title">No Users Found</h2>
              <p className="empty-state-text">No registered users match your search criteria.</p>
            </div>
          ) : (
            <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Total Links</th>
                    <th style={thStyle}>Total Clicks</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#f0f0f5' }}>{u.name || 'Unnamed User'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 4,
                          fontWeight: 600, textTransform: 'uppercase',
                          background: u.role === 'admin' ? 'var(--color-primary-glow)' : '#74b9ff20',
                          color: u.role === 'admin' ? 'var(--color-primary)' : '#74b9ff',
                          border: `1px solid ${u.role === 'admin' ? 'var(--color-primary)' : '#74b9ff40'}`,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                          {(u.total_links || 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                          {(u.total_clicks || 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {usersPagination?.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Page {usersPagination.page} of {usersPagination.pages} ({usersPagination.total} total users)
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost"
                      disabled={usersPage <= 1}
                      onClick={() => setUsersPage(p => p - 1)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      ← Prev
                    </button>
                    <button
                      className="btn btn-ghost"
                      disabled={usersPage >= usersPagination.pages}
                      onClick={() => setUsersPage(p => p + 1)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const cardLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.45rem',
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
  fontSize: '0.85rem',
};
