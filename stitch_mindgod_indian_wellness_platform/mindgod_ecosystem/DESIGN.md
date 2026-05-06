---
name: MindGod Ecosystem
colors:
  surface: '#f8faf8'
  surface-dim: '#d8dad9'
  surface-bright: '#f8faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f2'
  surface-container: '#eceeec'
  surface-container-high: '#e7e9e7'
  surface-container-highest: '#e1e3e1'
  on-surface: '#191c1b'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#eff1ef'
  outline: '#6f7977'
  outline-variant: '#bfc9c6'
  surface-tint: '#286860'
  primary: '#0d564d'
  on-primary: '#ffffff'
  primary-container: '#2e6e65'
  on-primary-container: '#adeee2'
  inverse-primary: '#93d2c7'
  secondary: '#9d4223'
  on-secondary: '#ffffff'
  secondary-container: '#fe8c66'
  on-secondary-container: '#742406'
  tertiary: '#644700'
  on-tertiary: '#ffffff'
  tertiary-container: '#825d00'
  on-tertiary-container: '#ffdc9f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#afefe3'
  primary-fixed-dim: '#93d2c7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#035048'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390b00'
  on-secondary-fixed-variant: '#7e2b0d'
  tertiary-fixed: '#ffdea6'
  tertiary-fixed-dim: '#f1bf5e'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#f8faf8'
  on-background: '#191c1b'
  surface-variant: '#e1e3e1'
typography:
  h1:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  xxl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style
The brand personality is rooted in radical empathy and emotional safety, specifically tailored for the Indian cultural context where mental health is a deeply personal journey. The design system avoids the cold, sterile aesthetic of Western health-tech in favor of an **Organic Minimalist** style. 

This style prioritizes human warmth through "soft glassmorphism"—utilizing semi-transparent layers that feel like frosted light rather than plastic. The UI evokes the feeling of a quiet, sun-drenched sanctuary. Key visual drivers include:
- **Softness:** Using rounded geometry and diffused shadows to eliminate "sharp" edges that might trigger anxiety.
- **Support:** Multi-layered surfaces that suggest depth and a "holding space" for the user.
- **Naturalism:** A focus on light, breathability, and organic movement.

## Colors
The palette is inspired by earth and sunlight, moving away from "medical blues" to "healing teals."

- **Primary Teal (#2E6E65):** Grounding and stable. Used for primary actions and key brand moments.
- **Coral Accent (#F4845F):** Warmth and energy. Used for gentle encouragement and interactive highlights.
- **Gold Accent (#F4C261):** Optimism and wisdom. Used for achievement markers, insights, and soft decorative glows.
- **Crisis Red (#DC2626):** Urgent and clear. Reserved strictly for immediate support and high-alert system states.
- **Background (#FAFAF9):** An off-white, warm "paper" tone that reduces eye strain compared to pure white.

**Gradients:** Use soft, linear flows between Teal and a lightened Gold, or Coral and a warm White. Avoid high-contrast or purple-based transitions.

## Typography
The typography pairing balances distinct character with high legibility.

- **Sora (Headings):** A geometric sans with soft edges and a unique, friendly "voice." It feels modern yet approachable.
- **Plus Jakarta Sans (Body):** Used for its high x-height and open apertures, making long-form therapy notes or guided exercises easy to read. 

Avoid all-caps for body text or long sentences to maintain a gentle tone. Use generous line-heights (1.6x) to create "breathing room" within the text.

## Layout & Spacing
This design system utilizes a **Fixed Grid** on desktop (12 columns) and a **Fluid Fluid** on mobile (4 columns). 

The spacing rhythm is based on an 8px scale, but leans heavily toward the larger end of the scale (`lg` and `xl`) to prevent the "dashboard density" common in corporate software. Containers should never feel crowded. 

**White Space as a Feature:** Negative space is treated as a calming element. Large margins (24px - 32px) around the primary content area provide the user with a sense of clarity and focus.

## Elevation & Depth
Depth is created through **Subtle Diffusion** rather than harsh shadows. 

- **Surface Layers:** Use a background blur (Backdrop Filter: blur(12px)) on white containers with 70% opacity. This creates the "glassmorphism" effect.
- **Shadows:** Use extremely soft, tinted shadows. Instead of pure black (RGBA 0,0,0), use the Primary Teal color heavily desaturated and transparent (e.g., `rgba(46, 110, 101, 0.08)`).
- **Z-Axis Hierarchy:**
  - **Level 0:** Background (#FAFAF9).
  - **Level 1:** Glass containers for secondary information.
  - **Level 2:** Solid white cards for primary content and interactive elements.
  - **Level 3:** Floating action buttons and modals with elevated soft shadows (24px blur).

## Shapes
The shape language is consistently **Rounded**. 

The base unit is 16px (`rounded-lg`), which applies to all cards, modals, and input fields. This specific radius is large enough to feel organic and friendly, but structured enough to remain functional. 

**Specific Rules:**
- **Buttons:** Fully pill-shaped (rounded-full) to encourage clicking and feel "squishy."
- **Interactive States:** On hover, cards may expand slightly (scale 1.02) with an increased shadow blur to simulate a physical lift.

## Components

- **Buttons:** High-contrast Teal for primary, Coral for secondary encouragement. Always use rounded-pill shapes. No sharp corners.
- **Cards:** White or semi-transparent glass with 16px corners and a 1px soft border (#E5E7EB or a lightened Teal).
- **Input Fields:** Soft grey backgrounds (#F3F4F6) that transition to a Teal border on focus. Use Sora for labels to maintain the brand voice.
- **Chips/Badges:** Use the Gold and Coral accents at low opacities (10-15%) for background fills with high-contrast text for categorized "mood" or "activity" tags.
- **Icons:** Use **Lucide React** icons. Set stroke weight to 1.5px or 2px to match the thickness of the Plus Jakarta Sans font.
- **Specialty Component - "The Breathing Room":** A dedicated container for meditative prompts, using a subtle Gold-to-Teal radial gradient glow in the background.
- **Checkboxes & Radios:** Circular and organic. Avoid square boxes; everything should feel cyclical and continuous.