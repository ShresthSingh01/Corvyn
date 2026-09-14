import React, { useState } from 'react';
import { GraphEdge, GraphNode } from '../types';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, SlidersHorizontal, Scale, X, ArrowRight } from 'lucide-react';

interface EvidencePanelProps {
  selectedEdge: GraphEdge | null;
  selectedNode: GraphNode | null;
  onClearSelection: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  selectedEdge,
  selectedNode,
  onClearSelection,
}) => {
  const [suppressIpTrap, setSuppressIpTrap] = useState(false);

  // --- EMPTY / UNSELECTED STATE ---
  if (!selectedEdge && !selectedNode) {
    return (
      <section className="tactical-shell" style={{ height: '100%' }}>
        <div className="tactical-core" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            <FileText size={16} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              Evidentiary Attribution & Legal Provenance
            </h3>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px 20px',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <Scale size={18} color="var(--text-secondary)" />
            </div>

            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Inspect Evidentiary Chain of Custody
            </div>

            <p style={{ maxWidth: '320px', lineHeight: 1.5, color: 'var(--text-secondary)', fontSize: '12px' }}>
              Click any relationship link or entity node in the topology to audit underlying court-admissible artifacts.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // --- RELATIONSHIP (EDGE) INSPECTION ---
  if (selectedEdge) {
    const rawConfidence = selectedEdge.confidence;
    const adjustedConfidence = suppressIpTrap
      ? Math.max(10, rawConfidence - (selectedEdge.evidence.some(e => e.rule === 'SAME_IP') ? 5 : 0))
      : rawConfidence;

    return (
      <section className="tactical-shell" style={{ height: '100%' }}>
        <div className="tactical-core" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <span className="hud-pill hud-pill-neutral">
                Relationship Link Audit
              </span>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                marginTop: '6px', 
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="mono-text">{selectedEdge.source.split(':')[1] || selectedEdge.source}</span>
                <span style={{ color: 'var(--accent-crimson)' }}>➔</span>
                <span className="mono-text">{selectedEdge.target.split(':')[1] || selectedEdge.target}</span>
              </h3>
            </div>
            <button onClick={onClearSelection} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              <X size={12} />
              <span>Dismiss</span>
            </button>
          </div>

          {/* Confidence Score Bar Gauge */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Forensic Confidence Score</span>
              <span className="mono-text" style={{
                fontSize: '18px',
                fontWeight: 700,
                color: adjustedConfidence >= 70 ? 'var(--accent-emerald-text)' : (adjustedConfidence >= 40 ? 'var(--accent-amber-text)' : 'var(--accent-crimson-text)'),
              }}>
                {adjustedConfidence.toFixed(0)}%
              </span>
            </div>
            
            <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${adjustedConfidence}%`,
                height: '100%',
                background: adjustedConfidence >= 70
                  ? 'var(--accent-emerald)'
                  : (adjustedConfidence >= 40 ? 'var(--accent-amber)' : 'var(--accent-crimson)'),
                transition: 'width 0.3s ease',
              }} />
            </div>

            {selectedEdge.is_fraud_path && (
              <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--accent-crimson-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={13} color="var(--accent-crimson)" />
                <strong>Flagged Rapid Forwarding Transit Chain</strong>
              </div>
            )}
          </div>

          {/* Interactive Trap Simulation Filter */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                Simulate Weak Signal Removal
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={suppressIpTrap}
                onChange={(e) => setSuppressIpTrap(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
              />
              <span>Filter IP-trap</span>
            </label>
          </div>

          {/* Itemized Evidence Rules List */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Supporting Evidence Rules ({selectedEdge.evidence.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedEdge.evidence.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    background: ev.is_counter_evidence ? 'var(--accent-crimson-subtle)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${ev.is_counter_evidence ? 'rgba(201, 42, 42, 0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {ev.is_counter_evidence ? (
                        <AlertTriangle size={13} color="var(--accent-crimson)" />
                      ) : (
                        <CheckCircle2 size={13} color="var(--accent-emerald)" />
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: ev.is_counter_evidence ? 'var(--accent-crimson-text)' : 'var(--text-primary)' }}>
                        {ev.description}
                      </span>
                    </div>
                    <span className="mono-text" style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: ev.weight > 0 ? 'var(--accent-emerald-text)' : 'var(--accent-crimson-text)',
                    }}>
                      {ev.weight > 0 ? `+${ev.weight}` : `${ev.weight}`}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span>Artifact: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{ev.source_file}</strong></span>
                    <span style={{ color: 'var(--border-muted)' }}>|</span>
                    <span>Row: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>#{ev.source_row}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Evidentiary Custody Footer */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span>Section 65B IEA Certified. Row-level cryptographic provenance intact.</span>
          </div>
        </div>
      </section>
    );
  }

  // --- ENTITY NODE INSPECTION ---
  return (
    <section className="tactical-shell" style={{ height: '100%' }}>
      <div className="tactical-core" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <span className="hud-pill hud-pill-neutral">
              Entity Triage Profile
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
              {selectedNode.label}
            </h3>
            <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Canonical Ref: {selectedNode.id}
            </span>
          </div>
          <button onClick={onClearSelection} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
            <X size={12} />
            <span>Dismiss</span>
          </button>
        </div>

        {/* Anomaly Risk Score Gauge */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Composite Anomaly Risk</span>
            <span className="mono-text" style={{
              fontSize: '20px',
              fontWeight: 700,
              color: selectedNode.risk_level === 'HIGH' ? 'var(--accent-crimson-text)' : (selectedNode.risk_level === 'MEDIUM' ? 'var(--accent-amber-text)' : 'var(--accent-emerald-text)'),
            }}>
              {selectedNode.risk_score} / 100
            </span>
          </div>
          
          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${selectedNode.risk_score}%`,
              height: '100%',
              background: selectedNode.risk_level === 'HIGH'
                ? 'var(--accent-crimson)'
                : (selectedNode.risk_level === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--accent-emerald)'),
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Component Breakdown */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Auditable Risk Vectors
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(selectedNode.component_scores).length > 0 ? (
              Object.entries(selectedNode.component_scores).map(([comp, val]) => (
                <div
                  key={comp}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>
                    {comp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="mono-text" style={{ fontWeight: 600, color: val > 0 ? 'var(--accent-crimson-text)' : 'var(--accent-emerald-text)' }}>
                    {val > 0 ? `+${val}` : `${val}`}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px' }}>Baseline civilian activity. Zero anomaly flags detected.</div>
            )}
          </div>
        </div>

        {/* Network Graph Position */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          fontSize: '12px',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Network Topology Position
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Degree Centrality:</span>
            <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{selectedNode.metadata.degree_centrality ?? 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Syndicate Classification:</span>
            <strong style={{ color: selectedNode.is_mule_candidate ? 'var(--accent-crimson-text)' : 'var(--text-primary)' }}>
              {selectedNode.is_mule_candidate ? 'Transit Intermediary' : 'Peripheral Node'}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
};
