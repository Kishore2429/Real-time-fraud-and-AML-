import React from 'react';

interface RiskBadgeProps {
  level: string;
  score?: number;
  size?: 'sm' | 'md';
}

export function getRiskLevel(level: string = ''): 'high' | 'medium' | 'low' | 'unknown' {
  const l = level.toLowerCase();
  if (l.includes('high') || l.includes('critical')) return 'high';
  if (l.includes('med')) return 'medium';
  if (l.includes('low')) return 'low';
  return 'unknown';
}

export function getRiskFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

const riskConfig = {
  high: {
    bg: 'rgba(185,28,28,0.08)',
    border: 'rgba(185,28,28,0.25)',
    text: '#b91c1c',
    label: 'HIGH',
  },
  medium: {
    bg: 'rgba(180,83,9,0.08)',
    border: 'rgba(180,83,9,0.25)',
    text: '#b45309',
    label: 'MEDIUM',
  },
  low: {
    bg: 'rgba(21,128,61,0.08)',
    border: 'rgba(21,128,61,0.25)',
    text: '#15803d',
    label: 'LOW',
  },
  unknown: {
    bg: 'rgba(110,68,79,0.08)',
    border: 'rgba(110,68,79,0.2)',
    text: '#6e444f',
    label: 'UNKNOWN',
  },
};

export default function RiskBadge({ level, score, size = 'sm' }: RiskBadgeProps) {
  const risk = getRiskLevel(level);
  const cfg = riskConfig[risk];
  const padding = size === 'md' ? '4px 12px' : '2px 8px';
  const fontSize = size === 'md' ? '0.75rem' : '0.7rem';

  return (
    <span
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        padding,
        borderRadius: '6px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.06em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: cfg.text,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {cfg.label}
      {score !== undefined && ` • ${score}`}
    </span>
  );
}
