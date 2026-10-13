import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ArrowLeftRight, Search, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import api from '../services/api';
import type { Transaction } from '../types/api';
import RiskBadge, { getRiskFromScore } from '../components/RiskBadge';
import { LoadingSkeleton, ErrorState, EmptyState, PageHeader } from '../components/ui';

function formatAmount(amt?: number, curr = 'INR'): string {
  if (amt === undefined || amt === null) return '—';
  const prefix = curr === 'INR' ? '₹' : `${curr} `;
  return `${prefix}${Number(amt).toLocaleString('en-IN')}`;
}

function getRef(tx: Transaction): string {
  return tx.reference || tx.transaction_ref || (tx.id !== undefined ? String(tx.id) : '—');
}

function getAccount(tx: Transaction): string {
  return tx.account_id || tx.account || tx.sender_account || '—';
}

function getTime(tx: Transaction): string {
  const t = tx.timestamp || tx.created_at;
  if (!t) return '—';
  return new Date(t).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const PAGE_SIZE = 15;
type SortKey = 'timestamp' | 'amount' | 'risk_score';

interface DrawerProps {
  tx: Transaction;
  onClose: () => void;
}

function TransactionDrawer({ tx, onClose }: DrawerProps) {
  const score = tx.risk_score ?? 0;
  const risk = tx.risk_level || getRiskFromScore(score);

  const fields = [
    { label: 'Transaction ID / Ref', value: getRef(tx) },
    { label: 'From Account', value: tx.sender_account || tx.account_id || tx.account || '—' },
    { label: 'To Account', value: tx.receiver_account || '—' },
    { label: 'Type', value: tx.transaction_type || tx.type || '—' },
    { label: 'Status', value: tx.status || 'completed' },
    { label: 'Timestamp', value: getTime(tx) },
    { label: 'Location', value: tx.location || '—' },
    { label: 'Device', value: tx.device_id || '—' },
    { label: 'IP Address', value: tx.ip_address || '—' },
    { label: 'Merchant', value: tx.merchant || '—' },
  ].filter(f => f.value !== '—' && f.value !== 'undefined');

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(32, 8, 14, 0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto slide-in shadow-2xl"
        style={{ background: '#ffffff', borderLeft: '1px solid rgba(114,0,28,0.15)' }}
      >
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid rgba(114,0,28,0.08)', background: '#faf5f6' }}
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} style={{ color: '#72001c' }} />
            <span className="font-bold text-base" style={{ color: '#20080e' }}>Transaction Detail</span>
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
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold text-sm" style={{ color: '#72001c' }}>{getRef(tx)}</span>
            <RiskBadge level={String(risk)} score={score} size="md" />
          </div>
          <div
            className="text-center py-4 rounded-xl shadow-xs"
            style={{ background: 'rgba(114,0,28,0.04)', border: '1px solid rgba(114,0,28,0.12)' }}
          >
            <p className="text-3xl font-bold" style={{ color: '#72001c' }}>{formatAmount(tx.amount)}</p>
            <p className="text-xs mt-1" style={{ color: '#8c626d' }}>{tx.currency || 'INR'} · {tx.transaction_type || tx.type || 'Transfer'}</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {fields.map(f => (
              <div
                key={f.label}
                className="flex justify-between items-center py-2.5 px-3 rounded-lg"
                style={{ background: '#faf5f6', border: '1px solid rgba(114,0,28,0.05)' }}
              >
                <span className="text-xs font-medium" style={{ color: '#6e444f' }}>{f.label}</span>
                <span className="text-xs font-mono ml-4 text-right break-all max-w-[60%] font-semibold" style={{ color: '#20080e' }}>{f.value}</span>
              </div>
            ))}
          </div>
          {tx.description && (
            <div className="p-3 rounded-lg" style={{ background: '#faf5f6' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#6e444f' }}>Description</p>
              <p className="text-sm" style={{ color: '#20080e' }}>{tx.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.transactions();
    if (result.status === 'ok' && result.data) {
      const data = result.data as { transactions?: Transaction[] } | Transaction[];
      const list = Array.isArray(data) ? data : (data.transactions || []);
      setTransactions(list);
    } else {
      setError(result.error || 'Failed to load transactions');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let list = transactions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(tx =>
        getRef(tx).toLowerCase().includes(q) ||
        getAccount(tx).toLowerCase().includes(q) ||
        (tx.merchant || '').toLowerCase().includes(q)
      );
    }
    if (riskFilter !== 'all') {
      list = list.filter(tx => {
        const score = tx.risk_score ?? 0;
        const level = (tx.risk_level || getRiskFromScore(score)).toLowerCase();
        return level.includes(riskFilter);
      });
    }
    return [...list].sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === 'amount') { av = a.amount ?? 0; bv = b.amount ?? 0; }
      else if (sortKey === 'risk_score') { av = a.risk_score ?? 0; bv = b.risk_score ?? 0; }
      else {
        av = new Date(a.timestamp || a.created_at || 0).getTime();
        bv = new Date(b.timestamp || b.created_at || 0).getTime();
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [transactions, search, riskFilter, sortKey, sortDir]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey === col
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />
  );

  return (
    <div className="p-6 space-y-6 slide-in">
      <PageHeader
        title="Transactions"
        subtitle={`${filtered.length} of ${transactions.length} transactions`}
        icon={<ArrowLeftRight size={20} />}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#72001c' }} />
          <input
            id="tx-search"
            type="text"
            placeholder="Search by reference or account..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 pr-4 py-2 text-sm rounded-lg outline-none w-72 transition-all"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(114,0,28,0.18)',
              color: '#20080e',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#72001c';
              e.target.style.boxShadow = '0 0 0 3px rgba(114,0,28,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(114,0,28,0.18)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map(f => (
            <button
              key={f}
              id={`tx-filter-${f}`}
              onClick={() => { setRiskFilter(f); setPage(0); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs"
              style={{
                background: riskFilter === f ? '#72001c' : '#ffffff',
                border: riskFilter === f ? '1px solid #72001c' : '1px solid rgba(114,0,28,0.15)',
                color: riskFilter === f ? '#ffffff' : '#6e444f',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-5"><LoadingSkeleton rows={6} /></div>
        ) : error && transactions.length === 0 ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No transactions found"
            message="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(114,0,28,0.08)', background: '#faf5f6' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6e444f' }}>Reference</th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                      style={{ color: '#6e444f' }}
                      onClick={() => toggleSort('amount')}
                    >
                      <span className="flex items-center gap-1">Amount <SortIcon col="amount" /></span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6e444f' }}>Account</th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                      style={{ color: '#6e444f' }}
                      onClick={() => toggleSort('timestamp')}
                    >
                      <span className="flex items-center gap-1">Time <SortIcon col="timestamp" /></span>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                      style={{ color: '#6e444f' }}
                      onClick={() => toggleSort('risk_score')}
                    >
                      <span className="flex items-center gap-1">Risk <SortIcon col="risk_score" /></span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6e444f' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((tx, i) => {
                    const score = tx.risk_score ?? 0;
                    const risk = tx.risk_level || getRiskFromScore(score);
                    return (
                      <tr
                        key={getRef(tx) + i}
                        className="table-row-hover"
                        onClick={() => setSelected(tx)}
                        style={{ borderBottom: '1px solid rgba(114,0,28,0.05)' }}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#72001c' }}>{getRef(tx)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: '#20080e' }}>{formatAmount(tx.amount)}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6e444f' }}>{getAccount(tx)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#8c626d' }}>{getTime(tx)}</td>
                        <td className="px-4 py-3">
                          <RiskBadge level={String(risk)} score={score} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium capitalize" style={{ color: '#6e444f' }}>{tx.status || 'completed'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid rgba(114,0,28,0.08)', background: '#faf5f6' }}
              >
                <span className="text-xs font-medium" style={{ color: '#6e444f' }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 shadow-2xs"
                    style={{ background: '#ffffff', border: '1px solid rgba(114,0,28,0.15)', color: '#72001c' }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 shadow-2xs"
                    style={{ background: '#ffffff', border: '1px solid rgba(114,0,28,0.15)', color: '#72001c' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && <TransactionDrawer tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
