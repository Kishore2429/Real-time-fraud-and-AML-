import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, AlertTriangle, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
import type { AMLPattern } from '../types/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingSkeleton, ErrorState, EmptyState, PageHeader } from '../components/ui';

function normalizePatterns(raw: unknown): AMLPattern[] {
  if (Array.isArray(raw)) return raw as AMLPattern[];
  const r = raw as Record<string, unknown>;
  if (r?.patterns && Array.isArray(r.patterns)) return r.patterns as AMLPattern[];
  if (r?.data && Array.isArray(r.data)) return r.data as AMLPattern[];
  if (r?.aml_patterns && Array.isArray(r.aml_patterns)) return r.aml_patterns as AMLPattern[];
  return [];
}

function getPatternType(p: AMLPattern): string {
  return p.pattern_type || p.type || 'Suspicious Pattern';
}

function getSeverity(p: AMLPattern): string {
  return p.severity || p.risk_level || 'medium';
}

interface DrawerProps {
  pattern: AMLPattern;
  onClose: () => void;
}

function PatternDrawer({ pattern, onClose }: DrawerProps) {
  const accounts = pattern.accounts || pattern.related_accounts || [];
  const transactions = pattern.transactions || pattern.related_transactions || [];
  const indicators = pattern.indicators || [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(32, 8, 14, 0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto slide-in shadow-2xl"
        style={{ background: '#ffffff', borderLeft: '1px solid rgba(114, 0, 28, 0.15)' }}
      >
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid rgba(114, 0, 28, 0.08)', background: '#faf5f6' }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: '#72001c' }} />
            <span className="font-bold text-base" style={{ color: '#20080e' }}>AML Pattern Detail</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#6e444f' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(114,0,28,0.08)'; e.currentTarget.style.color = '#72001c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6e444f'; }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm" style={{ color: '#72001c' }}>{pattern.pattern_id || pattern.id || '—'}</span>
            <RiskBadge level={getSeverity(pattern)} size="md" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#6e444f' }}>Pattern Type</p>
            <p className="font-bold text-base" style={{ color: '#20080e' }}>{getPatternType(pattern)}</p>
          </div>

          {pattern.description && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#6e444f' }}>Description</p>
              <p className="text-sm" style={{ color: '#20080e' }}>{pattern.description}</p>
            </div>
          )}

          {pattern.explanation && (
            <div className="rounded-lg p-4" style={{ background: 'rgba(114, 0, 28, 0.04)', border: '1px solid rgba(114, 0, 28, 0.12)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#72001c' }}>Why Flagged</p>
              <p className="text-sm font-medium" style={{ color: '#20080e' }}>{pattern.explanation}</p>
            </div>
          )}

          {indicators.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6e444f' }}>Indicators</p>
              <div className="space-y-1.5">
                {indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg" style={{ background: '#faf5f6' }}>
                    <span className="text-amber-600 mt-0.5">⚑</span>
                    <span className="font-medium" style={{ color: '#20080e' }}>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {accounts.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6e444f' }}>Related Accounts</p>
              <div className="flex flex-wrap gap-2">
                {accounts.map((acc, i) => (
                  <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-md" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.1)', color: '#20080e' }}>
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6e444f' }}>Related Transactions</p>
              <div className="flex flex-wrap gap-2">
                {transactions.map((tx, i) => (
                  <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-md font-semibold" style={{ background: 'rgba(114, 0, 28, 0.06)', border: '1px solid rgba(114,0,28,0.15)', color: '#72001c' }}>
                    {tx}
                  </span>
                ))}
              </div>
            </div>
          )}

          {pattern.amount !== undefined && (
            <div className="p-3 rounded-lg" style={{ background: '#faf5f6' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#6e444f' }}>Total Amount Involved</p>
              <p className="text-xl font-bold" style={{ color: '#72001c' }}>₹{pattern.amount.toLocaleString('en-IN')}</p>
            </div>
          )}

          {pattern.confidence !== undefined && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#6e444f' }}>Detection Confidence</p>
              <div className="h-2 rounded-full" style={{ background: '#f0e6e8' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, pattern.confidence * 100)}%`,
                    background: 'linear-gradient(90deg, #72001c, #bc193c)',
                  }}
                />
              </div>
              <p className="text-xs font-semibold mt-1" style={{ color: '#72001c' }}>{(pattern.confidence * 100).toFixed(0)}%</p>
            </div>
          )}

          {/* Legal disclaimer */}
          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: 'rgba(180,83,9,0.06)', border: '1px solid rgba(180,83,9,0.2)' }}
          >
            <AlertTriangle size={12} className="text-amber-700 inline mr-1" />
            <span style={{ color: '#92400e' }}>
              These are <strong>indicators requiring investigation</strong>, not proof of money laundering. 
              Escalate to a compliance officer before any action.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PATTERN_ICONS: Record<string, string> = {
  structuring: '🔢',
  circular: '🔄',
  layering: '📊',
  smurfing: '🔀',
  default: '⚠️',
};

export default function AMLMonitoringPage() {
  const [patterns, setPatterns] = useState<AMLPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AMLPattern | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.amlPatterns();
    if (result.status === 'ok' && result.data) {
      setPatterns(normalizePatterns(result.data));
    } else {
      setError(result.error || 'Failed to load AML patterns');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getIcon(p: AMLPattern): string {
    const t = getPatternType(p).toLowerCase();
    for (const [key, icon] of Object.entries(PATTERN_ICONS)) {
      if (t.includes(key)) return icon;
    }
    return PATTERN_ICONS.default;
  }

  return (
    <div className="p-6 space-y-6 slide-in">
      <PageHeader
        title="AML Monitoring"
        subtitle="Anti-money laundering pattern detection indicators"
        icon={<BarChart3 size={20} />}
        actions={
          <button
            onClick={load}
            className="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all shadow-xs"
            style={{ background: '#72001c', color: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#570014'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#72001c'; }}
          >
            Refresh
          </button>
        }
      />

      {/* Disclaimer banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(180,83,9,0.06)', border: '1px solid rgba(180,83,9,0.2)' }}
      >
        <AlertTriangle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm" style={{ color: '#92400e' }}>
          <strong className="text-amber-800">Investigation Required:</strong> The indicators below are algorithmically detected patterns 
          that may warrant further investigation. They are <em>not</em> proof of money laundering. Refer to your 
          compliance team before escalation.
        </div>
      </div>

      {loading ? (
        <div className="space-y-3"><LoadingSkeleton rows={4} /></div>
      ) : error && patterns.length === 0 ? (
        <ErrorState
          title="Unable to Load AML Data"
          message={error}
          onRetry={load}
        />
      ) : patterns.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No AML Patterns Detected"
          message="No suspicious patterns were identified in the current dataset. This may mean clean data or insufficient transaction volume for pattern detection."
        />
      ) : (
        <div className="space-y-3">
          {patterns.map((pattern, i) => {
            const id = pattern.pattern_id || pattern.id || `PATTERN-${i}`;
            const severity = getSeverity(pattern);
            const type = getPatternType(pattern);
            const accounts = pattern.accounts || pattern.related_accounts || [];

            return (
              <div
                key={String(id)}
                className="glass-card glass-card-hover p-5 cursor-pointer"
                onClick={() => setSelected(pattern)}
                id={`pattern-${String(id)}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-xs"
                    style={{ background: 'rgba(114, 0, 28, 0.06)', border: '1px solid rgba(114, 0, 28, 0.15)' }}
                  >
                    {getIcon(pattern)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-bold text-sm" style={{ color: '#20080e' }}>{type}</span>
                      <RiskBadge level={severity} />
                    </div>
                    {pattern.description && (
                      <p className="text-xs mb-2 line-clamp-2" style={{ color: '#6e444f' }}>{pattern.description}</p>
                    )}
                    {accounts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {accounts.slice(0, 4).map((acc, ai) => (
                          <span
                            key={ai}
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.08)', color: '#6e444f' }}
                          >
                            {acc}
                          </span>
                        ))}
                        {accounts.length > 4 && (
                          <span className="text-xs" style={{ color: '#8c626d' }}>+{accounts.length - 4} more</span>
                        )}
                      </div>
                    )}
                    {pattern.amount !== undefined && (
                      <p className="text-xs mt-2" style={{ color: '#6e444f' }}>
                        Total involved: <span className="font-bold" style={{ color: '#72001c' }}>₹{pattern.amount.toLocaleString('en-IN')}</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} style={{ color: '#72001c' }} className="flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <PatternDrawer pattern={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
