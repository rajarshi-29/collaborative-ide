---
name: ui-review
description: >-
  Procedures and visual inspection criteria for reviewing IDE user interface components, color contrast,
  fluid micro-interactions, responsive adaptability, and theme switching fidelity.
---

# UI & Visual Design Review Runbook

This skill guides comprehensive UI/UX design reviews across the IDE. Use this procedure whenever evaluating new components, micro-animations, or layout refactors to ensure a state-of-the-art developer experience.

---

## 1. Review Checklist & Evaluation Matrix

### A. Design System & Token Integrity
- [ ] **Zero Hardcoded Colors**: Verify no raw hex codes (`#1e1e1e`, `#ffffff`) or RGB strings exist in component CSS or inline styles. Everything must map to CSS variables (`var(--bg-main)`, `var(--text-bright)`, `var(--border-subtle)`).
- [ ] **Pure Vanilla CSS**: Confirm zero TailwindCSS classes or ad-hoc inline utility strings.
- [ ] **Multi-Theme Compliance**: Switch between all available themes (`atom-one-dark`, `dracula`, `tokyo-night`, `github-dark`, `light`) and confirm:
  - Contrast ratios satisfy WCAG AA standards (minimum 4.5:1 for body text).
  - Borders and active states remain distinct against dark canvas backgrounds.
  - Syntax highlighting palettes adjust cleanly with editor theme switches.

### B. Organic Animations & Physics
- [ ] **Fluid Aesthetics**: For liquid or floating widgets (such as the AI Research Droplet):
  - Is the border-radius morphing organically with non-linear easing?
  - Are specular caustics and depth highlights visible?
  - Does the contact-point ripple origin align precisely with cursor coordinates?
  - Does the squash-and-stretch bounce convey convincing surface tension?
- [ ] **Compositor Efficiency**: Verify all CSS animations exclusively animate `transform`, `opacity`, and `filter`. Verify no keyframe animates layout-triggering properties (`width`, `height`, `left`, `top`).

### C. Spatial Dynamics & Viewport Clamping
- [ ] **Boundary Clamping**:
  - Drag the element to all 4 corners: does it stop cleanly at the top header ($y \ge 38\text{px}$) and status bar ($y \le \text{window.innerHeight} - 70\text{px}$)?
  - Does horizontal movement stop at least $8\text{px}$ before window edges?
- [ ] **Adaptive Placement**:
  - Move the trigger button near the bottom edge: does the attached dropdown panel flip upward?
  - Move near the top edge: does it flip downward?
  - Does the panel scale outward from the physical anchor coordinates via `transform-origin`?
  - Does window resizing recalculate positions without clipping or visual jumps?

### D. Typography & Hierarchy
- [ ] **Font Hierarchy**:
  - UI labels use modern sans-serif (`Inter`, `system-ui`).
  - Code blocks, line numbers, and terminal output use clean monospace fonts (`Fira Code`, `monospace`).
- [ ] **State Feedback**:
  - Hover states on interactive chips, buttons, and tab close icons have smooth 150ms transitions.
  - Loading indicators feature spinning or pulsing micro-animations.

---

## 2. Screenshot Capture & Inspection Workflow

1. **Automated Capture Script**:
   Use an Electron test script to capture full-viewport PNGs of the target UI state:
   ```javascript
   const img = await win.webContents.capturePage();
   fs.writeFileSync(path.resolve(__dirname, 'ui_review_target.png'), img.toPNG());
   ```
2. **Visual Inspection**:
   Use the `view_file` tool to inspect the generated PNG image directly.
3. **Check for Visual Defects**:
   - Overlapping text or cramped line heights.
   - Text clipping or ellipsis overflow failures.
   - Broken icons or misaligned flex children.
   - Inconsistent padding or border radii across adjacent panels.
