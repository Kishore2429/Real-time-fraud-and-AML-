import React, { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ArrowLeftRight, ShieldAlert, BarChart3, Briefcase,
  RefreshCw, Activity, TrendingUp, AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import type { DashboardResponse, Alert } from '../types/api';
import RiskBadge, { getRiskFromScore } from '../components/RiskBadge';
import { StatCard, LoadingSkeleton, ErrorState, PageHeader } from '../components/ui';

// Normalize dashboard data from various response shapes
function normalizeDashboard(raw: DashboardResponse) {
  const s = raw.stats || raw;
  return {
    total_transactions: s.total_transactions ?? 0,
    total_value: s.total_value ?? 0,
    high_risk: s.high_risk ?? 0,
    medium_risk: s.medium_risk ?? 0,
    low_risk: s.low_risk ?? 0,
    open_cases: s.open_cases ?? 0,
    flagged_accounts: s.flagged_accounts ?? 0,
    aml_patterns: s.aml_patterns ?? 0,
    recent_alerts: (raw.recent_alerts || raw.alerts || []) as Alert[],
  };
}

function formatCurrency(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function OverviewPage() {
  const [data, setData] = useState<ReturnType<typeof normalizeDashboard> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.dashboard();
    if (result.status === 'ok' && result.data) {
      setData(normalizeDashboard(result.data as DashboardResponse));
      setLastUpdated(new Date());
    } else {
      setError(result.error || 'Failed to load dashboard');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const riskDistribution = data
    ? [
        { name: 'High Risk', value: data.high_risk, color: '#b91c1c' },
        { name: 'Medium Risk', value: data.medium_risk, color: '#b45309' },
        { name: 'Low Risk', value: data.low_risk, color: '#15803d' },
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="p-6 space-y-6 slide-in">
      <PageHeader
        title="Risk Operations Overview"
        subtitle="Real-time fraud & AML monitoring dashboard"
        icon={<Activity size={20} />}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs" style={{ color: '#8c626d' }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              id="refresh-dashboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shadow-xs"
              style={{
                background: '#72001c',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#570014'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#72001c'; }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {error && !data && (
        <ErrorState
          title="Backend Unreachable"
          message={error}
          onRetry={load}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={loading ? '—' : data?.total_transactions ?? 0}
          icon={<ArrowLeftRight size={16} />}
          accentColor="#72001c"
          subtitle="All time"
          loading={loading && !data}
        />
        <StatCard
          title="Total Value"
          value={loading && !data ? '—' : formatCurrency(data?.total_value ?? 0)}
          icon={<TrendingUp size={16} />}
          accentColor="#9e0c2d"
          subtitle="Processed volume"
          loading={loading && !data}
        />
        <StatCard
          title="High Risk"
          value={loading && !data ? '—' : data?.high_risk ?? 0}
          icon={<AlertTriangle size={16} />}
          accentColor="#b91c1c"
          subtitle="Require immediate review"
          loading={loading && !data}
        />
        <StatCard
          title="Open Cases"
          value={loading && !data ? '—' : data?.open_cases ?? 0}
          icon={<Briefcase size={16} />}
          accentColor="#b45309"
          subtitle="Under investigation"
          loading={loading && !data}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Medium Risk"
          value={loading && !data ? '—' : data?.medium_risk ?? 0}
          icon={<ShieldAlert size={16} />}
          accentColor="#d97706"
          subtitle="Monitoring required"
          loading={loading && !data}
        />
        <StatCard
          title="Low Risk"
          value={loading && !data ? '—' : data?.low_risk ?? 0}
          icon={<ArrowLeftRight size={16} />}
          accentColor="#15803d"
          subtitle="Normal activity"
          loading={loading && !data}
        />
        <StatCard
          title="AML Patterns"
          value={loading && !data ? '—' : data?.aml_patterns ?? 0}
          icon={<BarChart3 size={16} />}
          accentColor="#880022"
          subtitle="Detected indicators"
          loading={loading && !data}
        />
        <StatCard
          title="Flagged Accounts"
          value={loading && !data ? '—' : data?.flagged_accounts ?? 0}
          icon={<ShieldAlert size={16} />}
          accentColor="#c2410c"
          subtitle="Under review"
          loading={loading && !data}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#20080e' }}>
            Risk Distribution
          </h2>
          {loading && !data ? (
            <LoadingSkeleton rows={3} />
          ) : riskDistribution.length > 0 ? (
            <>
              <div style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid rgba(114,0,28,0.15)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 14px rgba(114,0,28,0.08)',
                        color: '#20080e',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {riskDistribution.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                      <span style={{ color: '#6e444f' }}>{d.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: '#20080e' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: '#8c626d' }}>
              No risk data available
            </div>
          )}
        </div>

        {/* Risk trend bar chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#20080e' }}>
            Risk Summary Breakdown
          </h2>
          {loading && !data ? (
            <LoadingSkeleton rows={3} />
          ) : data ? (
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { name: 'Low', value: data.low_risk, fill: '#15803d' },
                    { name: 'Medium', value: data.medium_risk, fill: '#b45309' },
                    { name: 'High', value: data.high_risk, fill: '#b91c1c' },
                  ]}
                  margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,0,28,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#6e444f', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6e444f', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid rgba(114,0,28,0.15)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 14px rgba(114,0,28,0.08)',
                      color: '#20080e',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#72001c" fill="url(#burgundyGradient)" strokeWidth={2.5} />
                  <defs>
                    <linearGradient id="burgundyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#72001c" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#72001c" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </div>

      {/* Recent Alerts table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: 'rgba(114,0,28,0.08)', background: '#faf5f6' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#20080e' }}>
            Recent Alerts
          </h2>
        </div>
        <div className="overflow-x-auto">
          {loading && !data ? (
            <div className="p-5"><LoadingSkeleton rows={4} /></div>
          ) : data?.recent_alerts && data.recent_alerts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(114,0,28,0.08)', background: '#faf5f6' }}>
                  {['Alert ID', 'Transaction', 'Score', 'Severity', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6e444f' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_alerts.map((alert, i) => {
                  const id = alert.alert_id || alert.id || `ALERT-${i}`;
                  const txRef = alert.transaction_ref || alert.transaction_id || '—';
                  const score = alert.risk_score ?? 0;
                  const severity = alert.severity || alert.risk_level || getRiskFromScore(score);
                  const time = alert.timestamp || alert.created_at;
                  return (
                    <tr
                      key={String(id)}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid rgba(114,0,28,0.05)' }}
                    >
                      <td className="px-5 py-3 font-mono-data font-semibold" style={{ color: '#72001c' }}>{String(id)}</td>
                      <td className="px-5 py-3 font-mono-data" style={{ color: '#20080e' }}>{txRef}</td>
                      <td className="px-5 py-3">
                        <span className="font-semibold" style={{ color: '#20080e' }}>{score}</span>
                      </td>
                      <td className="px-5 py-3">
                        <RiskBadge level={String(severity)} score={undefined} />
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: '#8c626d' }}>
                        {time ? new Date(time).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-center text-sm py-10" style={{ color: '#8c626d' }}>
              No recent alerts. Dashboard data loaded from backend.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
