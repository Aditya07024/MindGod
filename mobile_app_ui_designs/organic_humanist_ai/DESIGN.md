---
name: Organic Humanist AI
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3f4947'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
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
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
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
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is anchored in **Organic Humanism**, a style that prioritizes emotional safety and accessibility over clinical precision. It is designed to feel like a "living" companion—warm, softly-lit, and deeply attentive. 

By blending **Minimalism** with **Tactile** softness, the interface avoids the coldness often associated with AI. The aesthetic uses generous whitespace to reduce cognitive load, while subtle depth and warm tones create a sense of physical presence. The experience should evoke the feeling of a sun-drenched morning: clear, calm, and hopeful.

## Colors

The palette is inspired by natural elements: earth, flora, and sunlight. 
- **Primary (Soft Teal):** Represents groundedness and growth. Used for main actions and brand presence.
- **Accent (Coral):** Used sparingly for highlights, secondary actions, and moments of gentle encouragement.
- **Gold:** Reserved for "Cultural Streaks"—special insights, streaks, or high-value achievements—to signify warmth and value.
- **Crisis (Red):** A clear, high-visibility tone reserved strictly for emergency features or critical health alerts.
- **Background (Warm Off-White):** Provides a soft, non-reflective canvas that reduces eye strain compared to pure white.

## Typography

Typography balances character with legibility. **Sora** is utilized for headlines with tight tracking and bold weights to provide a confident, modern architectural feel. 

**Plus Jakarta Sans** handles all functional and long-form text. Its soft, rounded terminals maintain the "organic" brand promise while ensuring high readability during meditation guides or AI chat interactions. Use increased line-height (1.5x+) for body text to maintain an airy, calm feel.

## Layout & Spacing

This design system employs a **mobile-first fluid layout**. The interface is optimized for thumb-driven navigation, placing high-frequency interactions within the "natural reach zone" (bottom two-thirds of the screen).

- **Grid:** A 4-column fluid grid for mobile, expanding to a centered 8-column layout on tablets.
- **Rhythm:** An 8px linear scale drives all spacing. 
- **Safe Areas:** Maintain a minimum 20px margin on all screen edges to prevent elements from feeling "cramped" against the device bezel.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and tonal layering rather than lines.
- **Surface Level 0:** The `#FAFAF9` background.
- **Surface Level 1 (Cards):** Pure white `#FFFFFF` with a very soft, diffused shadow (0px 4px 20px rgba(46, 110, 101, 0.05)).
- **Interactive Depth:** Elements should feel "pressed" into the surface when active, rather than hovering higher. 
- **Glassmorphism:** Use subtle backdrop blurs (12px) on fixed navigation bars to maintain context of the content scrolling beneath them.

## Shapes

The shape language is defined by extreme friendliness and the absence of sharp corners.
- **Standard UI Elements:** Use a 16px radius for smaller containers and input fields.
- **Primary Cards:** Use a 24px radius to create a distinct, nested look against the device edges.
- **Interactive Elements:** Buttons and tags must be fully rounded "pills" to encourage touch and reinforce the non-clinical aesthetic.

## Components

### Buttons & Controls
- **Primary Action:** Full-width pill buttons using the Soft Teal background and white text.
- **Secondary Action:** Ghost pill buttons with a 1px Soft Teal border or Coral text.
- **Thumb-Friendly:** Bottom-anchored "Floating Action Buttons" (FABs) for primary AI chat triggers.

### Cards
- White backgrounds only. No borders. Use the 24px corner radius. Padding within cards should be a minimum of 20px to ensure the content "breathes."

### Input Fields
- Softened rectangles (16px radius) with a subtle off-white fill (darker than the main background) to indicate interactivity. No harsh bottom-lines.

### Chips & Tags
- Used for mood tracking or interest selection. Always pill-shaped. Active states use the Soft Teal; inactive states use a muted version of the background.

### Icons
- Use **Lucide** icons with a 'Regular' weight. Icons should be paired with text labels for accessibility whenever possible. Avoid high-contrast black; use a deep variant of the Primary Teal for icons.

### Chat Interface
- AI bubbles use a Soft Teal background; User bubbles use the warm Background color with a subtle border. This distinguishes the "AI Companion" as the primary source of guidance.