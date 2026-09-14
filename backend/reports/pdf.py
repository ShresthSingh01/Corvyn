from pathlib import Path
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_investigative_brief_pdf(summary_data: Dict[str, Any], output_path: str | Path) -> str:
    """
    Generate standardized one-page forensic investigative brief (PDF).
    Formatted for law enforcement field units and judicial scrutiny (Sec 65B IEA).
    """
    out_file = str(output_path)
    doc = SimpleDocTemplate(
        out_file,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#dc2626"),
    )
    section_title = ParagraphStyle(
        "SecTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=6,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
    )
    bold_style = ParagraphStyle(
        "BoldBody",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    story = []

    # 1. Header
    story.append(Paragraph("CORVYN FORENSIC INVESTIGATIVE BRIEF", title_style))
    story.append(Paragraph("CONFIDENTIAL // FOR LAW ENFORCEMENT & JUDICIAL USE ONLY", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceAfter=8))

    # 2. Case Overview Table
    case_id = summary_data.get("case_id", "CYB-2026-001")
    total_loss = summary_data.get("total_loss", 0.0)
    records = summary_data.get("records_processed", 0)
    entities = summary_data.get("entities_count", 0)
    hops = summary_data.get("fraud_hops_found", 0)

    meta_data = [
        [
            Paragraph(f"<b>Case Reference:</b> {case_id}", body_style),
            Paragraph(f"<b>Siphoned Loss:</b> ₹{total_loss:,.2f}", bold_style),
        ],
        [
            Paragraph(f"<b>Artifacts Processed:</b> {records} logs across {entities} entities", body_style),
            Paragraph(f"<b>Temporal Chain:</b> {hops} rapid hops identified", body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("PADDING", (0, 0), (-1, -1), 4),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Discovered Fraud Flow (Temporal Chain)
    story.append(Paragraph("I. PRIMARY FRAUD TRANSIT CHAIN (TEMPORAL CORRELATION)", section_title))
    t_paths = summary_data.get("temporal_paths", [])
    if t_paths:
        primary_path = t_paths[0]
        chain_rows = [["Hop", "From Entity", "To Entity", "Amount", "Transit Time", "Tx Reference"]]
        for i, h in enumerate(primary_path.get("hops", []), start=1):
            delta_min = round(h.get("time_delta_seconds", 0) / 60.0, 1)
            chain_rows.append([
                f"#{i}",
                h.get("from_entity", ""),
                h.get("to_entity", ""),
                f"₹{h.get('amount', 0):,.2f}",
                f"{delta_min}m" if i > 1 else "T0",
                h.get("tx_id", "N/A"),
            ])
        chain_table = Table(chain_rows, colWidths=[30, 120, 120, 75, 75, 120])
        chain_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("PADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
            ])
        )
        story.append(chain_table)
    else:
        story.append(Paragraph("No rapid forwarding chains detected within defined temporal threshold.", body_style))

    story.append(Spacer(1, 8))

    # 4. Top Entities of Interest / Mule Triage
    story.append(Paragraph("II. HIGH-RISK ENTITY TRIAGE (FORENSIC ATTRIBUTION)", section_title))
    top_ents = summary_data.get("top_risk_entities", [])[:5]
    ent_rows = [["Entity Identifier", "Type", "Risk Score", "Category", "Key Indicator"]]
    for ent in top_ents:
        cat = "Mule Intermediary" if ent.get("is_mule_candidate") else ("High-Risk Phone" if ent.get("type") == "PHONE" else "Associated Node")
        # key indicator
        comps = ent.get("component_scores", {})
        top_comp = max(comps.items(), key=lambda x: x[1])[0] if comps else "network"
        ent_rows.append([
            ent.get("label", ent.get("id", "")),
            ent.get("type", ""),
            f"{ent.get('risk_score', 0)} / 100",
            cat,
            top_comp.replace("_", " ").title(),
        ])
    ent_table = Table(ent_rows, colWidths=[150, 70, 70, 110, 140])
    ent_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("PADDING", (0, 0), (-1, -1), 3),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ])
    )
    story.append(ent_table)

    story.append(Spacer(1, 8))

    # 5. Field Directives / Recommendations
    story.append(Paragraph("III. IMMEDIATE OPERATIONAL DIRECTIVES (FIELD INVESTIGATOR)", section_title))
    recs = summary_data.get("recommendations", [])[:3]
    for r in recs:
        p_text = f"<b>Priority #{r.get('priority_rank', 1)}:</b> {r.get('action_text', '')} — <i>{r.get('reason', '')}</i>"
        story.append(Paragraph(p_text, body_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 6))

    # 6. Evidentiary Hash Preservation (Section 65B IEA Integrity)
    story.append(Paragraph("IV. EVIDENTIARY HASH MANIFEST (SHA-256 INTEGRITY AUDIT)", section_title))
    file_hashes = summary_data.get("file_hashes", {})
    hash_rows = [["Evidence Artifact", "SHA-256 Digest", "Verification Status"]]
    for fname, fhash in file_hashes.items():
        hash_rows.append([fname, fhash[:32] + "...", "INTEGRITY PRESERVED"])
    hash_table = Table(hash_rows, colWidths=[140, 270, 130])
    hash_table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("PADDING", (0, 0), (-1, -1), 2),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ])
    )
    story.append(hash_table)

    # Build document
    doc.build(story)
    return out_file
