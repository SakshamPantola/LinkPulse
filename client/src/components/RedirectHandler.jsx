import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getShortBaseUrl } from '../lib/api';

const RESERVED_ROUTES = new Set([
  'login', 'links', 'campaigns', 'qr', 'analytics', 'admin', 'health', 'api', 'dashboard'
]);

export default function RedirectHandler() {
  const { code } = useParams();

  useEffect(() => {
    if (!code || RESERVED_ROUTES.has(code.toLowerCase())) return;

    const shortBase = getShortBaseUrl();
    const target = `${shortBase}/${code}${window.location.search}`;
    window.location.replace(target);
  }, [code]);

  if (!code || RESERVED_ROUTES.has(code.toLowerCase())) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96989d' }}>
        Page not found.
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#202225',
      color: '#f2f3f5',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: 44,
        height: 44,
        border: '3px solid #3f4248',
        borderTopColor: '#00AEEF',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '1.25rem'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Redirecting...</div>
      <div style={{ fontSize: '0.85rem', color: '#96989d', marginTop: '0.35rem' }}>
        Forwarding you to destination link
      </div>
    </div>
  );
}
