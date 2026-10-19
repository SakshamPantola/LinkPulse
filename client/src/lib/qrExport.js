/**
 * LinkPulse QR Code Export & Canvas Utilities
 * Authored by Nirmay Tripathi (@nirmaytripathi)
 */

/**
 * Triggers a native browser file download from a Blob or URL
 * @param {Blob|string} resource - Target blob object or direct data URL
 * @param {string} filename - Output filename including extension
 */
export function triggerFileDownload(resource, filename) {
  const url = typeof resource === 'string' ? resource : URL.createObjectURL(resource);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (typeof resource !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Copies SVG text markup directly to clipboard
 * @param {string} svgText - Raw SVG XML content
 * @returns {Promise<boolean>}
 */
export async function copySvgToClipboard(svgText) {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(svgText);
    return true;
  } catch (err) {
    console.error('Failed to copy SVG to clipboard:', err);
    return false;
  }
}

/**
 * Renders an SVG markup to an HTML5 Canvas to produce high-DPI rasterized PNG/JPEG
 * @param {string} svgXml - Valid SVG element XML string
 * @param {number} targetDimension - Export resolution (e.g. 1024)
 * @param {string} mimeType - Output MIME format ('image/png' | 'image/jpeg')
 * @returns {Promise<Blob>}
 */
export function renderSvgToRasterBlob(svgXml, targetDimension = 512, mimeType = 'image/png') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetDimension;
      canvas.height = targetDimension;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Canvas 2D context unavailable'));
      }

      // Smooth scaling interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetDimension, targetDimension);

      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Raster conversion failed'));
        }
      }, mimeType);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG for conversion: ${err}`));
    };

    img.src = url;
  });
}

/**
 * Formats branded QR download filename with timestamps and alias
 */
export function generateQrFilename(alias = 'link', format = 'png', resolution = '512') {
  const sanitizedAlias = alias.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `linkpulse_qr_${sanitizedAlias}_${resolution}px_${dateStamp}.${format}`;
}
