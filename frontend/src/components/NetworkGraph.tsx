import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Filter, Layers, Crosshair } from 'lucide-react';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode | null) => void;
  onSelectEdge: (edge: GraphEdge | null) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
  onSelectEdge,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [focusSyndicateOnly, setFocusSyndicateOnly] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter nodes if focus mode is active to prevent graph clutter
    let displayNodes = nodes;
    let displayEdges = edges;

    if (focusSyndicateOnly) {
      const keyNodeIds = new Set(
        nodes
          .filter(n => n.risk_score >= 20 || n.is_mule_candidate)
          .map(n => n.id)
      );

      // Add endpoints of fraud edges
      edges.forEach(e => {
        if (e.is_fraud_path) {
          keyNodeIds.add(e.source);
          keyNodeIds.add(e.target);
        }
      });

      // Find immediate 1-hop connections
      edges.forEach(e => {
        if (keyNodeIds.has(e.source) || keyNodeIds.has(e.target)) {
          keyNodeIds.add(e.source);
          keyNodeIds.add(e.target);
        }
      });

      displayNodes = nodes.filter(n => keyNodeIds.has(n.id)).slice(0, 25);
      const activeIds = new Set(displayNodes.map(n => n.id));
      displayEdges = edges.filter(e => activeIds.has(e.source) && activeIds.has(e.target));
    }

    // Convert to Cytoscape format
    const cyElements: cytoscape.ElementDefinition[] = [
      ...displayNodes.map(n => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          risk: n.risk_score,
          riskLevel: n.risk_level,
          isMule: n.is_mule_candidate,
          rawNode: n,
        },
      })),
      ...displayEdges.map(e => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          amount: e.amount,
          isFraud: e.is_fraud_path,
          confidence: e.confidence,
          rawEdge: e,
        },
      })),
    ];

    // Initialize Cytoscape with Nordic Architectural Minimalist palette
    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#181b1f',
            'label': 'data(label)',
            'color': '#f1f3f5',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, SF Mono, Consolas, monospace',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'width': 32,
            'height': 32,
            'border-width': 1,
            'border-color': 'rgba(255, 255, 255, 0.18)',
            'text-background-color': 'rgba(11, 12, 14, 0.94)',
            'text-background-opacity': 0.94,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
          },
        },
        // Node Types
        {
          selector: 'node[type = "ACCOUNT"]',
          style: {
            'background-color': '#1e2329',
            'shape': 'round-rectangle',
            'border-color': 'rgba(255, 255, 255, 0.28)',
          },
        },
        {
          selector: 'node[type = "PHONE"]',
          style: {
            'background-color': '#181d24',
            'shape': 'ellipse',
            'border-color': 'rgba(255, 255, 255, 0.22)',
          },
        },
        {
          selector: 'node[type = "IMEI"]',
          style: {
            'background-color': '#14181f',
            'shape': 'diamond',
            'border-color': 'rgba(255, 255, 255, 0.18)',
            'width': 34,
            'height': 34,
          },
        },
        {
          selector: 'node[type = "IP"]',
          style: {
            'background-color': '#111418',
            'shape': 'hexagon',
            'border-color': 'rgba(255, 255, 255, 0.14)',
            'width': 28,
            'height': 28,
          },
        },
        // High-Risk Mule Highlighting (Nordic Terracotta without neon glow)
        {
          selector: 'node[riskLevel = "HIGH"]',
          style: {
            'background-color': '#2b1414',
            'border-color': '#c92a2a',
            'border-width': 1.5,
            'color': '#ff8787',
            'width': 40,
            'height': 40,
          },
        },
        // Edges Base
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': 'rgba(255, 255, 255, 0.14)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.14)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.75,
            'opacity': 0.7,
          },
        },
        {
          selector: 'edge[type = "TRANSACTION"]',
          style: {
            'width': 1.5,
            'line-color': 'rgba(255, 255, 255, 0.3)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.3)',
            'opacity': 0.85,
          },
        },
        // Rapid Forwarding Fraud Path (Architectural Terracotta)
        {
          selector: 'edge[?isFraud]',
          style: {
            'width': 2.5,
            'line-color': '#c92a2a',
            'target-arrow-color': '#c92a2a',
            'arrow-scale': 1.1,
            'opacity': 1,
            'line-style': 'solid',
          },
        },
        {
          selector: 'edge[type = "DEVICE_USE"]',
          style: {
            'line-color': 'rgba(255, 255, 255, 0.18)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.18)',
            'line-style': 'dashed',
            'width': 1,
            'opacity': 0.7,
          },
        },
        {
          selector: 'edge[type = "IP_SESSION"]',
          style: {
            'line-color': 'rgba(255, 255, 255, 0.1)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.1)',
            'line-style': 'dotted',
            'width': 1,
            'opacity': 0.45,
          },
        },
        // Active Selection Halo (Crisp Architectural Off-White Outline)
        {
          selector: ':selected',
          style: {
            'border-color': '#f1f3f5',
            'border-width': 2,
            'line-color': '#f1f3f5',
            'target-arrow-color': '#f1f3f5',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
        componentSpacing: 65,
        nodeRepulsion: () => 4800,
        idealEdgeLength: () => 75,
      },
    });

    // Tap Events
    cy.on('tap', 'node', (evt) => {
      const rawNode = evt.target.data('rawNode');
      onSelectNode(rawNode);
      onSelectEdge(null);
    });

    cy.on('tap', 'edge', (evt) => {
      const rawEdge = evt.target.data('rawEdge');
      onSelectEdge(rawEdge);
      onSelectNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectNode(null);
        onSelectEdge(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges, focusSyndicateOnly]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);

  return (
    <section className="tactical-shell" style={{ height: '540px' }}>
      <div className="tactical-core" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0e1012' }}>
        
        {/* Top Floating Controls HUD Bar */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(19, 21, 24, 0.94)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Crosshair size={13} color="var(--text-secondary)" />
            <span>Forensic Correlation Topology</span>
          </div>

          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 4px' }} />

          <button
            onClick={() => setFocusSyndicateOnly(!focusSyndicateOnly)}
            className="btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              background: focusSyndicateOnly ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderColor: focusSyndicateOnly ? 'var(--border-muted)' : 'var(--border-subtle)',
              color: focusSyndicateOnly ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <Filter size={11} />
            <span>{focusSyndicateOnly ? 'Focus: Fraud Syndicate (25)' : 'Scope: All Entities'}</span>
          </button>
        </div>

        {/* Floating Zoom & Fit Navigation Controls */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <button onClick={handleZoomIn} className="btn-secondary" style={{ padding: '7px' }} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button onClick={handleZoomOut} className="btn-secondary" style={{ padding: '7px' }} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <button onClick={handleFit} className="btn-secondary" style={{ padding: '7px' }} title="Fit View to Screen">
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Tactical Bottom Entity & Relationship Legend */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 10,
          background: 'rgba(19, 21, 24, 0.94)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c92a2a' }} />
            <span style={{ color: '#ff8787', fontWeight: 600 }}>Mule Candidate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22272e', border: '1px solid rgba(255,255,255,0.25)' }} />
            <span>Account</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1a202c', border: '1px solid rgba(255,255,255,0.2)' }} />
            <span>Phone</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', transform: 'rotate(45deg)', background: '#14181f', border: '1px solid rgba(255,255,255,0.18)' }} />
            <span>IMEI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '2px', background: '#c92a2a' }} />
            <span style={{ color: '#ff8787', fontWeight: 600 }}>Fraud Chain</span>
          </div>
        </div>

        {/* Cytoscape Canvas Surface */}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </section>
  );
};
