# Design Brief

## Direction

Code Review Focus — Minimalist tech aesthetic for demo-ready professional interface with color-coded feedback hierarchy.

## Tone

Brutally minimal with purposeful depth — VS Code-inspired UI, clean whitespace, zero decoration, all substance for scan-ability.

## Differentiation

Color-coded quality score bars (red/yellow/green) and smooth category card expansion create intuitive feedback navigation.

## Color Palette

| Token      | Light OKLCH | Dark OKLCH | Role |
| ---------- | ----------- | --------- | ---- |
| background | 0.98 0.005 260 | 0.145 0.014 260 | Page surface |
| foreground | 0.15 0.01 260 | 0.95 0.01 260 | Text, primary content |
| card | 1.0 0.0 0 | 0.18 0.014 260 | Editor, feedback cards |
| primary | 0.45 0.2 265 | 0.75 0.15 190 | Interactive elements, highlights |
| accent | 0.75 0.15 190 | 0.75 0.15 190 | Cyan accent for active states |
| muted | 0.95 0.01 260 | 0.22 0.02 260 | Disabled, secondary text |

## Typography

- Display: Space Grotesk — headings, logo, section titles; bold weight for hierarchy
- Body: DM Sans — UI labels, descriptions, form fields; readable at all sizes
- Mono: Geist Mono — code blocks, syntax-highlighted editor
- Scale: hero `text-3xl font-bold tracking-tight`, h2 `text-xl font-semibold`, label `text-sm font-medium`, body `text-base`

## Elevation & Depth

Two-level card depth: base surfaces (`bg-card`) with `border-border` for structure, lifted cards on editor/feedback areas with subtle borders on hover.

## Structural Zones

| Zone | Light | Dark | Notes |
| --- | --- | --- | --- |
| Header | `bg-background border-b border-border` | `bg-card border-b border-border` | Logo, title, theme toggle |
| Editor (left 60%) | `bg-card border-r border-border` | `bg-card border-r border-border` | Syntax-highlighted code, language selector |
| Results (right 40%) | `bg-background` | `bg-background` | 5 collapsible category cards |
| Footer | — | — | None; full-screen split layout |

## Spacing & Rhythm

16px grid base (`gap-4 p-4`); category cards stack with `space-y-3`; tight vertical rhythm inside cards (8px).

## Component Patterns

- Buttons: `rounded-lg` cyan accent on primary actions, muted secondary
- Cards: `rounded-lg border border-border bg-card` with `hover:border-accent/50` transition
- Badges: inline labels with `bg-muted text-muted-foreground text-xs font-semibold`
- Quality Score: color-coded bar (green `chart-4`, amber `chart-5`, red `chart-1`)

## Motion

- Entrance: cards fade in on load via `opacity-0 animate-fade-in`
- Hover: card borders lighten, pointer cursor on interactive elements
- Decorative: smooth `transition-smooth` on all state changes

## Constraints

- No gradients, no shadows beyond subtle borders
- Dark mode is primary; light mode is secondary (toggle available)
- All colors use OKLCH tokens only; no hex or rgba literals
- Monospace code editor must maintain 4px left padding for line numbers

## Signature Detail

Smooth category card expansion with cyan border highlight creates intuitive feedback hierarchy without visual noise.

