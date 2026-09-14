# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary**: Investigating Officers (IOs) and Cyber Crime Police units (station inspectors, field units, cyber-cell analysts) conducting rapid evidence triage during the critical "golden hour" following a reported cyber fraud incident.
- **Secondary**: Hackathon / Screening round evaluation judges assessing technical feasibility, evidentiary integrity, forensic validity, and usability for police field units.

## Product Purpose

Corvyn is an automated, lightweight digital forensic triage and multi-source correlation engine designed to run offline on police workstations. It ingests messy, fragmented cyber fraud evidence (telecom CDR/IPDR logs, bank/UPI settlement sheets, Android system dumps), reconstructs directional fraud and communication networks, isolates deceptive false leads (e.g., shared public IPs), explains the empirical source records backing every link, and outputs court-admissible forensic briefs with immediate field seizure recommendations.

## Positioning

Unlike heavy enterprise digital forensic suites that require costly infrastructure or cloud backends, and unlike naive graph visualizers that generate tangled unexplainable hairballs, Corvyn is:
- **100% Offline & Lightweight**: Operates air-gapped on standard police laptop/workstation hardware with zero external API dependencies.
- **Explainable Link Strength**: Rigorously differentiates strong transactional/direct causality from weak coincidental co-occurrences (e.g., distinguishing a true mule transfer chain from a shared public WiFi router IP).
- **Forensic Chain-of-Custody**: Preserves SHA-256 hash verification for all ingested files and maps every graph relationship directly to verifiable line-item source records.

## Operating Context

- **Environment**: Local police workstations, field laptops, and cyber incident response cells; often air-gapped or operating under restricted bandwidth.
- **Temporal Pressure**: The "golden hour" post-reporting, where freezing accounts, identifying mule cash-out points, and tracing switched SIMs/IMEIs must occur before funds disperse across international or crypto bridges.
- **Artifacts Handled**: Telecom CSV/Excel (CDR, IPDR), bank/UPI settlement sheets (IMPS, NEFT, UPI VPA transaction exports), email headers (.eml), and mobile dump logs (JSON/text).

## Capabilities and Constraints

### Confirmed Capabilities
- Multi-source artifact ingestion with automated schema normalization and cryptographic SHA-256 hashing.
- Entity resolution across phone numbers, bank accounts, UPI handles, IMEI/IMSI identifiers, and IP addresses.
- Directional multi-hop fraud flow reconstruction (Victim -> Layer-1 Mule -> Layer-2 Mule -> Cash-Out ATM/Merchant).
- Link confidence scoring and anomaly detection (high-velocity SIM switching, immediate multi-hop fund routing).
- False-lead dampening / noise suppression (penalizing shared public IP hubs and high-density towers).
- Interactive forensic evidence drawer displaying exact raw records behind selected nodes or hops.
- One-page court-admissible investigative brief and timeline export (PDF/JSON) with immediate asset freezing and hardware seizure recommendations.

### Constraints & Invariants
- Strict local execution without external network requirements.
- Absolute evidentiary integrity: no synthetic or hallucinated linkages; all links must cite source records and line numbers.

## Brand Commitments

- **Name**: Corvyn (AI-Powered Unified Cyber Fraud Analysis & Digital Artifact Correlator).
- **Voice & Tone**: Authoritative, forensic, rigorous, court-admissible, restrained, mission-critical. No decorative marketing fluff or speculative jargon.
- **Visual Stance**: Professional law-enforcement cyber-defense terminal / command interface. High information density, scannable hierarchies, unambiguous risk status indicators (crimson/amber/emerald), and dedicated evidentiary inspection modes.

## Evidence on Hand

- Problem Statement: [`PS.md`](file:///d:/TraceX/PS.md) defining law-enforcement evaluation criteria and core deliverables.
- 1-Day MVP Plan: [`TRACE-X_1-Day_Judge-Ready_MVP_Plan.md`](file:///d:/TraceX/TRACE-X_1-Day_Judge-Ready_MVP_Plan.md) outlining canonical event schemas, confidence formulas, and UI specifications.
- Mock Case Generator & Seed Data: [`seed_case.py`](file:///d:/TraceX/seed_case.py) and [`data/`](file:///d:/TraceX/data).
- Operational Backend: FastAPI correlation engine, SQLite database, ingestion parsers in [`backend/`](file:///d:/TraceX/backend).
- Operational Frontend: React 18 + TypeScript + Vite + Cytoscape dashboard in [`frontend/`](file:///d:/TraceX/frontend).

## Product Principles

1. **Evidentiary Integrity Above All**: Every node, edge, and cluster must point directly to verifiable line-item source data and SHA-256 hashes. If evidence is missing or ambiguous, explicitly disclose the uncertainty.
2. **Explainable Link Strength**: Distinguish strong transactional causality from coincidental co-presence. Never display an ambiguous link as proof without contextual qualification.
3. **Actionable for Field Units**: Prioritize actionable intelligence over decorative complexity. An investigating officer needs to immediately see who to intercept, which accounts to freeze, and what devices to seize.
4. **Zero-Cloud Air-Gapped Reliability**: Ensure complete functionality without external network dependencies, suited for standard police workstation constraints.

## Accessibility & Inclusion

- High-contrast visual design compliant with law enforcement viewing environments (low-light control rooms or bright field screens).
- Multi-modal risk signaling: color-coded indicators must always be paired with textual labels, distinct icons, or badges so that status is identifiable regardless of color perception.
- Keyboard-accessible tabular and timeline views alongside the interactive graph canvas.
