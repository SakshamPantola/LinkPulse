import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/authPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  function handleQuickFillAdmin() {
    setEmail('platform404@gmail.com');
    setPassword('Admin@123');
    setIsLogin(true);
    setError('');
  }

  return (
    <div className="auth-split-layout">
      <div className="auth-container">
        
        <div className="auth-hero-panel">
          <div>
            <div className="auth-brand-badge">
              <span className="auth-pulse-dot" />
              <span>LinkPulse Enterprise Gateway</span>
            </div>

            <h2 className="auth-hero-title">
              Power your links with <span>smart telemetry</span> & risk intelligence.
            </h2>

            <p className="auth-hero-desc">
              Experience sub-millisecond redirections, live dynamic QR customization, automated bot filtration, and carrier-grade link auditing.
            </p>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">⚡</div>
                <div className="auth-feature-text">
                  <h4>Sub-ms Redirects</h4>
                  <p>In-memory cache with non-blocking click queues.</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">🛡️</div>
                <div className="auth-feature-text">
                  <h4>Risk Scoring</h4>
                  <p>Automated phishing heuristics & bot shields.</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">📱</div>
                <div className="auth-feature-text">
                  <h4>QR Studio</h4>
                  <p>Custom palettes & high-DPI SVG/PNG export.</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">📊</div>
                <div className="auth-feature-text">
                  <h4>Geo Telemetry</h4>
                  <p>Real-time spatial resolution & device breakdown.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-stats-card">
            <div className="auth-stat-col">
              <span className="auth-stat-val">&lt; 1ms</span>
              <span className="auth-stat-lbl">Gateway Latency</span>
            </div>
            <div className="auth-stat-col">
              <span className="auth-stat-val">100%</span>
              <span className="auth-stat-lbl">Bot Filtered</span>
            </div>
            <div className="auth-stat-col">
              <span className="auth-stat-val">Neon PG</span>
              <span className="auth-stat-lbl">Cloud Backbone</span>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Create Account
            </button>
          </div>

          <h3 className="auth-form-title">
            {isLogin ? 'Welcome back' : 'Get started with LinkPulse'}
          </h3>
          <p className="auth-form-sub">
            {isLogin ? 'Enter your credentials to access your dashboard' : 'Create an account to start managing smart short links'}
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-input-group">
                <label htmlFor="name">Full Name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="name"
                    type="text"
                    className="auth-input-field"
                    placeholder="e.g. Alex Turner"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  className="auth-input-field"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input-field"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button className="auth-submit-btn" type="submit" disabled={busy}>
              {busy ? (
                <span>Please wait...</span>
              ) : isLogin ? (
                <span>Sign In to Platform →</span>
              ) : (
                <span>Create Free Account →</span>
              )}
            </button>
          </form>

          <div className="auth-demo-hint">
            <span>💡 Testing Admin features?</span>
            <button
              type="button"
              className="auth-quickfill-btn"
              onClick={handleQuickFillAdmin}
            >
              Fill Admin Creds
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
