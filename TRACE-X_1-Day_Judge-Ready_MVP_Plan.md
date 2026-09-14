# Corvyn — 1-Day Judge-Ready MVP Plan

## Executive CTO Decision

With only **1 day**, the team should **not attempt to build a complete cyber-forensics platform**.

The MVP should prove exactly one proposition:

> **Given messy telecom + financial evidence, Corvyn can reconstruct a temporal fraud network, distinguish strong from weak links, explain every important link using source evidence, and recommend the next investigative action — entirely offline.**

Everything else is secondary.

---

# 1. MVP Goal

The MVP must prove five things:

1. Upload realistic evidence.
2. Automatically normalize it.
3. Discover the fraud chain.
4. Clicking a relationship reveals **why it exists**.
5. The system handles a deliberately misleading/shared-IP relationship.
6. The system recommends what the investigator should check next.
7. The system generates a concise evidence-backed brief.

The core proposition is:

```text
Messy Evidence
      ↓
Correct Normalization
      ↓
Entity + Temporal Correlation
      ↓
Explainable Fraud Chain
      ↓
Actionable Investigation Recommendation
```

---

# 2. Scope — Brutally Reduced

## MUST HAVE

### 1. Two artifact types

Only:

- CDR CSV
- Bank/UPI transaction CSV

Optional third:

- Android dump JSON

Do not build five parsers.

### 2. Canonical event schema

Everything gets converted to:

```text
Event
├── timestamp
├── source_type
├── entity_a
├── entity_b
├── event_type
├── amount
├── metadata
├── evidence_file
├── evidence_row
└── evidence_hash
```

### 3. Entity correlation

Support:

- phone
- IMEI
- UPI ID
- bank account
- IP

Do not build complicated fuzzy identity resolution.

Use deterministic normalization + weighted evidence.

### 4. Temporal fraud-path detection

Detect:

```text
Victim
 ↓
Mule A
 ↓
Mule B
 ↓
Cash-out / endpoint
```

based on:

- transaction direction
- amount
- timestamps
- short forwarding windows

### 5. Explainable relationship scoring

Every important relationship should expose:

```text
Relationship: Account A → Account B

Evidence:
✓ Bank transaction
✓ 4-minute temporal correlation
✓ Shared device

Weak:
△ Shared IP

Confidence: 89
```

### 6. Counter-evidence

At least one deliberately implemented rule:

> **Shared IP alone is weak evidence.**

This demonstrates that Corvyn does not blindly connect everything.

### 7. Next-best action

A simple deterministic ranking:

```text
Action Priority
=
importance of node
×
uncertainty
×
potential information gain
```

Example:

> **Next Best Action: Verify Device X associated with Account B.**

No ML required.

### 8. One-page report

Generate:

- case ID
- loss amount
- timeline
- top entities
- money path
- evidence references
- confidence
- next action
- hashes

---

## SHOULD HAVE

Only if the MUST-HAVE system is working:

- Android JSON parser
- interactive filtering
- graph zoom
- timeline slider
- JSON export
- noise injection demo
- basic case statistics

---

## LATER

Do not attempt today:

- live bank APIs
- telecom APIs
- production police integrations
- sophisticated deep learning
- LLM fine-tuning
- mobile app
- cloud deployment
- multi-agency federation
- facial recognition
- social-media scraping
- automatic suspect identification
- blockchain evidence storage
- advanced APK reverse engineering

---

# 3. End-to-End Flow

```text
                ┌────────────────┐
                │ Evidence Files │
                │ CDR + BANK CSV │
                └───────┬────────┘
                        │
                        ▼
                ┌───────────────┐
                │ SHA-256 Hash  │
                └───────┬───────┘
                        │
                        ▼
                ┌────────────────┐
                │ Schema Parser  │
                └───────┬────────┘
                        │
                        ▼
                ┌────────────────┐
                │ Normalization  │
                └───────┬────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Entity Resolution   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Temporal Correlation│
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Evidence Graph      │
              └──────────┬──────────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
             Risk Engine   Counter-Evidence
                  │             │
                  └──────┬──────┘
                         ▼
                Investigation Ranker
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
           Graph      Timeline      Brief
             │
             ▼
       Investigator Feedback
```

---

# 4. Architecture

## Keep the architecture boring.

That is a compliment.

### Frontend

**React + TypeScript + Vite**

Libraries:

- Cytoscape.js — graph
- Recharts — minimal metrics
- Tailwind — UI

Why: fast development, easy demo, excellent graph support.

### Backend

**Python + FastAPI**

Why:

Python provides:

- CSV processing
- graph algorithms
- hashing
- data science
- report generation

FastAPI provides a clean local API.

### Database

**SQLite + Parquet**

Do not introduce Neo4j unless the team already has it working.

Use SQLite for:

- cases
- entities
- relationships
- evidence metadata
- scores

Use Parquet for:

- normalized events
- large datasets

Use **NetworkX** for the derived graph.

---

# 5. Services

Only six backend modules are needed:

```text
IngestionService
NormalizationService
CorrelationService
RiskService
RecommendationService
ReportService
```

These are Python modules inside one application.

**Do not build microservices for a one-day MVP.**

---

# 6. API Design

Five endpoints are enough:

```http
POST /api/cases
```

Create case.

```http
POST /api/cases/{id}/ingest
```

Upload evidence.

```http
POST /api/cases/{id}/analyze
```

Run pipeline.

```http
GET /api/cases/{id}/graph
```

Return graph.

```http
GET /api/cases/{id}/report
```

Generate report.

Optional:

```http
POST /api/cases/{id}/feedback
```

Record investigator confirmation/rejection.

---

# 7. Data Plan

## Minimum dataset

### CDR

```csv
timestamp,
caller,
callee,
duration,
imei,
imsi,
cell_id
```

### Bank / UPI

```csv
timestamp,
transaction_id,
sender_account,
receiver_account,
sender_upi,
receiver_upi,
amount,
status
```

### Optional Android

```json
{
  "timestamp": "...",
  "package": "...",
  "imei": "...",
  "phone": "...",
  "ip": "..."
}
```

---

# 8. Synthetic Data Strategy

Do not randomly generate data.

Generate a **story**.

### Ground truth

```text
Victim
  ↓ ₹80,000
Mule A
  ↓ ₹75,000
Mule B
  ↓ ₹70,000
Cash-out
```

Then generate legitimate noise around it.

For example:

```text
Victim
 ├── legitimate transaction
 ├── legitimate call
 └── fraud transaction
```

And:

```text
Mule A
 ├── fraud transfer
 ├── salary credit
 └── legitimate UPI transaction
```

This prevents the system from simply learning:

> “Everything involving Mule A is suspicious.”

---

# 9. Adversarial Data

Add deliberate traps.

### Trap 1 — Shared IP

Two accounts share an IP but are unrelated.

Expected:

> weak relationship.

### Trap 2 — Shared IMEI

Same IMEI appears with two numbers.

Expected:

> strong association, but not automatic same-person attribution.

### Trap 3 — Duplicate bank transaction

Expected:

> deduplicated.

### Trap 4 — Timestamp formatting mismatch

Example:

```text
2026-09-13 14:02:11
13/09/2026 14:02:11
```

Expected:

> same normalized timestamp.

---

# 10. Missing Data

Do not crash.

Example:

```text
IMEI = NULL
```

The system should still use:

- transaction evidence
- temporal evidence
- phone/account relationship

Confidence becomes lower.

UI:

> **Incomplete evidence — IMEI unavailable.**

Never fabricate information.

---

# 11. Core Intelligence

## Stage 1 — Deterministic Normalization

Normalize:

### Phone

```text
+91 98765 43210
09876543210
9876543210
```

→

```text
9876543210
```

### UPI

Lowercase and trim.

### Account

Strip spaces and formatting.

### Timestamp

Convert all timestamps to a canonical internal representation after explicitly defining the assumed source timezone.

---

# 12. Stage 2 — Entity Graph

Create nodes:

```text
PHONE
IMEI
IMSI
ACCOUNT
UPI
IP
TRANSACTION
```

Create edges based on direct evidence.

Example:

```text
PHONE --USES--> IMEI
ACCOUNT --OWNS/USES--> UPI
ACCOUNT --TRANSFERRED_TO--> ACCOUNT
```

---

# 13. Stage 3 — Evidence-Weighted Correlation

Start with deterministic weights.

| Evidence | Weight |
|---|---:|
| Exact transaction | +40 |
| Same IMEI | +25 |
| Same IMSI | +20 |
| Strong temporal overlap | +15 |
| Repeated communication | +10 |
| Same IP | +5 |
| Shared infrastructure indicator | −10 |

These are **prototype heuristic weights**, not scientifically validated weights.

Make that explicit.

---

# 14. Stage 4 — Temporal Forwarding Detection

This is the MVP's most important algorithm.

For each incoming transaction:

```text
A → B at t1
```

search for:

```text
B → C
```

where:

```text
t2 > t1
t2 - t1 <= WINDOW
```

Example:

```text
WINDOW = 15 minutes
```

Then search another hop.

Output:

```text
A → B → C
```

with:

- time_delta
- amount_ratio
- hop_count

---

# 15. Example Temporal Chain

Input:

```text
14:31 Victim → A ₹100,000

14:33 A → B ₹96,000

14:38 B → C ₹92,000

14:42 C → Cashout ₹90,000
```

Corvyn detects:

> **4-hop rapid fund flow**

with:

> **9-minute total duration**

and:

> **90% amount retention**

This is a powerful investigative signal.

---

# 16. Risk Score

Use a transparent heuristic:

```text
risk =
    transaction_velocity_score
  + rapid_forwarding_score
  + multi_hop_score
  + device_reuse_score
  + cross_artifact_score
  - weak_infrastructure_penalty
```

Normalize to:

```text
0–100
```

Example:

```text
Rapid forwarding      +25
3+ hop chain           +20
High amount retention  +20
Device reuse           +15
Cross-artifact match   +10
Shared IP only          -5
-------------------------
                        85
```

Labels:

```text
0–39   Low
40–69  Medium
70–100 High
```

**Risk ≠ guilt.**

---

# 17. Do You Need ML?

## No — not for the MVP.

A deterministic + graph + heuristic engine is:

- explainable
- reproducible
- offline
- easy to test
- easy to demonstrate
- easier to defend to forensic judges

### AI can come later for:

- ambiguous entity resolution
- anomaly ranking
- natural-language investigation assistant
- historical pattern matching

For a one-day prototype, AI is more likely to create risk than value.

---

# 18. Optional AI Component

If an AI element is required for the demo, use an LLM **only after the deterministic engine**.

Input:

```json
{
  "top_entities": [...],
  "money_paths": [...],
  "evidence": [...],
  "risk_factors": [...]
}
```

LLM output:

> concise investigator explanation.

Never allow:

```text
raw evidence → LLM → suspect
```

Instead:

```text
raw evidence
 ↓
deterministic engine
 ↓
structured facts
 ↓
LLM
 ↓
natural-language summary
```

Ideally, make the LLM optional.

---

# 19. Recommendation Engine

MVP recommendation score:

```text
priority =
  node_risk
×
uncertainty
×
network_importance
```

Example:

```text
Account B

Risk = 91
Uncertainty = 0.7
Centrality = 0.8

Priority = 50.96
```

Rank candidates.

Output:

> **Next Best Action: Verify Account B's linked device.**

This is a **ranking heuristic**, not a proven information-gain optimizer. Call it that.

---

# 20. Team Plan — 6 Members

## Member 1 — Tech Lead / Integration

Own:

- architecture
- data contracts
- Git
- integration
- demo reliability

Dependency: everyone.

## Member 2 — Data / Ingestion

Build:

- CDR parser
- bank parser
- normalization
- hashing
- synthetic generator

Deliverable:

```text
raw → canonical events
```

## Member 3 — Correlation / Graph

Build:

- graph model
- entity linking
- temporal path algorithm
- NetworkX processing

Deliverable:

```text
events → graph
```

## Member 4 — Risk / Intelligence

Build:

- risk scoring
- evidence weights
- counter-evidence
- next-best-action ranking

Deliverable:

```text
graph → findings
```

## Member 5 — Frontend

Build:

- case upload
- graph
- timeline
- entity details
- recommendation panel

## Member 6 — Reports / QA / Demo

Build:

- PDF
- JSON
- test dataset
- adversarial cases
- demo script
- screenshots/video

Member 6 should not wait until the end. The test dataset needs to exist early.

---

# 21. Dependencies

```text
             Data Engineer
                  │
                  ▼
           Canonical Schema
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    Correlation          Frontend
        │
        ▼
      Risk
        │
        ▼
 Recommendation
        │
        ├──────────► Report
        │
        └──────────► Demo
```

Frontend can build using mocked JSON immediately.

---

# 22. 1-Day Roadmap

## Hour 0–1 — Lock Architecture

All six together.

Decide:

- schema
- API contracts
- sample case
- graph entities
- scoring rules

**Do not code yet.**

---

## Hour 1–3 — Parallel Build

### Member 2

Build parsers.

### Member 3

Build graph model.

### Member 4

Build scoring engine.

### Member 5

Build frontend shell.

### Member 6

Build synthetic dataset + ground truth.

### Member 1

Integrate contracts.

---

## Hour 3–5 — First End-to-End Milestone

Pipeline:

```text
CSV
 ↓
Parser
 ↓
Graph
 ↓
Risk
 ↓
API
 ↓
UI
```

If this does not work by hour 5:

> **STOP adding features. Fix the pipeline.**

---

## Hour 5–7

Add:

- temporal path detection
- evidence provenance
- confidence
- counter-evidence

---

## Hour 7–9

Frontend polish:

```text
Case
↓
Timeline
↓
Graph
↓
Evidence
↓
Recommendation
```

---

## Hour 9–10

Build PDF report.

---

## Hour 10–11

Adversarial tests:

- missing fields
- duplicates
- shared IP
- malformed timestamps
- false links

---

## Hour 11–12

### Demo freeze

No new features.

Record:

1. Clean run.
2. Explainability.
3. False-positive suppression.
4. Report.

---

# 23. Repo Structure

```text
corvyn/
│
├── README.md
├── requirements.txt
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── cases.py
│   │   ├── ingestion.py
│   │   ├── analysis.py
│   │   └── reports.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── hashing.py
│   │
│   ├── ingestion/
│   │   ├── cdr.py
│   │   ├── bank.py
│   │   └── normalize.py
│   │
│   ├── graph/
│   │   ├── builder.py
│   │   ├── entity_resolution.py
│   │   └── temporal_paths.py
│   │
│   ├── intelligence/
│   │   ├── risk.py
│   │   ├── evidence.py
│   │   ├── counter_evidence.py
│   │   └── recommendations.py
│   │
│   ├── reports/
│   │   └── pdf.py
│   │
│   └── models/
│       └── schemas.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   │   ├── Graph.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── EvidencePanel.tsx
│   │   │   └── Recommendation.tsx
│   │   ├── api/
│   │   └── types/
│   └── package.json
│
├── data/
│   ├── raw/
│   ├── normalized/
│   ├── synthetic/
│   └── ground_truth/
│
├── tests/
│   ├── test_parsers.py
│   ├── test_normalization.py
│   ├── test_graph.py
│   ├── test_temporal.py
│   ├── test_risk.py
│   └── test_adversarial.py
│
└── docs/
    ├── architecture.md
    └── demo.md
```

---

# 24. Testing

## Test 1 — Basic Ingestion

Input:

```text
100 CDR rows
100 transactions
```

Expected:

> all valid rows normalized.

## Test 2 — Phone Normalization

Input:

```text
+91 98765 43210
09876543210
9876543210
```

Expected:

> same canonical phone.

## Test 3 — Duplicate Transactions

Expected:

> one logical transaction.

## Test 4 — Rapid Forwarding

Expected:

```text
A → B → C
```

correctly discovered.

## Test 5 — Slow Forwarding

If A → B and B → C occur 3 days later:

Expected:

> no rapid-fraud chain.

## Test 6 — Shared IP

Expected:

> weak association.

## Test 7 — Shared IMEI

Expected:

> strong device relationship, but not automatic person attribution.

## Test 8 — Missing IMEI

Expected:

> analysis continues with lower confidence.

## Test 9 — Corrupted File

Expected:

> reject with useful error, not backend crash.

## Test 10 — Hash Mismatch

Expected:

> evidence flagged.

---

# 25. Acceptance Criteria

## Functional

- [ ] CDR ingestion works.
- [ ] Bank ingestion works.
- [ ] SHA-256 recorded.
- [ ] Data normalized.
- [ ] Graph generated.
- [ ] Temporal chain discovered.
- [ ] Risk score generated.
- [ ] Evidence explanation displayed.
- [ ] Weak IP association handled.
- [ ] Next action generated.
- [ ] PDF generated.

## Reliability

- [ ] No backend crash on missing optional fields.
- [ ] Duplicate rows handled.
- [ ] Invalid rows logged.
- [ ] Offline demo works.

## Demo

- [ ] Clean case runs in <1 minute.
- [ ] Graph understandable in <10 seconds.
- [ ] Every major edge is explainable.
- [ ] WOW moment works deterministically.

---

# 26. Evaluation

## Baseline

Use:

> **manual cross-correlation using spreadsheets.**

Measure time to identify:

1. primary mule
2. money path
3. top investigation target

---

# 27. MVP Metrics

### 1. Entity resolution F1

Use ground truth generated by the dataset.

### 2. Money-path precision

```text
correct fraud edges
-------------------
all predicted fraud edges
```

### 3. Money-path recall

```text
correct fraud edges
-------------------
all ground-truth fraud edges
```

### 4. False-link rate

Critical:

```text
false association rate
=
false edges / predicted edges
```

Target:

> <10% on adversarial benchmark.

### 5. Top-3 Recommendation Precision

How often is the recommended investigation target actually relevant?

### 6. Time-to-Insight

Target:

> **<60 seconds for the demo case.**

Baseline should be experimentally measured.

---

# 28. Example Evaluation

Suppose manual investigation takes:

```text
13 minutes
```

and Corvyn takes:

```text
37 seconds
```

Then:

```text
13 min → 37 sec
```

is compelling.

Do not claim a percentage until the benchmark is actually run.

---

# 29. Demo Flow — 3 Minutes

## 0:00–0:20 — Problem

Show:

> ₹2.84L fraud complaint.

Four fragmented files.

Say:

> “The evidence exists, but the relationship between these artifacts is hidden.”

## 0:20–0:40 — Ingestion

Drag:

```text
CDR.csv
Bank.csv
```

System:

```text
Hash verified
2,438 records
413 entities
```

## 0:40–1:10 — Automatic Correlation

Graph appears.

Highlight:

```text
Victim
 ↓
Mule A
 ↓
Mule B
 ↓
Cashout
```

## 1:10–1:30 — Timeline

Show:

```text
14:31
14:33
14:38
14:42
```

System identifies:

> 11-minute rapid multi-hop routing.

## 1:30–2:00 — Explainability

Click:

```text
Mule A → Mule B
```

Panel:

```text
CONFIDENCE: 91

✓ Bank transaction
✓ 5-minute temporal proximity
✓ Shared device
△ Shared IP

Sources:
bank.csv / row 238
cdr.csv / row 1928
```

This proves the central innovation.

## 2:00–2:25 — WOW Moment

Click:

> **“Simulate missing/weak evidence.”**

Remove the IP relationship.

System:

```text
Risk
91 → 86
```

Then explain:

> “The system didn't collapse because one weak signal disappeared. More importantly, it never treated that weak signal as proof in the first place.”

## 2:25–2:45 — Next Action

System:

> ### NEXT BEST ACTION
> Verify Device X associated with Mule B.

Why?

```text
High-risk node
+
high uncertainty
+
connects 3 other entities
```

## 2:45–3:00 — Report

Generate one-page PDF.

End with:

> **Fragmented evidence → explainable network → prioritized investigation in seconds.**

Then stop.

---

# 30. What NOT to Demo

Avoid:

- ChatGPT-style chatbot
- 3D graph
- 15 ML models
- fake live bank API
- fake police database integration
- “AI predicts criminal”
- facial recognition
- generic anomaly detection
- huge dashboard
- meaningless 97% accuracy claim

---

# 31. Fallbacks

## No Internet

Core application still works.

This should be a feature, not a contingency.

## LLM Unavailable

Report generator falls back to:

> deterministic template.

## Graph Library Fails

Display:

- table
- timeline
- relationship list

## Large File

Process in chunks.

Use Polars/DuckDB.

## Missing Field

Lower confidence.

Never fabricate.

## Invalid Schema

Show:

> unsupported column / missing required field.

Offer a sample mapping.

## Database Failure

For MVP, write analysis artifacts to local JSON/Parquet.

---

# 32. MVP vs Production

| Capability | MVP | Production |
|---|---|---|
| CDR | CSV | Multiple telecom schemas |
| Bank | CSV | Bank/API integrations |
| Graph | NetworkX | Scalable graph DB |
| Storage | SQLite/Parquet | PostgreSQL/object storage |
| AI | Optional LLM explanation | governed ML/LLM |
| Risk | Heuristics | validated models |
| Deployment | Offline workstation | enterprise/on-prem |
| Auth | Basic | RBAC/SSO |
| Audit | Basic | immutable audit architecture |
| Reports | Template PDF | forensic reporting workflow |
| Data | Synthetic | governed real cases |
| Feedback | Manual | learning loop |
| APK | Basic metadata | forensic analysis |
| Collaboration | None | multi-user cases |

---

# 33. Brutal Technical Review

## Risk #1 — Overbuilding

Probability:

> **Very high**

Fix:

> Freeze scope around **CDR + bank → temporal graph → explainability → next action.**

---

## Risk #2 — Fake AI

If judges realize the “AI” is merely:

> LLM summarizes deterministic output

that is okay.

The problem statement says AI-powered, but the evaluation values forensic accuracy and integrity.

A transparent algorithm is better than unnecessary ML.

Position it as:

> **hybrid intelligent correlation engine**

rather than pretending everything is deep learning.

---

## Risk #3 — Graph Becomes Spaghetti

A graph with 400 nodes is useless.

Fix:

Default view:

> top 15 investigative entities.

Filters:

- risk
- relationship
- time
- evidence strength

The investigator expands the graph deliberately.

---

## Risk #4 — Risk Score Looks Arbitrary

It is at MVP stage.

Therefore label:

> **Prototype heuristic score**

and show its components.

Do not pretend it was trained on national crime data.

---

## Risk #5 — “Court Admissible”

This wording could get attacked.

Use:

> **Evidence-traceable investigative brief**

rather than:

> Court-admissible forensic summary.

Explain that admissibility is determined under applicable forensic/legal procedures.

---

## Risk #6 — Calling a Person a Criminal

Never.

Use:

- entity
- account of interest
- high-risk node
- probable mule behavior
- investigative lead

Not:

> criminal identified.

---

## Risk #7 — Synthetic Data Bias

Judges may say:

> “Your demo works because you created the dataset.”

Fix:

Show:

> **ground truth + noise + adversarial cases**

Explain exactly how the benchmark is generated.

Even better, have one case where the system **doesn't** find the correct path because evidence is missing.

Then show:

> “Insufficient evidence.”

That builds trust.

---

## Risk #8 — Too Much AI Terminology

Avoid:

- Agentic AI
- RAG
- Multi-agent system
- LLM orchestration
- Deep neural graph transformer

unless actually needed.

For this MVP, those terms mostly increase attack surface.

---

## Risk #9 — Building a Chatbot

Do not.

If someone suggests:

> “Let's add an AI chat assistant.”

Say:

> **No.**

Improve the evidence panel instead.

---

# 34. What NOT to Build

This list should literally go into the internal project board.

Do not build:

- mobile application
- cloud SaaS
- user registration
- payment system
- live bank APIs
- telecom APIs
- WhatsApp integration
- social media scraping
- APK reverse engineering
- malware sandbox
- facial recognition
- voice recognition
- blockchain
- NFT anything
- microservices
- Kubernetes
- autonomous AI agents
- model fine-tuning
- custom LLM
- real-time streaming
- 3D graph
- 20 different charts
- generic chatbot
- predictive “criminal score”
- automatic person identification
- complex RBAC
- multi-agency collaboration
- fancy landing page

**Every one of these can wait.**

---

# 35. Final Technical Stack

### Frontend

**React + TypeScript + Vite**

- Cytoscape.js
- Tailwind CSS

### Backend

**Python + FastAPI**

### Data

**Polars + DuckDB + SQLite**

### Graph

**NetworkX**

### Validation

**Pydantic**

### Hashing

**SHA-256 / hashlib**

### PDF

**ReportLab**

### Optional AI

**LLM API or local model only for explanation/report wording**

### Deployment

**Local Python + React**

For a one-day MVP, prefer local execution over spending time containerizing everything.

---

# 36. Final Architecture

```text
                         CORVYN
                           │
              ┌────────────┴────────────┐
              │                         │
        React Investigation UI      Local API
              │                         │
              │                    FastAPI
              │                         │
              │          ┌──────────────┼──────────────┐
              │          │              │              │
              │       Ingestion     Intelligence    Reports
              │          │              │              │
              │          ▼              ▼              ▼
              │       Polars        Risk Engine      PDF
              │       DuckDB        Graph Engine     JSON
              │          │              │
              │          ▼              ▼
              │       SQLite       NetworkX
              │                         │
              │                  Temporal Engine
              │                         │
              └───────────────┬─────────┘
                              │
                         Evidence Graph
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
          Supporting Evidence       Counter Evidence
                 │                         │
                 └────────────┬────────────┘
                              ▼
                    Next Best Action
```

---

# 37. Top 5 Features

## 1. Temporal Fraud Chain Reconstruction

Automatically:

> Victim → Mule → Mule → Cash-out.

**Core WOW.**

## 2. Evidence-Backed Entity Correlation

Every edge answers:

> **Why are these two entities connected?**

## 3. Confidence + Counter-Evidence

The system can say:

> **“This relationship is weak.”**

That is more impressive than simply finding relationships.

## 4. Next-Best Investigation Action

Tell the officer:

> **what to investigate next and why.**

## 5. Evidence-Traceable One-Page Brief

Turns analysis into an operational artifact.

---

# 38. Metrics

The scoreboard should show:

```text
┌──────────────────────────────┐
│ CORVYN BENCHMARK             │
├──────────────────────────────┤
│ Records processed:    2,438  │
│ Entities discovered:    413  │
│ Fraud hops found:         4  │
│ False-link rate:       X.X%  │
│ Path precision:        XX%   │
│ Path recall:           XX%   │
│ Top-3 action precision: XX%  │
│ Time-to-insight:       XX sec│
└──────────────────────────────┘
```

**Only fill X/XX after actually measuring it.**

---

# 39. Final Readiness Score

### Current concept

**8.5/10**

### With the one-day MVP executed exactly as above

**9/10 SIH readiness**

### With generic “AI + graph + dashboard”

**6/10**

### With an over-engineered “multi-agent AI cybercrime platform”

**5/10**

### Why 9/10 is not 10

The missing piece is **real-world validation on properly governed investigative datasets**.

That cannot be solved honestly in one day.

But the team can demonstrate a rigorous path toward it.

---

# 40. Final Verdict

## **WIN-WORTHY — IF THE TEAM STAYS DISCIPLINED**

The MVP should not attempt to prove that Corvyn can solve cybercrime.

It needs to prove something much narrower and much more believable:

> **Corvyn can take fragmented evidence, reconstruct a temporally coherent fraud network, distinguish strong evidence from weak association, show the investigator exactly why a relationship exists, and prioritize the next thing worth investigating.**

That is the **single product thesis**.

### The core judge-facing screen

```text
╔══════════════════════════════════════════════════════╗
║ CASE #CYB-001             ₹2.84L       HIGH RISK     ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║                 VICTIM                               ║
║                    │                                 ║
║                 ₹2.84L                               ║
║                    ▼                                 ║
║               ┌────────┐                             ║
║               │ MULE A │  91                         ║
║               └───┬────┘                             ║
║                   │ ₹2.7L / 3 min                   ║
║                   ▼                                 ║
║               ┌────────┐                             ║
║               │ MULE B │  87                         ║
║               └───┬────┘                             ║
║                   │ ₹2.5L / 4 min                   ║
║                   ▼                                 ║
║               CASH-OUT                              ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║ WHY IS MULE B LINKED?                                ║
║                                                      ║
║ ✓ Bank transaction          +40                     ║
║ ✓ Temporal correlation      +15                     ║
║ ✓ Shared device             +25                     ║
║ △ Shared IP                   +5                     ║
║                                                      ║
║ Confidence: 89%                                      ║
║                                                      ║
║ Evidence: bank.csv#238 · cdr.csv#1928               ║
╠══════════════════════════════════════════════════════╣
║ NEXT BEST ACTION                                     ║
║                                                      ║
║ → Verify Device X associated with Mule B             ║
║                                                      ║
║ Reason: High-risk node + unresolved identity        ║
╚══════════════════════════════════════════════════════╝
```

## The one sentence judges should remember

> **“Corvyn doesn't just draw the fraud graph. It proves why the graph exists and tells the investigator what to do next.”**
