import React, { useEffect, useState, useCallback } from 'react';
import { Briefcase, User, Clock, ChevronRight, X, Tag } from 'lucide-react';
import api from '../services/api';
import type { InvestigationCase } from '../types/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingSkeleton, ErrorState, EmptyState, PageHeader } from '../components/ui';

function normalizeCases(raw: unknown): InvestigationCase[] {
  if (Array.isArray(raw)) return raw as InvestigationCase[];
  const r = raw as Record<string, unknown>;
  if (r?.cases && Array.isArray(r.cases)) return r.cases as InvestigationCase[];
  if (r?.data && Array.isArray(r.data)) return r.data as InvestigationCase[];
  return [];
}

function getCaseId(c: InvestigationCase): string {
  return String(c.case_id || c.case_number || c.id || 'CASE-—');
}

function getSeverity(c: InvestigationCase): string {
  return c.severity || c.risk_level || 'medium';
}

function getStatusColor(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('open') || s.includes('new') || s.includes('active')) return '#72001c';
  if (s.includes('investigat') || s.includes('in_progress')) return '#b45309';
  if (s.includes('closed') || s.includes('resolved')) return '#15803d';
  if (s.includes('escalat')) return '#b91c1c';
  return '#6e444f';
}

interface DrawerProps {
  caseItem: InvestigationCase;
  onClose: () => void;
}

function CaseDrawer({ caseItem, onClose }: DrawerProps) {
  const caseId = getCaseId(caseItem);
  const severity = getSeverity(caseItem);
  const transactions = caseItem.related_transactions || caseItem.transactions || [];
  const accounts = caseItem.related_accounts || [];
  const timeline = caseItem.timeline || [];
  const statusColor = getStatusColor(caseItem.status);

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
            <Briefcase size={18} style={{ color: '#72001c' }} />
            <span className="font-bold text-base" style={{ color: '#20080e' }}>Case Detail</span>
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
            <span className="font-mono font-bold text-sm" style={{ color: '#72001c' }}>{caseId}</span>
            <RiskBadge level={severity} size="md" />
          </div>

          {caseItem.title && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#6e444f' }}>Title</p>
              <p className="font-bold text-base" style={{ color: '#20080e' }}>{caseItem.title}</p>
            </div>
          )}

          {caseItem.description && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#6e444f' }}>Description</p>
              <p className="text-sm" style={{ color: '#20080e' }}>{caseItem.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold flex items-center gap-1" style={{ color: '#6e444f' }}><Tag size={10} /> Status</p>
              <span className="text-sm font-bold capitalize" style={{ color: statusColor }}>
                {caseItem.status || 'Unknown'}
              </span>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold flex items-center gap-1" style={{ color: '#6e444f' }}><User size={10} /> Investigator</p>
              <p className="text-sm font-semibold" style={{ color: '#20080e' }}>{caseItem.assigned_to || caseItem.investigator || 'Unassigned'}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold flex items-center gap-1" style={{ color: '#6e444f' }}><Clock size={10} /> Created</p>
              <p className="text-xs font-medium" style={{ color: '#20080e' }}>
                {caseItem.created_at ? new Date(caseItem.created_at).toLocaleString('en-IN') : '—'}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold" style={{ color: '#6e444f' }}>Updated</p>
              <p className="text-xs font-medium" style={{ color: '#20080e' }}>
                {caseItem.updated_at ? new Date(caseItem.updated_at).toLocaleString('en-IN') : '—'}
              </p>
            </div>
          </div>

          {transactions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6e444f' }}>Related Transactions</p>
              <div className="flex flex-wrap gap-1.5">
                {transactions.map((tx, i) => (
                  <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-md font-semibold" style={{ background: 'rgba(114, 0, 28, 0.06)', color: '#72001c', border: '1px solid rgba(114, 0, 28, 0.15)' }}>
                    {tx}
                  </span>
                ))}
              </div>
            </div>
          )}

          {accounts.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6e444f' }}>Related Accounts</p>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((acc, i) => (
                  <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-md font-medium" style={{ background: '#faf5f6', color: '#20080e', border: '1px solid rgba(114,0,28,0.08)' }}>
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {timeline.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-3 font-semibold flex items-center gap-1" style={{ color: '#6e444f' }}>
                <Clock size={10} /> Timeline
              </p>
              <div className="relative pl-4">
                <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: 'rgba(114, 0, 28, 0.15)' }} />
                {timeline.map((event, i) => (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-2.5 top-1.5 w-2 h-2 rounded-full" style={{ background: '#72001c' }} />
                    <div className="p-2.5 rounded-lg" style={{ background: '#faf5f6' }}>
                      <p className="text-xs" style={{ color: '#8c626d' }}>{new Date(event.timestamp).toLocaleString('en-IN')}</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: '#20080e' }}>{event.event}</p>
                      {event.description && <p className="text-xs mt-0.5" style={{ color: '#6e444f' }}>{event.description}</p>}
                      {event.actor && <p className="text-xs mt-0.5" style={{ color: '#8c626d' }}>by {event.actor}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {caseItem.tags && caseItem.tags.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6e444f' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {caseItem.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(114, 0, 28, 0.06)', color: '#72001c', border: '1px solid rgba(114, 0, 28, 0.15)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvestigationCasesPage() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InvestigationCase | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.cases();
    if (result.status === 'ok' && result.data) {
      setCases(normalizeCases(result.data));
    } else {
      setError(result.error || 'Failed to load cases');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-6 slide-in">
      <PageHeader
        title="Investigation Cases"
        subtitle="Active and historical fraud investigation cases"
        icon={<Briefcase size={20} />}
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

      {/* Stats banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: cases.length, color: '#72001c' },
          { label: 'Open', value: cases.filter(c => (c.status || '').toLowerCase().includes('open')).length, color: '#880022' },
          { label: 'High Severity', value: cases.filter(c => (c.severity || '').toLowerCase().includes('high')).length, color: '#b91c1c' },
          { label: 'Resolved', value: cases.filter(c => (c.status || '').toLowerCase().includes('closed') || (c.status || '').toLowerCase().includes('resolved')).length, color: '#15803d' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="glass-card p-4 text-center"
            style={{ borderBottom: `3px solid ${color}` }}
          >
            <p className="text-2xl font-bold" style={{ color: '#20080e' }}>{loading && cases.length === 0 ? '—' : value}</p>
            <p className="text-xs uppercase tracking-wider font-semibold mt-1" style={{ color: '#6e444f' }}>{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : error && cases.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : cases.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No Investigation Cases"
          message="The backend reports zero open investigation cases. This is accurate data from /api/cases — no active cases exist at this time."
        />
      ) : (
        <div className="space-y-3">
          {cases.map((caseItem, i) => {
            const caseId = getCaseId(caseItem);
            const severity = getSeverity(caseItem);
            const statusColor = getStatusColor(caseItem.status);

            return (
              <div
                key={caseId + i}
                className="glass-card glass-card-hover p-5 cursor-pointer"
                onClick={() => setSelected(caseItem)}
                id={`case-${caseId}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-sm font-bold" style={{ color: '#72001c' }}>{caseId}</span>
                      <RiskBadge level={severity} />
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-md font-semibold capitalize"
                        style={{
                          background: `${statusColor}14`,
                          border: `1px solid ${statusColor}35`,
                          color: statusColor,
                        }}
                      >
                        {caseItem.status || 'Unknown'}
                      </span>
                    </div>
                    {caseItem.title && (
                      <p className="text-sm font-bold mb-1" style={{ color: '#20080e' }}>{caseItem.title}</p>
                    )}
                    {caseItem.description && (
                      <p className="text-xs line-clamp-2" style={{ color: '#6e444f' }}>{caseItem.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#8c626d' }}>
                      {caseItem.assigned_to && (
                        <span className="flex items-center gap-1 font-medium"><User size={11} />{caseItem.assigned_to}</span>
                      )}
                      {caseItem.created_at && (
                        <span className="flex items-center gap-1"><Clock size={11} />{new Date(caseItem.created_at).toLocaleDateString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#72001c' }} className="flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <CaseDrawer caseItem={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
