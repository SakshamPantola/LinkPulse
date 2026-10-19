/**
 * LinkPulse Dynamic QR Code Design Presets & Color Themes
 * Authored by Nirmay Tripathi (@nirmaytripathi)
 */

export const QR_COLOR_PRESETS = [
  {
    id: 'cyber-dark',
    name: 'Cyber Noir',
    dark: '#0f172a',
    light: '#ffffff',
    accent: '#6366f1',
    description: 'High contrast enterprise dark style suitable for print collateral',
  },
  {
    id: 'electric-indigo',
    name: 'Electric Indigo',
    dark: '#4f46e5',
    light: '#ffffff',
    accent: '#818cf8',
    description: 'Vibrant tech brand gradient tone for digital campaigns',
  },
  {
    id: 'emerald-trust',
    name: 'Emerald Shield',
    dark: '#065f46',
    light: '#ffffff',
    accent: '#10b981',
    description: 'Calm corporate security theme for trusted link sharing',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Coral',
    dark: '#9a3412',
    light: '#ffffff',
    accent: '#f97316',
    description: 'Warm, high-energy palette for retail and promotional events',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    dark: '#1e293b',
    light: '#f8fafc',
    accent: '#0ea5e9',
    description: 'Neutral minimalist layout with clean readability across scanners',
  },
  {
    id: 'royal-purple',
    name: 'Royal Amethyst',
    dark: '#581c87',
    light: '#ffffff',
    accent: '#a855f7',
    description: 'Creative and luxury brand presentation',
  },
];

export const ERROR_CORRECTION_LEVELS = [
  {
    level: 'L',
    recovery: '~7%',
    description: 'Best for crisp, small screen display with minimal data redundancy',
  },
  {
    level: 'M',
    recovery: '~15%',
    description: 'Default standard balance between scan speed and recovery',
  },
  {
    level: 'Q',
    recovery: '~25%',
    description: 'Recommended for physical print where surface scratches may occur',
  },
  {
    level: 'H',
    recovery: '~30%',
    description: 'Maximum durability for large billboards, stickers, and business cards',
  },
];

export const QR_EXPORT_SIZES = [
  { label: 'Standard (256px)', value: '256', useCase: 'Web & Email' },
  { label: 'Medium (512px)', value: '512', useCase: 'Presentations & Docs' },
  { label: 'High-Res (1024px)', value: '1024', useCase: 'Print Collateral' },
  { label: 'Ultra Vector (2048px)', value: '2048', useCase: 'Signage & Billboards' },
];

/**
 * Calculates luminance contrast ratio between foreground and background.
 * Ensures generated QR code remains easily scannable by smartphone cameras.
 */
export function calculateContrastRatio(hexDark, hexLight = '#ffffff') {
  function getLuminance(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  const lum1 = getLuminance(hexDark);
  const lum2 = getLuminance(hexLight);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Validates if the contrast is sufficient for mobile camera scanning (min 3:1).
 */
export function isScannableContrast(hexDark, hexLight = '#ffffff') {
  return calculateContrastRatio(hexDark, hexLight) >= 3.0;
}
