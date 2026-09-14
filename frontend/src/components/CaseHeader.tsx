import React from 'react';
import { AnalysisSummary } from '../types';
import { ShieldAlert, Download, RefreshCw, FileCheck2, Zap, Radio, FileText, RotateCcw } from 'lucide-react';
import { getReportDownloadUrl, downloadSampleZip } from '../api/client';


interface CaseHeaderProps {
  summary: AnalysisSummary | null;
  onRefresh: () => void;
  onNewCase: () => void;
  onReset?: () => void;
  onOpenBrief?: () => void;
  loading: boolean;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({
  summary,
  onRefresh,
  onNewCase,
  onReset,
  onOpenBrief,
  loading,
}) => {
  const caseId = summary?.case_id || 'CYB-DEMO-001';
  const totalLoss = summary?.total_loss || 0;
  const hashCount = Object.keys(summary?.file_hashes || {}).length;

  return (
    <header className="tactical-shell" style={{ marginBottom: '20px' }}>
      <div className="tactical-core" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Left: Branding & Case Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}>
              <ShieldAlert size={22} color="var(--text-primary)" />
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-emerald)',
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  letterSpacing: '-0.02em', 
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  CORVYN
                </h1>
                <span className="hud-pill hud-pill-neutral">
                  Offline Forensic Core
                </span>
                <span className="hud-pill hud-pill-neutral">
                  Air-Gapped Sandbox
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Dossier:</span>
                  <strong className="mono-text" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{caseId}</strong>
                </span>
                <span style={{ color: 'var(--border-muted)' }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileCheck2 size={13} color="var(--accent-emerald)" />
                  <span className="mono-text" style={{ color: 'var(--text-secondary)' }}>{hashCount} Verified Digests (SHA-256)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center: Clean Architectural Telemetry Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            flexWrap: 'wrap',
          }}>
            {/* Siphoned Fraud Exposure */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Siphoned Loss
              </div>
              <div className="mono-text" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{totalLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ width: '1px', height: '26px', background: 'var(--border-subtle)' }} />

            {/* Golden Hour Status Indicator */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Golden Hour Triage
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-crimson-text)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-crimson)' }} />
                CRITICAL ALPHA
              </div>
            </div>

            {summary?.time_to_insight_ms !== undefined && (
              <>
                <div style={{ width: '1px', height: '26px', background: 'var(--border-subtle)' }} />

                {/* Pipeline Velocity / Latency */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pipeline Latency
                  </div>
                  <div className="mono-text" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                    <Zap size={13} color="var(--text-secondary)" />
                    {summary.time_to_insight_ms} ms
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Operational Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={async () => {
                try {
                  await downloadSampleZip();
                } catch (e: any) {
                  alert(`Sample download failed: ${e.message}`);
                }
              }}
              className="btn-secondary"
              title="Download 4-file evidence package (Excel, EML, Android, IPDR) for judge testing"
            >
              <Download size={13} />
              <span>Sample Package</span>
            </button>


            <button
              onClick={onRefresh}
              className="btn-secondary"
              disabled={loading}
              title="Re-run correlation engine"
            >
              <RefreshCw size={13} className={loading ? 'pulse-badge' : ''} />
              <span>Correlate</span>
            </button>

            <button onClick={onNewCase} className="btn-secondary">
              <span>+ Ingest Evidence</span>
            </button>

            {summary && onReset && (
              <button
                onClick={onReset}
                className="btn-secondary"
                disabled={loading}
                title="Purge all evidence sources and reset workspace to start fresh ingestion"
                style={{
                  color: 'var(--accent-crimson-text)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Sources</span>
              </button>
            )}

            {summary && onOpenBrief && (
              <button
                onClick={onOpenBrief}
                className="btn-primary"
                title="Open interactive court-admissible forensic dossier and brief"
              >
                <FileText size={13} />
                <span>Forensic Dossier</span>
              </button>
            )}

            {summary && (
              <a
                href={getReportDownloadUrl(summary.case_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
                title="Download court-admissible PDF report"
              >
                <span>Export PDF</span>
                <Download size={13} />
              </a>
            )}
          </div>


        </div>
      </div>
    </header>
  );
};
