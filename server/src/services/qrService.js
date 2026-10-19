
const QRCode = require('qrcode');
const { query } = require('../db');
const config = require('../config');

async function generateQr(linkId, userId, role, {
  format = 'png',
  size = 300,
  darkColor = '#000000',
  lightColor = '#ffffff',
} = {}) {
  const { rows } = await query('SELECT * FROM links WHERE id = $1', [linkId]);
  if (!rows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  const link = rows[0];

  if (role !== 'admin' && link.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const targetUrl = `${config.baseUrl}/${link.short_code}?src=qr`;
  const qrOptions = {
    margin: 2,
    width: Math.min(Math.max(parseInt(size, 10) || 300, 100), 1000),
    color: {
      dark: darkColor || '#000000',
      light: lightColor || '#ffffff',
    },
  };

  if (format === 'svg') {
    const svg = await QRCode.toString(targetUrl, { ...qrOptions, type: 'svg' });
    return {
      contentType: 'image/svg+xml',
      data: svg,
      shortCode: link.short_code,
      targetUrl,
    };
  }

  const pngBuffer = await QRCode.toBuffer(targetUrl, { ...qrOptions, type: 'png' });
  return {
    contentType: 'image/png',
    data: pngBuffer,
    shortCode: link.short_code,
    targetUrl,
  };
}

async function getQrDetails(linkId, userId, role) {
  const { rows } = await query('SELECT * FROM links WHERE id = $1', [linkId]);
  if (!rows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  const link = rows[0];

  if (role !== 'admin' && link.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const targetUrl = `${config.baseUrl}/${link.short_code}?src=qr`;

  const statsRes = await query(
    `SELECT
       COUNT(*)::int AS total_clicks,
       COUNT(CASE WHEN source = 'qr' THEN 1 END)::int AS qr_scans
     FROM click_events
     WHERE link_id = $1 AND is_bot = false`,
    [linkId]
  );

  const stats = statsRes.rows[0];
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    margin: 2,
    width: 320,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return {
    link: {
      id: link.id,
      short_code: link.short_code,
      destination_url: link.destination_url,
      status: link.status,
    },
    targetUrl,
    qrDataUrl,
    totalClicks: stats.total_clicks || 0,
    qrScans: stats.qr_scans || 0,
    qrPercentage: stats.total_clicks > 0
      ? Math.round((stats.qr_scans / stats.total_clicks) * 100)
      : 0,
  };
}

module.exports = {
  generateQr,
  getQrDetails,
};
