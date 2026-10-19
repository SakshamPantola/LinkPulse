export function formatRelativeTimestamp(isoDate) {
  if (!isoDate) return 'Never';
  const now = new Date();
  const date = new Date(isoDate);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Truncates long URL string safely with an ellipsis
 */
export function truncateUrl(url, maxLength = 45) {
  if (!url) return '';
  if (url.length <= maxLength) return url;
  const start = url.substring(0, Math.floor(maxLength * 0.7));
  const end = url.substring(url.length - Math.floor(maxLength * 0.25));
  return `${start}...${end}`;
}

/**
 * Copies plain text to user clipboard with fallback support
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback using textarea execCommand
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  return new Promise((resolve) => {
    const successful = document.execCommand('copy');
    textArea.remove();
    resolve(successful);
  });
}

/**
 * Computes color badge styles based on HTTP risk status or health state
 */
export function getStatusBadgeStyle(status) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'healthy':
    case 'low_risk':
      return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
    case 'paused':
    case 'pending':
    case 'medium_risk':
      return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
    case 'blocked':
    case 'expired':
    case 'high_risk':
      return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
    default:
      return { background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' };
  }
}
