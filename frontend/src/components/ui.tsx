import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 4, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="shimmer h-10 w-full" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="shimmer h-4 w-1/3" />
      <div className="shimmer h-8 w-1/2" />
      <div className="shimmer h-3 w-2/3" />
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)' }}
      >
        ⚠️
      </div>
      <div>
        <p className="font-semibold text-rose-700">{title}</p>
        <p className="text-sm mt-1 max-w-sm" style={{ color: '#6e444f' }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-xs"
          style={{
            background: '#72001c',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#570014'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#72001c'; }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
}

export function EmptyState({ icon = '📋', title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{ background: 'rgba(114,0,28,0.05)', border: '1px solid rgba(114,0,28,0.12)' }}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold" style={{ color: '#20080e' }}>{title}</p>
        <p className="text-sm mt-1 max-w-sm" style={{ color: '#6e444f' }}>{message}</p>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-xs"
            style={{
              background: 'rgba(114, 0, 28, 0.08)',
              border: '1px solid rgba(114, 0, 28, 0.2)',
              color: '#72001c',
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#20080e' }}>{title}</h1>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: '#6e444f' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, icon, accentColor = '#72001c', loading }: StatCardProps) {
  return (
    <div
      className="glass-card glass-card-hover p-5 relative overflow-hidden"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
          transform: 'translate(25%, -25%)',
        }}
      />
      <div className="flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6e444f' }}>
            {title}
          </p>
          {loading ? (
            <div className="shimmer h-8 w-24 mb-2" />
          ) : (
            <p className="text-2xl font-bold tracking-tight" style={{ color: '#20080e' }}>
              {value}
            </p>
          )}
          {subtitle && <p className="text-xs mt-1" style={{ color: '#8c626d' }}>{subtitle}</p>}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}12` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
