# Kisan Seva — Design Brief

## Direction
Luxury India-first digital farm management platform. Built for Indian farmers who deserve dignified, modern tools — not generic web apps repainted green. Every screen should feel like it was made for India, not adapted from the West.

## Tone
Dignified, warm, and trustworthy. Rooted in Indian agricultural heritage — the gravitas of a trusted cooperative office, the warmth of a village panchayat, the clarity of a modern CA firm. Never corporate-cold, never playful-childish.

## Differentiation
Serif display headings (Cormorant Garamond) carry the weight of heritage and dignity — used for farm names, section titles, and the KS Farm ID display. DM Sans body text delivers clean, scannable readability at small sizes on low-cost Android screens. JetBrains Mono distinguishes financial codes and IDs from prose. Marigold gold (#F9A825) signals prosperity and harvest — the colour of mustard fields and celebration.

## Color Palette

| Role | Hex | OKLCH | Use |
|---|---|---|---|
| Primary | #1B5E20 | oklch(0.38 0.11 148) | Primary actions, sidebar, active states |
| Secondary | #2E7D32 | oklch(0.44 0.14 152) | Supporting elements, hover states |
| Accent | #F9A825 | oklch(0.68 0.18 72) | MSP badge, gold highlights, CTAs |
| Background | #FAFAF7 | oklch(0.99 0.003 120) | All page surfaces, warm off-white |
| Foreground | — | oklch(0.2 0.04 148) | Body text, near-black with green tint |
| Card | — | oklch(0.97 0.005 120) | Card surfaces, slightly warmer than bg |
| Muted | — | oklch(0.92 0.008 148) | Disabled states, secondary backgrounds |
| Border | — | oklch(0.88 0.01 148) | Borders, dividers, subtle lines |

## Typography

| Role | Family | Weight | Use |
|---|---|---|---|
| Display | Cormorant Garamond | 600–700 | Farm name, section headings, KS Farm ID label |
| Body | DM Sans | 400–500 | All UI text, labels, descriptions, form fields |
| Mono | JetBrains Mono | 400–500 | Income codes (AI-CRP-001), KS Farm ID values, financial figures |

Minimum body size: 14px. Touch targets: 44px minimum on mobile.

## Elevation & Depth
Warm card shadows only — `box-shadow: 0 1px 4px rgba(27,94,32,0.08), 0 2px 12px rgba(27,94,32,0.04)`. No harsh black drop shadows. Elevated modals: `0 8px 40px rgba(27,94,32,0.14)`. Sidebar uses a subtle right border, not a shadow.

## Structural Zones

| Zone | Desktop | Mobile | Background |
|---|---|---|---|
| Sidebar / Nav | Left 240px fixed | Hidden (drawer) | Primary green bg |
| Bottom Nav | Hidden | Fixed bottom 56px | bg-card with top border |
| Top Header | Thin 48px strip | 48px with hamburger | bg-card with bottom border |
| Content Area | Right of sidebar | Full width | bg-background |
| Card Surfaces | — | — | bg-card with green left border |
| Section Alternates | Even sections | Even sections | bg-muted/40 |

## Spacing & Rhythm
4px base grid. Page padding: 16px mobile, 24px tablet, 32px desktop. Card inner padding: 16px. Section gaps: 24px. Touch targets: 44px minimum height on mobile. Minimum viewport: 360px (Redmi/Realme Android).

## Component Patterns
- **Info cards**: Subtle green left border (3px solid primary), bg-card, warm shadow
- **Crop stage badges**: Pill shape, colour-coded by stage (Sowing → Harvested)
- **MSP badge**: Gold star icon + gold text, bg-accent/10 pill
- **KS Farm ID**: JetBrains Mono, green tint, copy button on right
- **Income codes**: Monospace pill (AI-CRP-001), muted background, subtle border
- **Alert cards**: Red/amber left border for warnings (PHI, MSP gap, expiry)
- **Bottom nav**: 5 icons max, active state uses primary green with gold indicator dot
- **Form sections**: Grouped with dividers, related fields in 2-column on tablet+

## Motion
- Page transitions: slide-in from right (forward), slide-out to right (back), 200ms ease-out
- Skeleton loaders: shimmer animation on card placeholders, 1.4s cycle
- Entrance animations: fade + translate-y(8px) → 0, staggered 80ms per card
- Loading refresh: Indian farm–themed SVG animations (tractor, plough, paddy wave) — random selection per session
- `prefers-reduced-motion`: all animations disabled, instant transitions, no shimmer

## Constraints
- 360px minimum viewport width — every component must work at 360px
- No Dollar signs, no US state references, no Western crop names as primary
- No decorative emojis in production UI (emoji only in family member avatars by user choice)
- No harsh black shadows, no neon colors, no gradients on text
- Indian number format throughout: ₹1,12,000 not ₹112,000; quintals not bushels
- All dates in DD/MM/YYYY format; all financial years as FY 2025-26 format

## Signature Detail
The KS Farm ID (format `KS-AP-2026-483921`) is displayed in JetBrains Mono with a subtle green tint, a copy-to-clipboard button, and a thin green left border accent on its container card. This ID appears on the farm profile, every CA PDF page header, and the QR code. It is the farm's permanent digital identity — treat it with the same visual weight as a PAN card number.
