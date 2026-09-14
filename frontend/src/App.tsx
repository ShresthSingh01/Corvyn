import React, { useState, useEffect } from 'react';
import { AnalysisSummary, GraphNode, GraphEdge } from './types';
import { fetchCases, fetchGraph, analyzeCase, fetchDemoStatus, seedDemoCase } from './api/client';
import { CaseHeader } from './components/CaseHeader';
import { BenchmarkMetrics } from './components/BenchmarkMetrics';
import { TemporalTimeline } from './components/TemporalTimeline';
import { NetworkGraph } from './components/NetworkGraph';
import { EvidencePanel } from './components/EvidencePanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { UploadModal } from './components/UploadModal';
import { ForensicBriefModal } from './components/ForensicBriefModal';
import { ShieldCheck, Database, HardDrive, Cpu, Terminal, Radio, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {

  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initial load with automatic demo seeding
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const demoStatus = await fetchDemoStatus();
        if (demoStatus.seeded && demoStatus.case_id) {
          const data = await fetchGraph(demoStatus.case_id);
          setSummary(data);
        } else {
          // Auto-seed synthetic dataset on first load
          const seeded = await seedDemoCase();
          setSummary(seeded.summary);
        }
      } catch (err) {
        console.error('Initial load error:', err);
        // Fallback: try seeding directly
        try {
          const seeded = await seedDemoCase();
          setSummary(seeded.summary);
        } catch (sErr) {
          console.error('Demo auto-seed error:', sErr);
        }
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);


  const handleRefresh = async () => {
    if (!summary) return;
    setLoading(true);
    try {
      const updated = await analyzeCase(summary.case_id);
      setSummary(updated);
      setToast({ message: 'Forensic correlation topology updated successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: `Analysis refresh error: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHop = (from: string, to: string) => {
    if (!summary) return;
    const edge = summary.edges.find(e => e.source === from && e.target === to);
    if (edge) {
      setSelectedEdge(edge);
      setSelectedNode(null);
    }
  };

  const handleSelectEntity = (entityId: string) => {
    if (!summary) return;
    const node = summary.nodes.find(n => n.id === entityId);
    if (node) {
      setSelectedNode(node);
      setSelectedEdge(null);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1640px', margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Tactical Case Header */}
      <CaseHeader
        summary={summary}
        onRefresh={handleRefresh}
        onNewCase={() => setIsUploadOpen(true)}
        onOpenBrief={() => setIsBriefOpen(true)}
        loading={loading}
      />

      {/* Main Workspace Body */}
      {summary && (
        <main id="main-content" style={{ flex: 1 }}>
          {/* Forensic Benchmark Scoreboard */}
          <BenchmarkMetrics summary={summary} />

          {/* Temporal Rapid Mule Forwarding Transit Timeline */}
          <TemporalTimeline
            paths={summary.temporal_paths}
            onSelectHop={handleSelectHop}
          />

          {/* Core 2-Column Forensic Workspace */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}>
            {/* Left: Interactive Cytoscape Topology */}
            <div>
              <NetworkGraph
                nodes={summary.nodes}
                edges={summary.edges}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
                }}
                onSelectEdge={(edge) => {
                  setSelectedEdge(edge);
                  setSelectedNode(null);
                }}
              />
            </div>

            {/* Right: The Evidentiary Attribution & Legal Provenance Inspector */}
            <div style={{ height: '540px' }}>
              <EvidencePanel
                selectedEdge={selectedEdge}
                selectedNode={selectedNode}
                onClearSelection={() => {
                  setSelectedEdge(null);
                  setSelectedNode(null);
                }}
              />
            </div>
          </div>

          {/* Field Operational Directives Queue */}
          <RecommendationsPanel
            recommendations={summary.recommendations}
            onSelectEntity={handleSelectEntity}
          />
        </main>
      )}

      {/* Empty State: Prompt to Ingest Evidence */}
      {!summary && !loading && (
        <div className="tactical-shell" style={{ margin: '40px auto', maxWidth: '640px', width: '100%' }}>
          <div className="tactical-core" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <HardDrive size={24} color="var(--text-primary)" />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              No Digital Evidence Container Loaded
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
              Ingest telecom CDRs and banking settlement logs to reconstruct multi-hop mule networks, compute SHA-256 digests, and generate court-admissible forensic briefs.
            </p>

            <button onClick={() => setIsUploadOpen(true)} className="btn-primary" style={{ margin: '0 auto' }}>
              <span>+ Ingest Evidence Artifacts</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && !summary && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div className="tactical-shell" style={{ width: '380px' }}>
            <div className="tactical-core" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: 'var(--text-primary)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Reconstructing Forensic Correlation Graph
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Parsing canonical events and validating temporal edges...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tactical Status Footer */}
      <footer style={{
        marginTop: '36px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            <span>Corvyn Forensic Core v1.0</span>
          </span>
          <span>|</span>
          <span>ISO/IEC 27037 Digital Artifact Standards Compliant</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Court Evidence Chain: <strong style={{ color: 'var(--text-secondary)' }}>Section 65B Certified</strong></span>
          <span>|</span>
          <span>Zero Cloud Telemetry Leakage</span>
        </div>
      </footer>

      {/* Digital Ingestion Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalysisComplete={(newSummary) => {
          setSummary(newSummary);
          setSelectedNode(null);
          setSelectedEdge(null);
          setToast({ message: 'Evidence ingested and forensic chain correlated', type: 'success' });
        }}
      />

      {/* Court-Admissible Forensic Brief & Dossier Modal */}
      <ForensicBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        summary={summary}
        onSelectEntity={handleSelectEntity}
        onSelectHop={handleSelectHop}
      />

      {/* Tactical Floating HUD Toast */}
      {toast && (
        <div
          className={`tactical-toast ${toast.type === 'error' ? 'tactical-toast-danger' : ''}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={16} color="var(--accent-crimson)" />
          ) : (
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
          )}
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
