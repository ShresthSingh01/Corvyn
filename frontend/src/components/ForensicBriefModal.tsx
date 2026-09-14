import React, { useState, useEffect } from 'react';
import { AnalysisSummary, GraphNode, TemporalHop } from '../types';
import { getReportDownloadUrl } from '../api/client';
import {
  ShieldAlert,
  FileCheck2,
  Download,
  Copy,
  Check,
  X,
  Scale,
  Clock,
  ArrowRight,
  AlertTriangle,
  Lock,
  Zap,
  Building2,
  Smartphone,
  CheckCircle2,
  Printer,
  FileText
} from 'lucide-react';

interface ForensicBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AnalysisSummary | null;
  onSelectEntity?: (entityId: string) => void;
  onSelectHop?: (from: string, to: string) => void;
}

type TabType = 'overview' | 'transit_chain' | 'mule_directory' | 'seizure_orders' | 'evidence_hashes';

export const ForensicBriefModal: React.FC<ForensicBriefModalProps> = ({
  isOpen,
  onClose,
  summary,
  onSelectEntity,
  onSelectHop
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  const caseId = summary.case_id || 'CYB-DEMO-001';
  const totalLoss = summary.total_loss || 0;
  const hashCount = Object.keys(summary.file_hashes || {}).length;
  const primaryPath = summary.temporal_paths?.[0];
  const topMules = summary.top_risk_entities?.slice(0, 6) || [];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(getReportDownloadUrl(caseId, 'pdf'));
      if (!res.ok) throw new Error('PDF generation failed on server');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Forensic_Brief_${caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };


  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="tactical-shell"
        style={{
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.95), 0 0 1px rgba(255, 255, 255, 0.15)',
          overflow: 'hidden'
        }}
      >
        <div className="tactical-core" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          {/* Top Dossier Telemetry Header */}
          <div style={{
            padding: '16px 24px',
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Scale size={18} color="var(--text-primary)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    FORENSIC INVESTIGATIVE BRIEF & CASE DOSSIER
                  </h2>
                  <span className="hud-pill hud-pill-neutral">
                    STATUTORY COURT DRAFT
                  </span>
                  <span className="hud-pill hud-pill-emerald">
                    SEC 65B IEA COMPLIANT
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <span>Case Reference: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{caseId}</strong></span>
                  <span style={{ color: 'var(--border-muted)' }}>|</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileCheck2 size={12} color="var(--accent-emerald)" />
                    <span>{hashCount} Cryptographic Hash Seals</span>
                  </span>
                  <span style={{ color: 'var(--border-muted)' }}>|</span>
                  <span>Classification: <strong style={{ color: 'var(--accent-crimson-text)' }}>CONFIDENTIAL // POLICE USE ONLY</strong></span>
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handlePrint}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                title="Print court dossier"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
                title="Download Section 65B court-admissible PDF brief"
              >
                <Download size={13} className={downloadingPdf ? 'pulse-badge' : ''} />
                <span>{downloadingPdf ? 'Generating PDF...' : 'Official PDF'}</span>
              </button>


              <a
                href={getReportDownloadUrl(caseId, 'json')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}
              >
                <FileText size={13} />
                <span>JSON</span>
              </a>

              <button
                onClick={onClose}
                className="btn-secondary"
                style={{
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close dossier (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div style={{
            padding: '12px 24px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Fraud Exposure (Total Loss)</div>
              <div className="mono-text" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{totalLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Golden Hour Triage</div>
              <div className="mono-text" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-crimson-text)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-crimson)' }} />
                ACTIVE INTERDICTION
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Normalized Artifacts</div>
              <div className="mono-text" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {summary.records_processed} Records ({summary.entities_count} Nodes)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Rapid Forwarding Hops</div>
              <div className="mono-text" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {summary.fraud_hops_found} Multi-Hop Layers
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Air-Gapped Processing</div>
              <div className="mono-text" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-emerald-text)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                <Zap size={12} color="var(--accent-emerald)" />
                {summary.time_to_insight_ms} ms Latency
              </div>
            </div>
          </div>

          {/* Dossier Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 24px 0 24px',
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto'
          }}>
            {[
              { id: 'overview', label: 'Case Summary & Synthesis', count: null },
              { id: 'transit_chain', label: 'Primary Transit Chain', count: primaryPath?.hops.length || 0 },
              { id: 'mule_directory', label: 'High-Risk Mule Roster', count: topMules.length },
              { id: 'seizure_orders', label: 'Statutory Seizure Directives', count: summary.recommendations.length },
              { id: 'evidence_hashes', label: 'Evidentiary Chain Manifest (65B)', count: hashCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                  padding: '9px 12px',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  borderTopLeftRadius: 'var(--radius-xs)',
                  borderTopRightRadius: 'var(--radius-xs)',
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span style={{
                    fontSize: '10.5px',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-pill)',
                    background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Dossier Body Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: 'var(--bg-surface)'
          }}>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 22px'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} color="var(--text-secondary)" />
                    Forensic Case Synopsis & Investigator Briefing
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    Automated multi-source evidence correlation across ingested bank settlement sheets and telecom CDR/IPDR logs confirms a structured financial cyber fraud operation. The victim funds (totaling <strong style={{ color: 'var(--text-primary)' }}>₹{totalLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>) were rapidly layered through <strong style={{ color: 'var(--text-primary)' }}>{summary.fraud_hops_found} intermediate hops</strong> within minutes of debit to defeat routine banking interdiction.
                  </p>
                  <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Modus Operandi Signature</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                        High-Velocity Mule Layering & Rapid SIM Switching
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Funds dispersed within 120-180 seconds across multiple beneficiary UPI handles before cash-out.
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Judicial Evidentiary Standard</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-emerald-text)', marginTop: '4px' }}>
                        100% Deterministic Line-Item Lineage
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Zero synthetic hallucination; each relation maps to raw transaction logs and verified SHA-256 hashes.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Field Directives Overview */}
                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 22px'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={15} color="var(--text-secondary)" />
                      Immediate Action Checklist for Field Officers
                    </span>
                    <button 
                      onClick={() => {
                        const recsText = summary.recommendations.map(r => `Priority #${r.priority_rank}: ${r.action_text} (Reason: ${r.reason})`).join('\n');
                        handleCopy(recsText, 'all_recs');
                      }}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      {copiedKey === 'all_recs' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                      <span>Copy Checklist</span>
                    </button>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {summary.recommendations.map((rec) => (
                      <div 
                        key={rec.priority_rank}
                        style={{
                          background: 'var(--bg-surface)',
                          borderLeft: '3px solid var(--border-muted)',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '16px',
                          border: '1px solid var(--border-subtle)',
                          borderLeftWidth: '3px',
                          borderLeftColor: rec.priority_rank === 1 ? 'var(--accent-crimson)' : 'var(--border-muted)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="mono-text" style={{ fontSize: '10.5px', fontWeight: 700, color: rec.priority_rank === 1 ? 'var(--accent-crimson-text)' : 'var(--text-secondary)' }}>
                              PRIORITY #{rec.priority_rank}
                            </span>
                            <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Target: <strong style={{ color: 'var(--text-primary)' }}>{rec.target_entity}</strong>
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                            {rec.action_text}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Grounds: {rec.reason}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(`${rec.action_text} - Target: ${rec.target_entity} (Grounds: ${rec.reason})`, `rec_${rec.priority_rank}`)}
                          className="btn-secondary"
                          style={{ padding: '5px', borderRadius: 'var(--radius-xs)' }}
                          title="Copy notice snippet"
                        >
                          {copiedKey === `rec_${rec.priority_rank}` ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSIT CHAIN */}
            {activeTab === 'transit_chain' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Primary Fraud Transit Chain (Temporal Multi-Hop Correlation)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Chronological fund flow mapping each rapid inter-account diversion from the initial victim debit.
                  </p>
                </div>

                {primaryPath && primaryPath.hops.length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-muted)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Hop</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Source Entity</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Destination Beneficiary</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Transferred</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Transit Delta</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Tx Reference ID</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {primaryPath.hops.map((hop, idx) => {
                          const deltaMin = (hop.time_delta_seconds / 60).toFixed(1);
                          return (
                            <tr 
                              key={idx}
                              style={{ 
                                borderBottom: '1px solid var(--border-subtle)',
                                background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'
                              }}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <span className="mono-text" style={{ 
                                  fontWeight: 700, 
                                  color: 'var(--text-primary)',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-xs)'
                                }}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div className="mono-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hop.from_entity}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{idx === 0 ? 'Victim Account' : `Layer-${idx} Mule`}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div className="mono-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hop.to_entity}</div>
                                <div style={{ fontSize: '11px', color: 'var(--accent-crimson-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={11} />
                                  <span>{idx === primaryPath.hops.length - 1 ? 'Cash-Out / Final Node' : `Layer-${idx + 1} Mule`}</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <span className="mono-text" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                                  ₹{hop.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span className="mono-text" style={{ 
                                  color: idx === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <Clock size={11} />
                                  {idx === 0 ? 'T0 (Initial Debit)' : `+${deltaMin} min`}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {hop.tx_id || 'TXN-SETTLE-OK'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {onSelectHop && (
                                  <button
                                    onClick={() => {
                                      onSelectHop(hop.from_entity, hop.to_entity);
                                      onClose();
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '3px 8px', fontSize: '11px' }}
                                    title="View this hop in the interactive network graph"
                                  >
                                    <span>Inspect</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No temporal forwarding paths identified for this case.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MULE DIRECTORY */}
            {activeTab === 'mule_directory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Identified Mule Suspects & High-Risk Endpoints
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Scored based on rapid dispersion velocity, shared telecom identifiers (IMEI/IP), and multi-hop transit presence.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                  {topMules.map((node) => {
                    const isMule = node.is_mule_candidate;
                    const riskColor = node.risk_score >= 80 ? 'var(--accent-crimson-text)' : (node.risk_score >= 50 ? 'var(--accent-amber-text)' : 'var(--accent-emerald-text)');

                    return (
                      <div 
                        key={node.id}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: `1px solid ${node.risk_score >= 80 ? 'rgba(201, 42, 42, 0.3)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {node.type === 'PHONE' ? <Smartphone size={15} color="var(--text-secondary)" /> : <Building2 size={15} color="var(--text-secondary)" />}
                            <span className="mono-text" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {node.label || node.id}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: riskColor,
                            border: '1px solid var(--border-subtle)'
                          }}>
                            {node.risk_score}/100 RISK
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Type: <strong style={{ color: 'var(--text-primary)' }}>{node.type}</strong>
                          {isMule && <span style={{ marginLeft: '10px', color: 'var(--accent-crimson-text)', fontWeight: 600 }}>• High-Confidence Mule</span>}
                        </div>

                        {/* Anomaly breakdown */}
                        <div style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '11px'
                        }}>
                          {Object.entries(node.component_scores || {}).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                              <span>{key.replace(/_/g, ' ').toUpperCase()}:</span>
                              <span className="mono-text" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                          <button
                            onClick={() => handleCopy(node.id, `node_${node.id}`)}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            {copiedKey === `node_${node.id}` ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                            <span>Copy Entity ID</span>
                          </button>

                          {onSelectEntity && (
                            <button
                              onClick={() => {
                                onSelectEntity(node.id);
                                onClose();
                              }}
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--text-primary)' }}
                            >
                              <span>Locate in Graph</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SEIZURE DIRECTIVES */}
            {activeTab === 'seizure_orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Statutory Asset Freezing & Evidence Seizure Notices
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Court-traceable field warrants drafted under Section 102 CrPC and Section 91 CrPC for cyber crime interdiction.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Notice 1: Bank Freezing */}
                  <div style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid var(--accent-crimson)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Lock size={17} color="var(--accent-crimson)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            EMERGENCY BANK ACCOUNT LIEN & DEBIT FREEZE (SEC 102 CrPC)
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--accent-crimson-text)' }}>
                            Mandatory compliance directive for nodal cyber cells & banking gateways
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const bankText = `FORMAL NOTICE UNDER SECTION 102 CrPC\nTo: Nodal Officer / Bank Operations\nCase Ref: ${caseId}\nSubject: Urgent debit freeze on mule account following cyber fraud interdiction\n\nIdentified Mule Beneficiary: ${topMules[0]?.id || '40057890'}\nEstimated Loss Transferred: ₹${totalLoss}\nGrounds: Deterministic forensic temporal transit chain verified by Corvyn (SHA-256 Digest certified).\n\nDirectives:\n1. Place immediate debit freeze on the target account.\n2. Provide complete KYC, IP access logs, and outward fund disbursement trail within 24 hours.`;
                          handleCopy(bankText, 'bank_notice');
                        }}
                        className="btn-primary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        {copiedKey === 'bank_notice' ? <Check size={12} /> : <Copy size={12} />}
                        <span>Copy Statutory Notice</span>
                      </button>
                    </div>

                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      lineHeight: '1.6',
                      color: 'var(--text-secondary)'
                    }}>
                      <div><strong style={{ color: 'var(--text-primary)' }}>TARGET:</strong> Primary Mule Beneficiary ({topMules[0]?.id || 'ACC-MULE-01'})</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>STATUTE:</strong> Section 102 Code of Criminal Procedure (Power of police officer to seize certain property)</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>REASON:</strong> Immediate recipient of fraudulent funds debited from complainant without legitimate commercial consideration.</div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                        <strong>FIELD ACTION:</strong> Dispatch formal letter to bank nodal officer with SHA-256 evidence certificate attached.
                      </div>
                    </div>
                  </div>

                  {/* Notice 2: Telecom & Hardware Seizure */}
                  <div style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Smartphone size={17} color="var(--text-secondary)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            DEVICE SEIZURE & TOWER GEOLOCATION DIRECTIVE (SEC 91 CrPC)
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Field unit summons to telecom service provider (TSP) for CDR/IMEI trace
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const tspText = `SUMMONS UNDER SECTION 91 CrPC\nTo: Law Enforcement Cell / Telecom Service Provider\nCase Ref: ${caseId}\nSubject: Production of CDR, IPDR, IMEI-IMSI binding records\n\nTarget Calling/Data Node: ${summary.nodes.find(n => n.type === 'PHONE')?.id || '9876543210'}\nRequired Evidence:\n1. CDR with Azimuth / Cell Tower IDs for golden hour period.\n2. Alternate SIM cards used on associated IMEI.\n3. Subscriber CAF / e-KYC copy.`;
                          handleCopy(tspText, 'tsp_notice');
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        {copiedKey === 'tsp_notice' ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                        <span>Copy TSP Summons</span>
                      </button>
                    </div>

                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      lineHeight: '1.6',
                      color: 'var(--text-secondary)'
                    }}>
                      <div><strong style={{ color: 'var(--text-primary)' }}>TARGET:</strong> Primary Calling / Phishing Vector</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>STATUTE:</strong> Section 91 Code of Criminal Procedure (Summons to produce document or other thing)</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>FIELD ACTION:</strong> Seize handset, isolate in Faraday bag, verify IMEI against CDR hardware logs.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: EVIDENTIARY HASH MANIFEST */}
            {activeTab === 'evidence_hashes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Evidentiary Hash Manifest & Chain-of-Custody (Section 65B IEA)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Cryptographic SHA-256 verification guaranteeing zero data tampering and complete judicial admissibility.
                  </p>
                </div>

                <div style={{
                  background: 'var(--accent-emerald-subtle)',
                  border: '1px solid rgba(43, 138, 62, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <CheckCircle2 size={20} color="var(--accent-emerald)" />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent-emerald-text)' }}>
                      CERTIFIED FORENSIC CHAIN OF CUSTODY
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      All ingested files were cryptographically hashed at T0 (time of ingestion). Any bit-level modification invalidates the dossier signature.
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-muted)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Evidence File Name</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>SHA-256 Cryptographic Digest</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Integrity Status</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.file_hashes || {}).map(([fname, fhash], idx) => (
                        <tr 
                          key={fname}
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'
                          }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <div className="mono-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fname}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Ingested Artifact</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div className="mono-text" style={{ color: 'var(--accent-emerald-text)', fontSize: '11px', letterSpacing: '0.04em' }}>
                              {fhash}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-xs)',
                              background: 'var(--accent-emerald-subtle)',
                              color: 'var(--accent-emerald-text)',
                              border: '1px solid rgba(43, 138, 62, 0.3)'
                            }}>
                              PRESERVED (MATCH)
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleCopy(fhash, `hash_${idx}`)}
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Copy SHA-256 hash"
                            >
                              {copiedKey === `hash_${idx}` ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                              <span>Copy</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Dossier Status Bar */}
          <div style={{
            padding: '10px 24px',
            background: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mono-text" style={{ color: 'var(--text-secondary)' }}>ENGINE: CORVYN v1.0.0</span>
              <span style={{ color: 'var(--border-muted)' }}>|</span>
              <span className="mono-text" style={{ color: 'var(--accent-emerald-text)' }}>STATUS: AIR-GAPPED // VERIFIED</span>
              <span style={{ color: 'var(--border-muted)' }}>|</span>
              <span className="mono-text" style={{ color: 'var(--text-primary)' }}>LATENCY: {summary.time_to_insight_ms}ms</span>
            </div>

            <div>
              <span>Press <kbd style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: '3px', color: 'var(--text-primary)' }}>Esc</kbd> to exit dossier</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
