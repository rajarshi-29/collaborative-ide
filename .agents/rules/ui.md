# UI & Design System Guidelines

This document establishes the UI/UX design guidelines, styling rules, and animation standards for the Collaborative IDE. Aesthetics, smooth micro-interactions, and visual excellence are critical requirements.

---

## 1. Styling Philosophy: Vanilla CSS Only

- **No TailwindCSS**: In accordance with project standards, all styling must be written in **Pure Vanilla CSS**. Do not introduce Tailwind classes or utility-first frameworks.
- **Design System Tokens**: Use CSS custom properties defined in `src/styles/themes.css` for all colors, borders, and surfaces:
  - Surface backgrounds: `var(--bg-main)`, `var(--bg-panel)`, `var(--bg-hover)`, `var(--bg-active)`, `var(--bg-card)`
  - Text colors: `var(--text-bright)`, `var(--text-main)`, `var(--text-muted)`, `var(--text-dim)`
  - Accent colors: `var(--accent-primary)`, `var(--accent-hover)`, `var(--accent-glow)`
  - Borders: `var(--border-subtle)`, `var(--border-strong)`
- **Theme Support**: The IDE supports multiple themes (`atom-one-dark`, `dracula`, `tokyo-night`, `github-dark`, `light`). Never hardcode colors like `#1e1e1e` or `#ffffff` in component inline styles; always use CSS variables.

---

## 2. Fluid Organic Aesthetics & Water Droplet Physics

Specialty floating features (such as the AI Research Assistant Droplet) must feature organic, physical interactions that feel alive:

### Continuous Morphing Border-Radius
Use asymmetric, non-uniform border radii oscillating across keyframes to produce a dynamic liquid surface:
```css
@keyframes dropletMorph {
  0% { border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%; }
  25% { border-radius: 54% 46% 58% 42% / 44% 56% 44% 56%; }
  50% { border-radius: 48% 52% 42% 58% / 56% 44% 56% 44%; }
  75% { border-radius: 52% 48% 54% 46% / 46% 54% 46% 54%; }
  100% { border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%; }
}
```

### Specular Caustics & Depth Highlights
Layer multiple gradient caustics and inset shadows to mimic light refraction through water:
- Inner top highlight: `inset 2px 2px 5px rgba(255, 255, 255, 0.45)`
- Bottom refractive shadow: `inset -2px -2px 6px rgba(14, 165, 233, 0.35)`
- Ambient glow: `0 8px 24px rgba(56, 189, 248, 0.3)`

### Contact-Point Ripple Waves
When clicked, ripples must originate at the **exact pointer coordinates**:
```javascript
const rect = buttonNode.getBoundingClientRect();
const rippleX = e.clientX - rect.left;
const rippleY = e.clientY - rect.top;
```
The ripple ring expands outward with `@keyframes dropletRipple`, scaling from `0` to `2.4` while fading from `opacity: 0.8` to `0`.

### Elastic Squash-and-Stretch
Mimic fluid surface tension on click by triggering an elastic squash animation (`dropletSquash`):
```css
@keyframes dropletSquash {
  0% { transform: scale(1, 1); }
  25% { transform: scale(1.18, 0.82); }
  50% { transform: scale(0.88, 1.14); }
  75% { transform: scale(1.04, 0.96); }
  100% { transform: scale(1, 1); }
}
```

---

## 3. GPU-Accelerated Animation Rules

To maintain a consistent 60 FPS in desktop environments alongside Monaco editor workers:
1. **Animate Compositor Properties Only**: Animate `transform`, `opacity`, and `filter`. Never animate geometry properties (`width`, `height`, `left`, `top`, `margin`, `padding`) in CSS keyframes.
2. **Hardware Acceleration**: Promote animated floating layers using `will-change: transform, border-radius;` or `transform: translateZ(0);`.
3. **Reduced Motion**: Respect user accessibility preferences by including `@media (prefers-reduced-motion: reduce)` fallbacks that disable continuous morphing loops.

---

## 4. Adaptive Panel Geometry & Positioning

Panels that open relative to floating anchors must adapt dynamically to available viewport space:

```
                  ┌───────────────────────────────┐
                  │    Panel Opens Upward         │
                  │ (When space below is < 360px) │
                  └───────────────▲───────────────┘
                                  │
                               ┌──┴──┐
                               │ Orb │ (Anchor)
                               └──┬──┘
                                  │
                  ┌───────────────▼───────────────┐
                  │   Panel Opens Downward        │
                  │ (When space below is >= 360px)│
                  └───────────────────────────────┘
```

1. **Vertical Evaluation**:
   - Calculate `spaceBelow = window.innerHeight - anchorRect.bottom - 12`.
   - Calculate `spaceAbove = anchorRect.top - 12`.
   - If `spaceBelow >= 360px` or `spaceBelow >= spaceAbove`, open downward (`top: anchorRect.bottom + 8px`, `verticalOrigin = 'top'`).
   - Otherwise, flip upward (`bottom: window.innerHeight - anchorRect.top + 8px`, `verticalOrigin = 'bottom'`).
2. **Horizontal Clamping**:
   - Initial center alignment: `left = anchorRect.left + (anchorRect.width / 2) - (panelWidth / 2)`.
   - Clamped to viewport: `left = Math.max(12, Math.min(window.innerWidth - panelWidth - 12, left))`.
   - Update `horizontalOrigin` ('left', 'center', or 'right') to match alignment.
3. **Dynamic Scaling Origin**:
   - Set `transform-origin: ${verticalOrigin} ${horizontalOrigin};`.
   - On opening, scale from `0.85` to `1.0` outward from the physical anchor point.
