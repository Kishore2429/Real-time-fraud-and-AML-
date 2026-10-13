import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, ChevronRight, X, Clock, Tag } from 'lucide-react';
import api from '../services/api';
import type { Alert } from '../types/api';
import RiskBadge, { getRiskFromScore } from '../components/RiskBadge';
import { LoadingSkeleton, ErrorState, EmptyState, PageHeader } from '../components/ui';

// Normalize alerts from various response shapes
function normalizeAlerts(raw: unknown): Alert[] {
  if (Array.isArray(raw)) return raw as Alert[];
  const r = raw as Record<string, unknown>;
  if (r?.alerts && Array.isArray(r.alerts)) return r.alerts as Alert[];
  if (r?.data && Array.isArray(r.data)) return r.data as Alert[];
  if (r?.recent_alerts && Array.isArray(r.recent_alerts)) return r.recent_alerts as Alert[];
  return [];
}

function buildAlertFromTransaction(tx: Record<string, unknown>): Alert {
  const score = (tx.risk_score as number) ?? 0;
  return {
    alert_id: `ALERT-${tx.transaction_ref || tx.id}`,
    transaction_ref: (tx.transaction_ref || tx.reference || tx.id) as string,
    risk_score: score,
    severity: (tx.risk_level as string) || getRiskFromScore(score),
    timestamp: (tx.timestamp || tx.created_at) as string,
    reasons: (tx.reasons as string[]) || [],
    amount: tx.amount as number,
    status: (tx.status as string) || 'open',
  };
}

interface AlertDrawerProps {
  alert: Alert;
  onClose: () => void;
}

function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const reasons = alert.reasons || (alert.reason ? [alert.reason] : []);
  const score = alert.risk_score ?? 0;
  const severity = alert.severity || alert.risk_level || getRiskFromScore(score);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(32, 8, 14, 0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto slide-in shadow-2xl"
        style={{
          background: '#ffffff',
          borderLeft: '1px solid rgba(114, 0, 28, 0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid rgba(114, 0, 28, 0.08)', background: '#faf5f6' }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: '#b91c1c' }} />
            <span className="font-bold text-base" style={{ color: '#20080e' }}>Alert Detail</span>
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

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Alert ID */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#6e444f' }}>Alert ID</p>
            <p className="font-mono font-bold text-sm" style={{ color: '#72001c' }}>{alert.alert_id || alert.id || '—'}</p>
          </div>

          {/* Risk Score */}
          <div
            className="rounded-xl p-4 text-center shadow-xs"
            style={{
              background: score >= 60
                ? 'rgba(185,28,28,0.06)'
                : score >= 30
                ? 'rgba(180,83,9,0.06)'
                : 'rgba(21,128,61,0.06)',
              border: `1px solid ${score >= 60 ? 'rgba(185,28,28,0.25)' : score >= 30 ? 'rgba(180,83,9,0.25)' : 'rgba(21,128,61,0.25)'}`,
            }}
          >
            <p className="text-4xl font-bold mb-1" style={{ color: '#20080e' }}>{score}</p>
            <p className="text-xs font-medium" style={{ color: '#6e444f' }}>Risk Score</p>
            <div className="mt-2 flex justify-center">
              <RiskBadge level={String(severity)} size="md" />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold" style={{ color: '#6e444f' }}>Transaction Ref</p>
              <p className="text-sm font-mono break-all font-semibold" style={{ color: '#20080e' }}>{alert.transaction_ref || alert.transaction_id || '—'}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold" style={{ color: '#6e444f' }}>Status</p>
              <p className="text-sm capitalize font-semibold" style={{ color: '#20080e' }}>{alert.status || 'Open'}</p>
            </div>
            {alert.amount !== undefined && (
              <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
                <p className="text-xs mb-1 font-semibold" style={{ color: '#6e444f' }}>Amount</p>
                <p className="text-sm font-bold" style={{ color: '#72001c' }}>₹{alert.amount?.toLocaleString('en-IN')}</p>
              </div>
            )}
            <div className="rounded-lg p-3" style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}>
              <p className="text-xs mb-1 font-semibold" style={{ color: '#6e444f' }}>Detected</p>
              <p className="text-xs" style={{ color: '#20080e' }}>
                {alert.timestamp || alert.created_at
                  ? new Date(alert.timestamp || alert.created_at || '').toLocaleString('en-IN')
                  : '—'}
              </p>
            </div>
          </div>

          {/* Reasons / Indicators */}
          {reasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1" style={{ color: '#6e444f' }}>
                <Tag size={12} /> Risk Indicators
              </p>
              <div className="space-y-2">
                {reasons.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{
                      background: 'rgba(185,28,28,0.05)',
                      border: '1px solid rgba(185,28,28,0.2)',
                    }}
                  >
                    <span className="mt-0.5 text-rose-700 font-bold flex-shrink-0">⚑</span>
                    <span className="font-medium" style={{ color: '#20080e' }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {alert.description && (
            <div className="p-3 rounded-lg" style={{ background: '#faf5f6' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#6e444f' }}>Description</p>
              <p className="text-sm" style={{ color: '#20080e' }}>{alert.description}</p>
            </div>
          )}

          {/* Investigation action */}
          <div
            className="rounded-lg p-4 text-center"
            style={{
              background: 'rgba(114, 0, 28, 0.04)',
              border: '1px dashed rgba(114, 0, 28, 0.2)',
            }}
          >
            <p className="text-xs font-semibold mb-1 flex items-center justify-center gap-1" style={{ color: '#72001c' }}>
              <Clock size={12} /> Case Management
            </p>
            <p className="text-xs" style={{ color: '#6e444f' }}>
              No open investigation case. Navigate to <strong style={{ color: '#72001c' }}>Investigation Cases</strong> to create one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const dashResult = await api.dashboard();
    if (dashResult.status === 'ok' && dashResult.data) {
      const d = dashResult.data as Record<string, unknown>;
      const fromDash = normalizeAlerts(d.recent_alerts || d.alerts || []);
      if (fromDash.length > 0) {
        setAlerts(fromDash);
        setLoading(false);
        return;
      }
    }

    const txResult = await api.transactions();
    if (txResult.status === 'ok' && txResult.data) {
      const txRaw = txResult.data as Record<string, unknown>;
      const txList: Record<string, unknown>[] = Array.isArray(txRaw)
        ? txRaw
        : Array.isArray(txRaw.transactions)
        ? txRaw.transactions as Record<string, unknown>[]
        : Array.isArray(txRaw.data)
        ? txRaw.data as Record<string, unknown>[]
        : [];

      const alertList = txList
        .filter(tx => {
          const score = tx.risk_score as number ?? 0;
          const level = (tx.risk_level as string || '').toLowerCase();
          return score >= 30 || level === 'high' || level === 'medium';
        })
        .map(tx => buildAlertFromTransaction(tx));

      setAlerts(alertList);
    } else {
      setError(txResult.error || dashResult.error || 'Failed to load alerts');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = alerts.filter(a => {
    if (filter === 'all') return true;
    const score = a.risk_score ?? 0;
    const sev = (a.severity || a.risk_level || getRiskFromScore(score)).toLowerCase();
    return sev.includes(filter);
  });

  const counts = {
    high: alerts.filter(a => {
      const score = a.risk_score ?? 0;
      const sev = (a.severity || a.risk_level || getRiskFromScore(score)).toLowerCase();
      return sev.includes('high');
    }).length,
    medium: alerts.filter(a => {
      const score = a.risk_score ?? 0;
      const sev = (a.severity || a.risk_level || getRiskFromScore(score)).toLowerCase();
      return sev.includes('med');
    }).length,
  };

  return (
    <div className="p-6 space-y-6 slide-in">
      <PageHeader
        title="Fraud Alerts"
        subtitle="Suspicious transaction detections requiring review"
        icon={<ShieldAlert size={20} />}
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

      {/* Summary counts */}
      <div className="flex gap-3 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            id={`filter-${f}`}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-2xs"
            style={{
              background: filter === f
                ? '#72001c'
                : '#ffffff',
              border: filter === f
                ? '1px solid #72001c'
                : '1px solid rgba(114, 0, 28, 0.15)',
              color: filter === f
                ? '#ffffff'
                : '#6e444f',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'high' && counts.high > 0 && ` (${counts.high})`}
            {f === 'medium' && counts.medium > 0 && ` (${counts.medium})`}
            {f === 'all' && ` (${alerts.length})`}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      {loading ? (
        <div className="space-y-3"><LoadingSkeleton rows={4} /></div>
      ) : error && alerts.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="No alerts found"
          message="No fraud alerts match the current filter. All transactions appear within normal parameters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert, i) => {
            const id = alert.alert_id || alert.id || `ALERT-${i}`;
            const score = alert.risk_score ?? 0;
            const severity = alert.severity || alert.risk_level || getRiskFromScore(score);
            const reasons = alert.reasons || (alert.reason ? [alert.reason] : []);

            return (
              <div
                key={String(id)}
                className="glass-card glass-card-hover p-4 cursor-pointer"
                onClick={() => setSelected(alert)}
                id={`alert-${String(id)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold" style={{ color: '#72001c' }}>{String(id)}</span>
                      <RiskBadge level={String(severity)} score={score} />
                    </div>
                    {alert.transaction_ref && (
                      <p className="text-xs mb-2 font-mono font-medium" style={{ color: '#6e444f' }}>
                        TX: {alert.transaction_ref}
                        {alert.amount !== undefined && ` · ₹${alert.amount.toLocaleString('en-IN')}`}
                      </p>
                    )}
                    {reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {reasons.slice(0, 3).map((r, ri) => (
                          <span
                            key={ri}
                            className="text-xs px-2.5 py-0.5 rounded-md font-medium"
                            style={{ background: 'rgba(185,28,28,0.06)', color: '#b91c1c', border: '1px solid rgba(185,28,28,0.2)' }}
                          >
                            {r}
                          </span>
                        ))}
                        {reasons.length > 3 && (
                          <span className="text-xs" style={{ color: '#8c626d' }}>+{reasons.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs" style={{ color: '#8c626d' }}>
                        {alert.timestamp || alert.created_at
                          ? new Date(alert.timestamp || alert.created_at || '').toLocaleString('en-IN')
                          : '—'}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: '#72001c' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Drawer */}
      {selected && <AlertDrawer alert={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
