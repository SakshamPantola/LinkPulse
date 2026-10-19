import { useState } from 'react';
import { triggerFileDownload, copySvgToClipboard } from '../lib/qrExport';
import { QR_COLOR_PRESETS, isScannableContrast } from '../lib/qrPresets';

export default function QRPreviewModal({ isOpen, onClose, link, qrSvg, darkColor, size }) {
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  if (!isOpen || !link) return null;

  const isContrastSafe = isScannableContrast(darkColor);

  const handleCopySvg = async () => {
    if (!qrSvg) return;
    const ok = await copySvgToClipboard(qrSvg);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadDirectSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    triggerFileDownload(blob, `linkpulse_${link.custom_alias || link.short_code}_vector.svg`);
  };

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <h3>Dynamic QR Studio Preview</h3>
            <p className="qr-modal-subtitle">/{link.custom_alias || link.short_code} • {link.title || 'Untitled Link'}</p>
          </div>
          <button className="qr-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-preview-canvas-wrapper">
            <div
              className="qr-device-frame"
              style={{
                borderColor: isContrastSafe ? 'rgba(255,255,255,0.1)' : '#f59e0b',
              }}
            >
              {qrSvg ? (
                <div
                  className="qr-rendered-svg-container"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="qr-loading-placeholder">Rendering QR Matrix...</div>
              )}
            </div>

            {!isContrastSafe && (
              <div className="qr-contrast-warning">
                ⚠️ Low color contrast. Some camera scanners might struggle in low light.
              </div>
            )}
          </div>

          <div className="qr-modal-sidebar">
            <h4>Quick Color Presets</h4>
            <div className="qr-presets-grid">
              {QR_COLOR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  className={`qr-preset-chip ${activePreset === preset.id ? 'active' : ''}`}
                  onClick={() => setActivePreset(preset.id)}
                  title={preset.description}
                >
                  <span
                    className="qr-preset-color-dot"
                    style={{ backgroundColor: preset.dark }}
                  />
                  <span className="qr-preset-label">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="qr-details-summary">
              <div className="qr-summary-row">
                <span>Destination:</span>
                <span className="qr-summary-val truncate">{link.destination_url}</span>
              </div>
              <div className="qr-summary-row">
                <span>Output Resolution:</span>
                <span className="qr-summary-val">{size} x {size} px</span>
              </div>
              <div className="qr-summary-row">
                <span>Attribution Tracking:</span>
                <span className="qr-summary-val status-active">Active (Print Scans)</span>
              </div>
            </div>

            <div className="qr-action-buttons-group">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopySvg}
              >
                {copied ? '✓ SVG Copied' : 'Copy SVG Markup'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadDirectSvg}
              >
                Download Vector SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
