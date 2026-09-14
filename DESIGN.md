---
name: Corvyn Tactical Cyber Forensic Terminal
description: High-security air-gapped forensic incident triage and multi-hop cyber fraud correlator
colors:
  bg-void: "#050608"
  bg-primary: "#07080c"
  bg-surface: "#0b0d13"
  bg-surface-elevated: "#10131c"
  bg-surface-highlight: "#171b26"
  accent-amber: "#f59e0b"
  accent-amber-glow: "#fbbf24"
  accent-amber-deep: "#d97706"
  accent-crimson: "#ef4444"
  accent-emerald: "#10b981"
  accent-cyan: "#38bdf8"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-tertiary: "#64748b"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  outer: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-amber}"
    textColor: "{colors.bg-void}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.bg-surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
---

## Overview

Corvyn employs an **Obsidian & Cyber Amber** tactical terminal design system inspired by high-security incident command centers and defense telemetry platforms. The interface is engineered for rapid visual comprehension during the high-stress "golden hour" of financial cyber fraud interdiction. It eliminates decorative distraction in favor of strict causal network representations, cryptographic verification seals, and high-density evidentiary ledgers.

## Colors

- **Void Backgrounds**: Deep layered obsidian darks (`#050608` void base, `#07080c` primary, `#0b0d13` surface, `#10131c` elevated containers).
- **Tactical Amber Accent**: Primary telemetry signal (`#f59e0b`, `#fbbf24` glow, `#d97706` deep); represents live forensic correlation, active investigation, and golden-hour countdown status.
- **Alert Crimson**: Immediate risk signals (`#ef4444`); identifies high-confidence mule accounts, fraudulent transaction routing, and multi-hop dispersion anomalies.
- **Integrity Emerald**: Cryptographic assurance (`#10b981`); denotes verified SHA-256 digests, Section 65B compliance, and confirmed non-tampered evidence files.
- **High-Contrast Text**: `#f8fafc` primary for headers and values, `#94a3b8` secondary for labels and field descriptors, `#64748b` for borders and technical divisions.

## Typography

- **UI Sans Stack**: `Plus Jakarta Sans` (-apple-system, BlinkMacSystemFont, sans-serif) delivers high legibility at micro and display scales with tight `-0.02em` to `-0.03em` tracking.
- **Forensic Mono Stack**: `JetBrains Mono` is strictly utilized for cryptographic SHA-256 digests, account numbers, IFSC codes, timestamps, phone numbers, and transit metrics.

## Layout

- Fluid 12-column double-bezel grid hierarchy.
- **Top Command Bar**: Full-width dossier status, live golden-hour interdiction timer, SHA-256 hash counters, and executive export controls.
- **Central Graph Canvas (70% column)**: Directional causal network graph with interactive entity inspection, temporal filters, and confidence threshold controls.
- **Side Panels (30% column)**: Actionable statutory field directives, court-admissible seizure notices, and line-item evidence proof drawers.

## Elevation & Depth

- **Double-Bezel Nested System**: Outer chassis container with faint amber hairline border (`rgba(245, 158, 11, 0.16)`) and inner core container (`rgba(11, 13, 19, 0.92)`).
- **Soft Volumetric Glows**: Selective zero-blur or soft 16-24px amber glows behind active badges and primary tactical buttons to signify live operational state without flat costume styling.

## Shapes

- Concentric radius scale: `16px` outer shell cards, `12px` inner core panels, `6px-8px` inner metric boxes and badges, `9999px` status beacon pills.
- Chamfered reticle corner accents (`.reticle-corner`) providing tactical military-grade framing.

## Components

- **Tactical Shell / Core**: Nested dual-container layout with subtle amber perimeter lighting.
- **HUD Beacon Pills**: Pulsing status indicators (`.beacon-dot`) denoting live air-gapped processing and golden-hour alerts.
- **Forensic Dossier Modal**: Interactive court-admissible dossier viewer with tabbed navigation (Summary, Transit Chain, Mule Directory, Seizure Orders, Hash Manifest).
- **Action Buttons**: Primary amber gradient with high-contrast dark text; secondary slate with hairline borders.

## Do's and Don'ts

### Do's
- Always pair color indicators (crimson/amber/emerald) with textual labels or icons for accessible multi-modal identification.
- Always display cryptographic SHA-256 hashes in monospace font with one-click copy functionality.
- Keep data density high while preserving scannable hierarchy: line-item raw evidence must always be accessible in proof drawers.

### Don'ts
- Never use generic neon-cyan SaaS gradients or decorative floating cards.
- Never display an ambiguous or coincidental relationship (e.g. shared public WiFi IP) as a definitive fraud link without confidence qualification.
- Never use emoji as UI iconography; rely exclusively on consistent Lucide SVG icons.
