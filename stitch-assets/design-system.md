---
name: Safety Glass
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e2'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fc'
  surface-container: '#ededf6'
  surface-container-high: '#e7e7f1'
  surface-container-highest: '#e1e2eb'
  on-surface: '#191b22'
  on-surface-variant: '#434653'
  inverse-surface: '#2e3037'
  inverse-on-surface: '#f0f0f9'
  outline: '#737784'
  outline-variant: '#c3c6d5'
  surface-tint: '#1d59c1'
  primary: '#003c90'
  on-primary: '#ffffff'
  primary-container: '#0f52ba'
  on-primary-container: '#bcceff'
  inverse-primary: '#b0c6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#732900'
  on-tertiary: '#ffffff'
  tertiary-container: '#993900'
  on-tertiary-container: '#ffc0a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00419c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b22'
  surface-variant: '#e1e2eb'
  hazard-major: '#EF4444'
  hazard-overdue: '#991B1B'
  hazard-impending: '#F59E0B'
  surface-bg: '#F8F9FA'
  surface-card: '#FFFFFF'
  sidebar-bg: rgba(255, 255, 255, 0.7)
typography:
  display-brand:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  section-header:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  list-title:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  status-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 260px
  sidebar-collapsed: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  card-padding: 24px
  stack-gap: 12px
---

## Brand & Style

This design system embodies a **Modern, Trustworthy, and Data-Driven** personality tailored for safety management. The visual language is a refined mix of **Minimalism** and **Glassmorphism**, prioritizing clarity and auditability without sacrificing contemporary aesthetics.

The system utilizes a soft, off-white background as a canvas for high-elevation white cards. This creates a clear mental model of "sheets of data" stacked in a digital environment. Subtle backdrop blurs and semi-transparency are reserved for secondary UI elements like sidebars and floating action bars to provide a sense of depth and focus. The overall mood is professional, calm, and highly organized, ensuring that critical safety hazards are never lost in visual noise.

## Colors

The palette is anchored by a **Professional Safety Blue** (#0F52BA) used for primary actions and navigation states, and a **Success Green** (#10B981) for completed statuses.

The "Traffic Light" system is strictly implemented via named colors to signal urgency:
- **Major/Critical:** High-saturation Reds for immediate danger.
- **Impending:** Warm Ambers for preventative warnings.
- **Surface:** The background uses a specific off-white (`#F8F9FA`) to reduce eye strain during long audits, while primary content rests on pure white cards to maximize contrast.

Glassmorphism is applied to the navigation sidebar using a semi-transparent white with a 20px backdrop blur, allowing the primary background colors to subtly bleed through.

## Typography

The system uses **Manrope** for headlines to provide a modern, technical feel with excellent legibility. **Inter** is used for all functional body text, data tables, and labels, chosen for its neutral tone and superior performance in high-density data environments.

- **Hierarchy:** Use strong weight contrasts (e.g., Semi-bold titles against Regular body) to guide the eye through complex hazard reports.
- **Numbers:** Tabular lining should be used for timestamps and coordinates to ensure vertical alignment in list views.
- **Scaling:** On mobile, display and headline sizes are reduced to prevent excessive word wrapping, while body sizes remain constant for accessibility.

## Layout & Spacing

This design system uses a **Fluid-Fixed Hybrid Grid**. 

- **Desktop:** A fixed-width left sidebar (260px) persists for global navigation. The main content area uses a fluid 12-column grid with 24px gutters. Detailed views often utilize a "Dual-Pane" layout where a list resides in a 4-column span and the details expand into the remaining 8 columns.
- **Mobile:** A single-column vertical stack with 16px horizontal margins. The navigation moves to a fixed bottom tab bar for ergonomic thumb access.
- **Rhythm:** An 8px linear scale governs all spacing. Components like list items are separated by a 12px `stack-gap` to maintain visual distinction while remaining information-dense.

## Elevation & Depth

Visual hierarchy is established through a **Tonal & Glassmorphic Layering** system:

1.  **Level 0 (Floor):** The off-white background (`#F8F9FA`).
2.  **Level 1 (Cards):** Pure white surfaces with a soft, expansive shadow (0px 8px 24px rgba(0,0,0,0.04)). This is the primary container for all data.
3.  **Level 2 (Overlays/Sidebar):** Semi-transparent layers (`rgba(255,255,255,0.7)`) with a 20px backdrop blur. Used for the fixed navigation and floating filters to suggest they exist on a separate plane above the scrolling content.
4.  **Level 3 (Modals/Popovers):** Higher contrast shadows (0px 16px 48px rgba(0,0,0,0.08)) to indicate blocking interactions or critical secondary actions.

## Shapes

The shape language is **Rounded and Organic**, softening the technical nature of safety data to make the tool more approachable.

- **Primary Containers:** All main cards and panels use a `rounded-xl` (24px) corner radius.
- **Interactive Elements:** Buttons and input fields use a standard `rounded-lg` (12px-16px) for a balanced professional look.
- **Status Pills:** Tags and status indicators use a full `pill-shaped` (100px) radius to distinguish them from functional buttons.
- **Visual Style:** Avoid sharp edges entirely to maintain the "Glassmorphism" aesthetic.

## Components

### Buttons & Chips
- **Primary Button:** Solid Safety Blue, rounded corners, white text. No shadow; depth is conveyed via slight hover color shifts.
- **Secondary/Ghost:** Transparent background with a 1px border or subtle gray fill.
- **Status Chips:** Pill-shaped, high-contrast labels with light backgrounds (e.g., a 10% opacity Red fill with 100% Red text for "Major Hazard").

### Cards
- Standard containers for "Issues" and "Tasks." Cards must include a padding of 24px and should never have a border. Use a vertical layout for content on mobile and horizontal "row" layouts for desktop lists.

### Input Fields
- Soft gray backgrounds (`#F1F3F5`) with no borders in their default state. Upon focus, they transition to a white background with a 2px Primary Blue border.

### Sidebar Navigation
- Icons should be modern, "thin-line" style. Active states are indicated by a solid blue vertical bar on the left and a subtle background tint behind the icon.

### Status Lights
- For employee duty tracking, use perfectly circular "Status Lights" (Red/Yellow/Green) with a subtle inner glow to mimic physical LEDs.