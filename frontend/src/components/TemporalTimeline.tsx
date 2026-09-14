import React from 'react';
import { TemporalPath } from '../types';
import { Clock, ArrowRight, TrendingDown, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TemporalTimelineProps {
  paths: TemporalPath[];
  onSelectHop?: (from: string, to: string) => void;
}

export const TemporalTimeline: React.FC<TemporalTimelineProps> = ({ paths, onSelectHop }) => {
  if (!paths || paths.length === 0) {
    return (
      <section className="tactical-shell" style={{ marginBottom: '20px' }}>
        <div className="tactical-core" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            No rapid forwarding fraud transit chains identified in current dataset.
          </div>
        </div>
      </section>
    );
  }

  const primaryPath = paths[0];
  const totalMin = (primaryPath.total_duration_seconds / 60.0).toFixed(1);

  return (
    <section className="tactical-shell" style={{ marginBottom: '20px' }}>
      <div className="tactical-core" style={{ padding: '16px 22px' }}>
        {/* Title & Pipeline Velocity Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={16} color="var(--text-secondary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                Rapid Mule Forwarding Transit Chain ({primaryPath.hop_count} Sequential Hops)
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Autonomous high-velocity fund dissipation heat-path
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="hud-pill hud-pill-neutral">
              <span style={{ color: 'var(--text-secondary)' }}>Total Duration:</span>
              <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{totalMin} min</strong>
            </div>

            <div className="hud-pill hud-pill-emerald">
              <CheckCircle2 size={12} />
              <span>Retention:</span>
              <strong className="mono-text">{primaryPath.retention_rate}%</strong>
            </div>

            <div className="hud-pill hud-pill-crimson">
              <span>Origin:</span>
              <strong className="mono-text">₹{primaryPath.initial_amount.toLocaleString('en-IN')}</strong>
            </div>

            <div className="hud-pill hud-pill-neutral">
              <span>Terminal:</span>
              <strong className="mono-text">₹{primaryPath.final_amount.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Sequential Hops Architectural Track */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          paddingTop: '4px',
        }}>
          {primaryPath.hops.map((hop, index) => {
            const deltaMin = (hop.time_delta_seconds / 60.0).toFixed(1);
            const sourceEntity = hop.from_entity.split(':')[1] || hop.from_entity;
            const targetEntity = hop.to_entity.split(':')[1] || hop.to_entity;

            return (
              <React.Fragment key={index}>
                <div
                  onClick={() => onSelectHop && onSelectHop(hop.from_entity, hop.to_entity)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    minWidth: '220px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      letterSpacing: '0.04em',
                    }}>
                      HOP #{index + 1}
                    </span>
                    <span className="mono-text" style={{ fontSize: '11px', color: index === 0 ? 'var(--text-secondary)' : 'var(--accent-crimson-text)', fontWeight: 600 }}>
                      {index === 0 ? 'T0 (Source)' : `+${deltaMin}m transit`}
                    </span>
                  </div>

                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)', 
                    marginBottom: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    <span className="mono-text">{sourceEntity}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>➔</span>
                    <span className="mono-text" style={{ color: 'var(--text-primary)' }}>{targetEntity}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="mono-text" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{hop.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="mono-text" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {hop.tx_id || 'TX_VERIFIED'}
                    </span>
                  </div>
                </div>

                {index < primaryPath.hops.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>
                    <ArrowRight size={16} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
