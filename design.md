---
name: Modern Authoring
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1c'
  surface-container: '#202020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#303030'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  display-title:
    fontFamily: Merriweather
    fontSize: 42px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  editor-text:
    fontFamily: Merriweather
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  ui-header:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  ui-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  ui-body:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-label:
    fontFamily: jetbrainsMono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  panel-width: 320px
  editor-max-width: 800px
  gutter: 1rem
  stack-gap: 0.5rem
  section-gap: 2rem
---

## Brand & Style

The design system is centered on a "Deep Focus" philosophy, specifically tailored for long-form composition and narrative architecture. The aesthetic is **Modern Corporate** with a heavy lean into **Minimalism**, stripping away interface chrome to prioritize the written word.

The target audience consists of professional authors, novelists, and screenwriters who require a high-end, distraction-free environment. The UI should evoke a sense of calm, intellectual rigor, and digital permanence. Visual cues are borrowed from modern IDEs (Integrated Development Environments) but softened with literary elegance to avoid a purely "technical" feel.

The interface utilizes a "Lights Out" approach, where the background remains deep and static, while active elements are highlighted through subtle shifts in tonal luminosity rather than vibrant color pops.

## Colors

This design system uses a sophisticated dark-mode palette designed to minimize eye strain during extended night-time writing sessions.

- **Primary (Indigo):** Used sparingly for primary actions, focus indicators, and active selection states. It provides a modern, professional spark within the dark environment.
- **Secondary (Slate):** Used for metadata, inactive icons, and auxiliary text. It provides necessary information without competing for the user's attention.
- **Neutral (Charcoal):** The foundation of the system. We use three tiers of charcoal to create visual hierarchy: `#121212` for the application shell/sidebar, `#1e1e1e` for the main editor background, and `#2a2a2a` for floating panels or tooltips.
- **Success/Warning/Error:** Use muted, de-saturated versions of green, amber, and red to maintain the professional atmosphere.

## Typography

The typography strategy is a dual-font system. **Inter** handles the "Application Layer"—menus, buttons, sidebars, and settings—where clarity and density are paramount. **Merriweather** is reserved for the "Content Layer"—the actual manuscript—providing a warm, literary feel that is optimized for long-form reading.

- **The Editor:** The `editor-text` role uses a generous line height (1.7x) and slight tracking to ensure words don't feel crowded.
- **The UI:** Headers use semi-bold weights in Inter with a slight uppercase treatment for section titles in the sidebar.
- **Command Palette:** Uses `ui-body` for results and `mono-label` for keyboard shortcut hints.

## Layout & Spacing

The layout is a rigid, docked system typical of professional desktop software. It consists of three primary zones:

1.  **Navigation Sidebar (Left):** Fixed width, contains the project tree and manuscript hierarchy.
2.  **The Stage (Center):** A fluid area containing the editor. The text itself is constrained to an `editor-max-width` of 800px to maintain comfortable line lengths, centered within the stage.
3.  **Inspector Panel (Right):** Collapsible panel for notes, character sketches, or outline details.

Spacing follows an 8px grid system. Most UI components use 4px or 8px internal padding. The "Stage" uses large margins (32px+) to create a sense of focus and separation from the surrounding interface tools.

## Elevation & Depth

In this dark-themed system, we avoid heavy drop shadows, which can look muddy on dark backgrounds. Depth is communicated through **Tonal Layering** and **Subtle Outlines**:

- **Level 0 (Background):** The darkest layer (#121212) used for the sidebar and status bar.
- **Level 1 (Base):** The editor surface (#1e1e1e).
- **Level 2 (Overlays):** Modal dialogs and the Command Palette. These use a slightly lighter background (#2a2a2a) and a 1px solid border (#333333) to distinguish them from the base.
- **Interactions:** Hover states are indicated by a subtle increase in luminosity (approx +5%) rather than a color change.

## Shapes

The design system uses a **Soft** shape language. Given the professional nature of the app, we avoid overly rounded "pill" shapes which can feel too casual.

- **Primary UI Elements:** (Buttons, Input fields, Sidebar items) use a 4px corner radius.
- **Large Surfaces:** (Cards, Modals, Toast notifications) use an 8px corner radius.
- **Search Bars:** The command palette input uses a slightly more rounded 6px radius to distinguish it as a global search tool.

## Components

### Buttons
Buttons are low-profile. The primary action button uses a solid Indigo background with white text. Secondary buttons use a ghost style with a subtle slate border that brightens on hover.

### Command Palette
The central interaction hub. It should appear as a floating modal in the top-center. It features a transparent search icon, a de-saturated placeholder ("Type a command or search..."), and a list of results where the keyboard shortcut (e.g., `⌘N`) is aligned to the right in a monospace font.

### Sidebar Items
List items in the manuscript tree use a "hover-on-row" style. The active document is indicated by a vertical indigo 2px line on the far left of the row and a subtle highlight across the background.

### Inputs & Settings
Input fields are "inset" with a dark background (#121212) and a 1px border. When focused, the border changes to Indigo. Settings are organized in a clean, single-column list with toggle switches for features like "Typewriter Mode" or "Spellcheck."

### Toast Notifications
Small, unobtrusive alerts that slide in from the bottom-right. They use a dark-grey background with a high-contrast left-border colored by status (Indigo for info, Red for error).

### Editor Chrome
The status bar at the bottom is minimal, displaying word count and sync status in `ui-label` typography, using the Slate color to remain non-distracting.
