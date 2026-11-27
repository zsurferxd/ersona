---
name: Ersona
description: Single-theme Copora-inspired editorial software studio design system for Ersona (ersona.site), pairing Bricolage Grotesque display headings, Instrument Sans body copy, and full-ratio image canvases.
colors:
  white-canvas: "#FFFFFF"
  zinc-soft-band: "#F4F4F5"
  canvas-fill: "#ECECEE"
  hairline-zinc: "#E4E4E7"
  hairline-strong: "#D4D4D8"
  obsidian-primary: "#121512"
  heading-ink: "#09090B"
  body-zinc: "#52525B"
  muted-zinc: "#71717A"
  brand-amber: "#D06512"
  focus-ochre: "#A84805"
  step-amber: "#E07A28"
  emerald-feedback: "#059669"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'Onest', system-ui, sans-serif"
    fontSize: "3.375rem"
    fontWeight: 500
    lineHeight: 1.14
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Bricolage Grotesque', 'Onest', system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Bricolage Grotesque', 'Onest', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "0em"
  body:
    fontFamily: "'Onest', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  label:
    fontFamily: "'Onest', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "0.025em"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "80px"
  4xl: "112px"
components:
  button-primary:
    backgroundColor: "{colors.obsidian-primary}"
    textColor: "{colors.white-canvas}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 28px"
    height: "52px"
  button-compact:
    backgroundColor: "{colors.obsidian-primary}"
    textColor: "{colors.white-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.white-canvas}"
    textColor: "{colors.obsidian-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
    height: "44px"
  nav-link:
    textColor: "{colors.body-zinc}"
    typography: "{typography.body}"
    height: "44px"
  card-service:
    backgroundColor: "{colors.white-canvas}"
    textColor: "{colors.heading-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-contact-box:
    backgroundColor: "{colors.white-canvas}"
    textColor: "{colors.heading-ink}"
    rounded: "{rounded.xl}"
    padding: "32px"
---

# Design System: Ersona

## Overview

**Creative North Star: "Clean Architectural Editorial Studio"**

Ersona runs on a single high-clarity light visual system inspired by modern European consultancy proportions. Clean pure white `#FFFFFF` pages alternate calmly with soft zinc neutral bands `#F4F4F5` and deep obsidian `#121512` structural contrast blocks, framing custom web development capabilities without dark-mode toggles, fake stats, or technical hardware noise.

Full-bleed aspect-ratio image canvases sit seamlessly edge-to-edge in the Hero Bento, Services cards, How-We-Work showcase, and Portfolio slots so the owner can drop in real application screenshots or photography without clipping or layout shifts.

**Key Characteristics:**
- Single cohesive light theme: crisp white (`#FFFFFF`) root, neutral soft zinc (`#F4F4F5`), and obsidian charcoal (`#121512`) accent surfaces.
- Varied self-hosted typography triad pairing expressive medium-weight `Bricolage Grotesque` headings with crisp `Onest` body text and `JetBrains Mono` strictly for contact numbers, emails, and canvas codes.
- Streamlined single-row header featuring centered navigation, sleek inline `ID / EN` text switcher, WhatsApp coordinate link, and dark rounded consultation CTA.
- Edge-to-edge full-ratio empty visual frames (`3:5`, `4:3`, `4:5`, `16:10`) ready for 1:1 `<img>` insertion.

## Colors

### Primary & Surfaces
- **Obsidian Primary** (`#121512`): Primary CTA fills, hero right dark highlight block, How-We-Work `#alur` section background, and footer foundation.
- **White Canvas** (`#FFFFFF`): Root background, sticky header backdrop, service card bodies, and direct contact box.
- **Zinc Soft Band** (`#F4F4F5`): Subtle neutral surface for the Services grid (`#sistem`), Contact band (`#kontak`), and full-ratio empty canvas slots.
- **Canvas Fill** (`#ECECEE`): Subtle tonal step for 4:3 empty service preview wells inside white cards.
- **Hairline Zinc** (`#E4E4E7`): Crisp `1px` borders dividing cards, header, and contact ledger rows.

### Ink & Accent
- **Heading Ink** (`#09090B`): High-contrast display and section headings.
- **Body Zinc** (`#52525B`): Clean readable body prose and navigation defaults.
- **Brand Amber** (`#D06512`) & **Step Amber** (`#E07A28`): Official Ersona emblem amber and subtle active step indicator inside the dark `#alur` section.
- **Focus Ochre** (`#A84805`): Keyboard `:focus-visible` outline color for strong accessibility contrast on light surfaces.
- **Emerald Feedback** (`#059669`): Reserved exclusively for clipboard `"Tersalin"` / `"Copied"` confirmation checkmarks.

### Named Rules
**The Single-Theme Polarity Rule.** Maintain one unified light theme (`#FFFFFF` canvas with `#F4F4F5` soft bands) paired with purposeful `#121512` charcoal contrast sections; omit dark-mode toggles cleanly.

**The Edge-to-Edge Full-Ratio Canvas Rule.** Reserve image frames cleanly at fixed structural aspect ratios (`3:5` tall, `4:3` card, `4:5` process, `16:10` portfolio) with zero inner padding around future `<img>` embeds.

## Typography

**Display Font:** `Bricolage Grotesque` (`font-weight: 500`–`600`), falling back to `Onest, system-ui, sans-serif` (self-hosted variable WOFF2).
**Body Font:** `Onest` (`font-weight: 400`–`600`), falling back to `system-ui, sans-serif` (self-hosted variable WOFF2).
**Mono Font:** `JetBrains Mono` (`font-weight: 500`–`600`), `font-variant-numeric: tabular-nums` (self-hosted variable WOFF2).

### Hierarchy
- **Display** (`2.25rem` mobile / `3rem` tablet / `3.375rem` desktop, weight `500`, line-height `1.14`, tracking `-0.025em`): Hero `<h1>` proposition only.
- **Headline** (`1.875rem` to `3rem`, weight `500`, line-height `1.18`, tracking `-0.025em`): Section `<h2>` headings (`#sistem`, `#alur`, `#portofolio`, `#kontak`).
- **Title** (`1.125rem` to `1.5rem`, weight `500`, line-height `1.375`): Card titles and active workflow step headings.
- **Body** (`1rem`–`1.125rem`, weight `400`, line-height `1.625`): Editorial intros capped at `46ch` to `54ch`.
- **Mono Coordinates** (`0.75rem`–`1.125rem`, `tabular-nums`): `0895-6294-60463`, `support@ersona.site`, `DEMO 01`–`03`, and canvas labels.

## Layout

Desktop width uses a spacious `max-w-[1440px]` container with generous horizontal gutters (`20px` mobile, `32px` desktop) while `#alur` and `#kontak` tighten subtly to `1260px`. The Hero splits `50 / 50` into left editorial proposition (with bottom-aligned focus summary + official email) and right 3-frame Bento (`Canvas 01` tall left, `Canvas 02` top-right, `Canvas 03` bottom-right). Downstream flow alternates White Hero -> Light Zinc Services -> Dark Obsidian Interactive Process -> White Portfolio Grid -> Light Zinc Contact Band -> Dark Footer.

## Elevation & Depth

Zero drop shadows across components; visual hierarchy relies cleanly on alternating white/zinc/obsidian surfaces and crisp `1px` structural borders (`#E4E4E7` / `zinc-800` on dark sections). Motion stays quiet with `heroSettle` (`460ms`) and `panelSwitch` (`260ms`) cubic-bezier ease-out honoring `prefers-reduced-motion`.

## Shapes

Consistent structural radius scale: `4px` on embedded canvas chips (`rounded`), `6px` (`rounded-md`) on compact mobile menu trigger and copy buttons, `8px` (`rounded-lg`) on hero CTAs, header buttons, bento frames, and service/portfolio slots, and `12px` (`rounded-xl`) on the ruled Contact card.

## Components

### Header & Inline Language Switcher
Sticky white `h-20 lg:h-24` top bar anchored on `border-b border-zinc-100`: `BrandLogo` left, four centered nav links (`Layanan`, `Alur Kerja`, `Portofolio`, `Kontak`), and right group pairing a sleek borderless `ID / EN` inline text toggle (`min-h-[44px]` click zone, active `#121512` underline), clickable mono WhatsApp link (`0895-6294-60463`), and dark `#121512` `Konsultasi` CTA (`rounded-lg`, `44px`).

### Hero Bento Canvases
Three full-bleed matte `#F4F4F5` canvases (`Canvas 01` tall left portrait, `Canvas 02` top-right landscape, `Canvas 03` bottom-right landscape) bordered on a crisp hairline `zinc-200`, ready for immediate edge-to-edge `<img>` insertion (`w-full h-full object-cover`).

### Interactive Process Tabs (`#alur`)
Dark `#121512` split showcasing a `4:5` full-ratio canvas alongside 3 single-line interactive step tabs (`01 · Diskusi`, `02 · Rancang`, `03 · Peluncuran`) with `#E07A28` active marker.

### Ruled Contact Card (`#kontak`)
White `rounded-xl` box divided by 1px borders into direct WhatsApp and Official Email rows with `44px` copy triggers and action buttons.

## Do's and Don'ts

### Do:
- **Do** preserve the single light palette alternating crisp `#FFFFFF`, `#F4F4F5`, and `#121512` surfaces.
- **Do** keep typography varied and crisp with `Bricolage Grotesque` headings, `Onest` body copy, and `JetBrains Mono` data.
- **Do** drop final project photos and sanitized screenshots edge-to-edge inside the reserved full-ratio canvas slots (`w-full h-full object-cover`).
- **Do** ensure every interactive target maintains at least `44px` hit area height and zero horizontal truncation on 390px mobile.

### Don't:
- **Don't** reintroduce a dark-mode toggle or competing dual theme switcher.
- **Don't** add network cabling / MikroTik hardware sections back onto the public software landing page.
- **Don't** wrap UI prose in unnecessary parentheses or fabricate client awards, fake statistics, or fake customer portraits.
