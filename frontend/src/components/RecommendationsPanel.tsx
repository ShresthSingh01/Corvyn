import React from 'react';
import { NextBestAction } from '../types';
import { AlertOctagon, ArrowUpRight, Target, ArrowRight, ShieldAlert } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: NextBestAction[];
  onSelectEntity?: (entityId: string) => void;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  onSelectEntity,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  const primaryRec = recommendations[0];
  const secondaryRecs = recommendations.slice(1, 3);

  return (
    <section className="tactical-shell" style={{ marginTop: '20px' }}>
      <div className="tactical-core" style={{ padding: '20px 24px' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
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
              <AlertOctagon size={16} color="var(--text-secondary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                Next-Best Action Directives (Field Operational Queue)
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Tactical priority rank: Risk Score x Degree Centrality x Uncertainty Reduction
              </div>
            </div>
          </div>

          <div className="hud-pill hud-pill-neutral">
            <Target size={12} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Active Action Vectors:</span>
            <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{recommendations.length} Directives</strong>
          </div>
        </div>

        {/* Asymmetric Command Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          alignItems: 'stretch',
        }}>
          {/* Left Column: Featured Primary Operational Directive */}
          {primaryRec && (
            <div
              onClick={() => onSelectEntity && onSelectEntity(primaryRec.target_entity)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-muted)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: 'var(--accent-crimson-subtle)',
                      border: '1px solid rgba(201, 42, 42, 0.3)',
                      color: 'var(--accent-crimson-text)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-crimson)' }} />
                      PRIMARY DIRECTIVE
                    </span>
                    <span className="hud-pill hud-pill-crimson" style={{ fontSize: '10px' }}>
                      Immediate Freeze Vector
                    </span>
                  </div>

                  <span className="mono-text" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Priority Index: <strong style={{ color: 'var(--text-primary)' }}>{primaryRec.priority_score}</strong>
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {primaryRec.action_text}
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {primaryRec.reason}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Target Ref: <strong style={{ color: 'var(--text-primary)' }}>{primaryRec.target_entity}</strong>
                </span>
                
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-crimson-text)',
                }}>
                  <span>Isolate in Topology</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          )}

          {/* Right Column: Stacked Secondary Directives */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {secondaryRecs.map((rec) => (
              <div
                key={rec.priority_rank}
                onClick={() => onSelectEntity && onSelectEntity(rec.target_entity)}
                style={{
                  flex: 1,
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                    letterSpacing: '0.04em',
                  }}>
                    PRIORITY #{rec.priority_rank}
                  </span>

                  <span className="mono-text" style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <span>Index: {rec.priority_score}</span>
                    <ArrowUpRight size={12} />
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {rec.action_text}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>
                  {rec.reason}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  <span className="mono-text">Ref: {rec.target_entity}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Inspect ➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
