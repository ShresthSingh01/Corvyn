import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Check, Sparkles, X, ShieldAlert, CheckCircle2, AlertCircle, FileText, Smartphone, Mail, Hash } from 'lucide-react';
import { createCase, ingestFiles, analyzeCase, seedDemoCase } from '../api/client';
import { AnalysisSummary } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (summary: AnalysisSummary) => void;
}

interface ProcessedFileStatus {
  filename: string;
  sha256: string;
  records_extracted: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>('');
  const [processedList, setProcessedList] = useState<ProcessedFileStatus[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setErrorMsg('');
      setProcessedList([]);
      setWarnings([]);
    }
  };

  const getFileIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.eml')) return <Mail size={14} color="var(--accent-amber)" />;
    if (lower.endsWith('.json') || lower.endsWith('.txt')) return <Smartphone size={14} color="var(--accent-cyan)" />;
    return <FileSpreadsheet size={14} color="var(--text-secondary)" />;
  };

  const handleUploadAndAnalyze = async () => {
    if (selectedFiles.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    setWarnings([]);
    setProcessedList([]);
    setStep('Initializing isolated digital evidence container...');

    try {
      const newCase = await createCase('Live Digital Artifact Forensic Correlation');
      setStep('Computing SHA-256 forensic digests & extracting canonical events...');

      const ingestRes = await ingestFiles(newCase.case_id, selectedFiles);
      if (ingestRes.files_processed) {
        setProcessedList(ingestRes.files_processed);
      }
      if (ingestRes.parse_warnings && ingestRes.parse_warnings.length > 0) {
        setWarnings(ingestRes.parse_warnings);
      }

      setStep('Executing temporal forwarding detection & graph entity resolution...');
      const summary = await analyzeCase(newCase.case_id);
      
      setStep('Forensic correlation complete!');
      setTimeout(() => {
        onAnalysisComplete(summary);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(`Ingestion halted: ${err.message || 'Verification failure'}`);
    } finally {
      setLoading(false);
    }
  };

  // Direct demo loader
  const handleLoadDemoCase = async () => {
    setLoading(true);
    setErrorMsg('');
    setWarnings([]);
    setStep('Seeding synthetic forensic dataset (Bank Settlement + Telecom CDR)...');
    try {
      const seeded = await seedDemoCase();
      setStep('Demo case ready — loading forensic topology...');
      setTimeout(() => {
        onAnalysisComplete(seeded.summary);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(`Synthetic dataset load error: ${err.message || 'Seeding failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(11, 12, 14, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="tactical-shell" style={{ width: '620px', maxWidth: '100%' }}>
        <div className="tactical-core" style={{ padding: '24px' }}>
          
          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span className="hud-pill hud-pill-neutral">
                Digital Evidence Ingestion
              </span>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
                Multi-Source Evidence Ingestion
              </h2>
            </div>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '6px' }} disabled={loading}>
              <X size={14} />
            </button>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
            Upload raw forensic evidence artifacts: <strong style={{ color: 'var(--text-primary)' }}>CSV, Excel (.xlsx), EML emails, Android dumps (.json/.txt), or IPDR logs</strong>.
            The engine calculates cryptographically tamper-proof SHA-256 hashes and normalizes events for automated mule correlation.
          </p>

          {/* Interactive File Dropzone */}
          <label style={{
            display: 'block',
            border: '1.5px dashed var(--border-muted)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 20px',
            textAlign: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'var(--bg-surface-elevated)',
            marginBottom: '16px',
            transition: 'border-color 0.2s ease',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
            }}>
              <UploadCloud size={18} color="var(--text-secondary)" />
            </div>
            
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Select or Drop Evidence Files
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              CSV · XLSX · EML · JSON · TXT (CDR, Bank, Android, IPDR)
            </div>
            
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.eml,.json,.txt"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </label>

          {/* Selected Artifacts Preview List */}
          {selectedFiles.length > 0 && !loading && processedList.length === 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Selected Artifacts ({selectedFiles.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                  }}>
                    {getFileIcon(f.name)}
                    <span style={{ color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span className="mono-text" style={{ color: 'var(--text-tertiary)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Granular Step & Progress Status Board */}
          {loading && (
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: 'var(--accent-emerald)',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {step}
                </span>
              </div>
            </div>
          )}

          {/* Processed Files Evidence Verification Board */}
          {processedList.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Evidentiary Hashing & Extraction Results:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {processedList.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '11.5px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <CheckCircle2 size={13} color="var(--accent-emerald)" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.filename}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="hud-pill hud-pill-neutral mono-text" style={{ fontSize: '10px' }}>
                        {item.records_extracted} records
                      </span>
                      <span className="mono-text" style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
                        SHA: {item.sha256.substring(0, 10)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings List */}
          {warnings.length > 0 && (
            <div style={{
              fontSize: '11.5px',
              color: 'var(--accent-amber)',
              marginBottom: '14px',
              padding: '8px 12px',
              background: 'rgba(245, 159, 0, 0.08)',
              border: '1px solid rgba(245, 159, 0, 0.25)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={12} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error Message Indicator */}
          {errorMsg && (
            <div style={{
              fontSize: '12px',
              color: 'var(--accent-crimson-text)',
              marginBottom: '16px',
              padding: '10px 14px',
              background: 'var(--accent-crimson-subtle)',
              border: '1px solid rgba(201, 42, 42, 0.35)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <ShieldAlert size={14} color="var(--accent-crimson)" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Action Buttons Bar */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleLoadDemoCase}
              disabled={loading}
              className="btn-secondary"
              title="Auto-seed synthetic dataset from local disk"
            >
              <Sparkles size={13} />
              <span>Load Synthetic Dataset</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                disabled={selectedFiles.length === 0 || loading}
                className="btn-primary"
              >
                <Check size={13} />
                <span>{loading ? 'Processing Evidence...' : 'Ingest & Correlate'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

