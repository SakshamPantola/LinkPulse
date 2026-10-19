import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          maxWidth: '380px',
          width: 'calc(100vw - 2.5rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} fade-in`}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'var(--color-bg-card, #2F3136)',
              border: `1px solid ${
                t.type === 'success'
                  ? '#10b981'
                  : t.type === 'error'
                  ? '#ef4444'
                  : t.type === 'warning'
                  ? '#f59e0b'
                  : '#3b82f6'
              }40`,
              borderLeft: `4px solid ${
                t.type === 'success'
                  ? '#10b981'
                  : t.type === 'error'
                  ? '#ef4444'
                  : t.type === 'warning'
                  ? '#f59e0b'
                  : '#3b82f6'
              }`,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'warning' && '!'}
                {t.type === 'info' && '•'}
              </span>
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted, #96989d)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0.2rem',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
