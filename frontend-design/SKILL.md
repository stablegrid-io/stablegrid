---
name: frontend-design
description: Design and implement distinctive, production-grade frontend interfaces for web projects. Use when the user asks to build or redesign frontend components, pages, landing pages, dashboards, or full web apps and wants strong visual direction, custom typography, motion, and non-generic aesthetics.
---

# Frontend Design

Build real, production-grade frontend code with a clear visual point of view. Avoid generic "AI slop" output by committing to intentional choices and executing them consistently.

## Workflow

1. Clarify the brief.
- Extract the core purpose, target users, and device constraints.
- Confirm stack and technical limits (framework, performance, accessibility, browser support).

2. Commit to one aesthetic direction.
- Pick a strong direction before coding: editorial, brutalist, retro-futurist, luxury, playful, industrial, organic, etc.
- Define one memorable differentiator that makes the interface recognizable.

3. Design the system.
- Set typography, palette, spacing scale, border radius rules, and motion language.
- Define CSS variables (or theme tokens) before implementing components.

4. Implement the interface.
- Build working code in the requested stack (HTML/CSS/JS, React, Vue, Next.js, etc.).
- Ensure layout quality on both desktop and mobile breakpoints.
- Keep interactions purposeful: one polished load sequence is better than many shallow effects.

5. Validate quality.
- Check keyboard and focus behavior.
- Verify color contrast and readable type scales.
- Remove decorative effects that hurt legibility or performance.

## Aesthetic Rules

- Use expressive typography.
- Pair a characterful display font with a readable body font.
- Avoid default-looking stacks (`Inter`, `Roboto`, `Arial`, plain `system-ui`) unless project constraints require them.

- Build a cohesive color system.
- Use dominant tones with clear accents.
- Avoid timid palettes and overused purple-on-white gradient defaults.

- Use motion with intent.
- Prefer meaningful transitions, staged reveals, and hover/scroll effects tied to hierarchy.
- Favor CSS-first motion for simple cases and use animation libraries only when needed.

- Compose space intentionally.
- Use asymmetry, overlap, scale contrast, or controlled density when they support the concept.
- Avoid template-like, predictable card grids unless required by the product.

- Build atmospheric backgrounds.
- Use gradients, textures, meshes, patterns, or layered transparency that fit the concept.
- Avoid flat single-color backgrounds when they weaken the direction.

## Guardrails

- Match complexity to concept.
- Use restraint for refined/minimal aesthetics.
- Use richer structure and motion only when the concept calls for maximalism.

- Preserve existing systems when required.
- Follow established design systems when extending an existing product.
- Push visual originality more aggressively only in greenfield or explicitly exploratory work.
