# 🎨 LinkPulse Glassmorphic Design System & Layout Specs
*Authored by Tushar Tiwari (@tiwaritushar02)*

## 1. Visual Design Architecture
LinkPulse uses an ultra-clean, high-contrast dark theme powered by pure CSS custom properties, backdrop blur filters, and fluid layout cards.

## 2. Core Color Palette
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `--color-bg-primary` | `#0b0f19` | Main application backdrop |
| `--color-surface-card` | `rgba(17, 24, 39, 0.75)` | Glassmorphic floating surfaces |
| `--color-primary-indigo` | `#6366f1` | Primary CTA buttons, badges & links |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.08)` | Minimal dividers & table borders |
| `--color-success-emerald` | `#10b981` | Active link pills, human-verified traffic |
| `--color-warning-amber` | `#f59e0b` | Bot scrapers, near-expiry alerts |
| `--color-danger-rose` | `#ef4444` | Phishing warnings, blocked domain gates |

## 3. Responsive Breakpoints
- **Mobile Handsets**: `< 640px` (Collapsible slide-out navigation drawer)
- **Tablets & Small Laptops**: `640px - 1024px` (Two-column stacked metrics cards)
- **High-Res Workstations**: `> 1024px` (Full three-tier telemetry analytics workspace)

## 4. Typography Hierarchy
Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Page Titles**: `1.75rem (28px)`, Font Weight: `700`, Letter Spacing: `-0.025em`
- **Section Headers**: `1.125rem (18px)`, Font Weight: `600`
- **Body & Captions**: `0.875rem (14px)`, Line Height: `1.5`
- **Code & Short Codes**: Monospace font family with background badge padding
