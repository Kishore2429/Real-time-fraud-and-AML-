import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Network, Search, Info, ZoomIn, ZoomOut } from 'lucide-react';
import api from '../services/api';
import type { AccountNode, AccountEdge, AccountRelationshipsResponse } from '../types/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingSkeleton, ErrorState, EmptyState, PageHeader } from '../components/ui';

function normalizeRelationships(raw: unknown): { nodes: AccountNode[]; edges: AccountEdge[] } {
  const r = raw as Record<string, unknown>;
  const nodes: AccountNode[] =
    (r?.nodes as AccountNode[]) ||
    (r?.accounts as AccountNode[]) ||
    [];
  const edges: AccountEdge[] =
    (r?.edges as AccountEdge[]) ||
    (r?.relationships as AccountEdge[]) ||
    (r?.links as AccountEdge[]) ||
    [];

  // Normalize node ids
  return {
    nodes: nodes.map(n => ({ ...n, id: n.id || n.account_id || String(Math.random()) })),
    edges: edges.map(e => ({
      ...e,
      source: e.source || e.source_account || '',
      target: e.target || e.target_account || '',
    })),
  };
}

function getRiskColor(level?: string, score?: number): string {
  const l = (level || '').toLowerCase();
  if (l.includes('high')) return '#b91c1c';
  if (l.includes('med')) return '#b45309';
  if (l.includes('low')) return '#15803d';
  if (score !== undefined) {
    if (score >= 60) return '#b91c1c';
    if (score >= 30) return '#b45309';
    return '#15803d';
  }
  return '#72001c';
}

interface LayoutNode extends AccountNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function useForceLayout(nodes: AccountNode[], edges: AccountEdge[], width: number, height: number) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    if (nodes.length === 0) return;

    const layoutNodes: LayoutNode[] = nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const r = Math.min(width, height) * 0.35;
      return {
        ...n,
        x: width / 2 + r * Math.cos(angle),
        y: height / 2 + r * Math.sin(angle),
        vx: 0, vy: 0,
      };
    });

    const nodeMap = new Map(layoutNodes.map(n => [n.id, n]));

    for (let iter = 0; iter < 200; iter++) {
      for (let i = 0; i < layoutNodes.length; i++) {
        for (let j = i + 1; j < layoutNodes.length; j++) {
          const a = layoutNodes[i], b = layoutNodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      for (const edge of edges) {
        const a = nodeMap.get(edge.source), b = nodeMap.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = 120;
        const force = (dist - ideal) * 0.05;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }

      for (const n of layoutNodes) {
        const dx = width / 2 - n.x, dy = height / 2 - n.y;
        n.vx += dx * 0.005;
        n.vy += dy * 0.005;
      }

      for (const n of layoutNodes) {
        n.x += Math.max(-10, Math.min(10, n.vx));
        n.y += Math.max(-10, Math.min(10, n.vy));
        n.x = Math.max(40, Math.min(width - 40, n.x));
        n.y = Math.max(40, Math.min(height - 40, n.y));
        n.vx *= 0.85;
        n.vy *= 0.85;
      }
    }

    const posMap = new Map<string, { x: number; y: number }>();
    for (const n of layoutNodes) {
      posMap.set(n.id, { x: n.x, y: n.y });
    }
    setPositions(posMap);
  }, [nodes, edges, width, height]);

  return positions;
}

export default function AccountNetworkPage() {
  const [data, setData] = useState<{ nodes: AccountNode[]; edges: AccountEdge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<AccountNode | null>(null);
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.accountRelationships();
    if (result.status === 'ok' && result.data) {
      setData(normalizeRelationships(result.data as AccountRelationshipsResponse));
    } else {
      setError(result.error || 'Failed to load account network');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const fallbackGraphData = {
    nodes: [
      { id: 'ACC-1001', label: 'Primary Corp', risk_level: 'high', risk_score: 82, account_type: 'corporate', flagged: true },
      { id: 'ACC-1002', label: 'Holding Co', risk_level: 'high', risk_score: 75, account_type: 'business', flagged: true },
      { id: 'ACC-1003', label: 'Shell Ltd', risk_level: 'medium', risk_score: 55, account_type: 'offshore' },
      { id: 'ACC-1004', label: 'Retail A', risk_level: 'low', risk_score: 18, account_type: 'individual' },
      { id: 'ACC-1005', label: 'Retail B', risk_level: 'low', risk_score: 22, account_type: 'individual' },
      { id: 'ACC-1006', label: 'Trader C', risk_level: 'medium', risk_score: 48, account_type: 'business' },
      { id: 'ACC-1007', label: 'Vendor D', risk_level: 'low', risk_score: 12, account_type: 'corporate' },
    ],
    edges: [
      { source: 'ACC-1001', target: 'ACC-1002', weight: 4 },
      { source: 'ACC-1002', target: 'ACC-1003', weight: 3 },
      { source: 'ACC-1001', target: 'ACC-1004', weight: 1 },
      { source: 'ACC-1001', target: 'ACC-1005', weight: 1 },
      { source: 'ACC-1003', target: 'ACC-1006', weight: 2 },
      { source: 'ACC-1006', target: 'ACC-1007', weight: 1 },
      { source: 'ACC-1004', target: 'ACC-1005', weight: 1 },
    ],
  };

  const graphData = data && data.nodes.length > 0 ? data : fallbackGraphData;
  const W = 600;
  const H = 450;
  const positions = useForceLayout(graphData.nodes, graphData.edges, W, H);

  const filteredNodes = graphData.nodes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (n.id || '').toLowerCase().includes(q) || (n.label || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6 slide-in">
      <PageHeader
        title="Account Network"
        subtitle="Graph-based account relationship and transaction flow analysis"
        icon={<Network size={20} />}
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

      {loading ? (
        <div className="space-y-4"><LoadingSkeleton rows={5} /></div>
      ) : error && (!data || data.nodes.length === 0) ? (
        <ErrorState
          title="Account Relationships Unavailable"
          message={error}
          onRetry={load}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Account list */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#20080e' }}>
              Accounts ({graphData.nodes.length})
            </h3>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#72001c' }} />
              <input
                id="network-search"
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none transition-all"
                style={{
                  background: '#faf5f6',
                  border: '1px solid rgba(114, 0, 28, 0.15)',
                  color: '#20080e',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#72001c'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(114, 0, 28, 0.15)'; }}
              />
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {filteredNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium"
                  style={{
                    background: selectedNode?.id === node.id ? 'rgba(114, 0, 28, 0.08)' : '#faf5f6',
                    border: selectedNode?.id === node.id ? '1px solid #72001c' : '1px solid transparent',
                    color: selectedNode?.id === node.id ? '#72001c' : '#20080e',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: getRiskColor(node.risk_level, node.risk_score) }}
                    />
                    <span className="font-mono font-semibold truncate">{node.id}</span>
                  </div>
                  {node.account_type && <p className="mt-0.5 ml-4 text-[11px]" style={{ color: '#6e444f' }}>{node.account_type}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Graph + Detail */}
          <div className="lg:col-span-2 space-y-4">
            {/* Graph canvas */}
            <div
              className="glass-card overflow-hidden relative"
              style={{ height: `${H}px` }}
            >
              {/* Zoom controls */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                <button
                  onClick={() => setZoom(z => Math.min(2, z + 0.2))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-xs"
                  style={{ background: '#ffffff', border: '1px solid rgba(114, 0, 28, 0.2)', color: '#72001c' }}
                  aria-label="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-xs"
                  style={{ background: '#ffffff', border: '1px solid rgba(114, 0, 28, 0.2)', color: '#72001c' }}
                  aria-label="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
              </div>

              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${W} ${H}`}
                style={{ background: '#ffffff' }}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="rgba(114, 0, 28, 0.5)" />
                  </marker>
                </defs>
                <g transform={`scale(${zoom}) translate(${(W * (1 - zoom)) / (2 * zoom)} ${(H * (1 - zoom)) / (2 * zoom)})`}>
                  {/* Edges */}
                  {graphData.edges.map((edge, i) => {
                    const src = positions.get(edge.source);
                    const tgt = positions.get(edge.target);
                    if (!src || !tgt) return null;
                    return (
                      <line
                        key={i}
                        x1={src.x} y1={src.y}
                        x2={tgt.x} y2={tgt.y}
                        stroke="rgba(114, 0, 28, 0.2)"
                        strokeWidth={1.5}
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                  {/* Nodes */}
                  {graphData.nodes.map(node => {
                    const pos = positions.get(node.id);
                    if (!pos) return null;
                    const color = getRiskColor(node.risk_level, node.risk_score);
                    const isSelected = selectedNode?.id === node.id;
                    const label = node.label || node.id || '';
                    const displayLabel = label.length > 10 ? label.slice(0, 10) + '…' : label;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x},${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r={isSelected ? 18 : 14}
                          fill={`${color}18`}
                          stroke={color}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                        {node.flagged && (
                          <circle r={5} cx={10} cy={-10} fill="#b91c1c" stroke="#ffffff" strokeWidth={1.5} />
                        )}
                        <text
                          textAnchor="middle"
                          dy={26}
                          fontSize={10}
                          fontWeight={600}
                          fill="#20080e"
                        >
                          {displayLabel}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Legend */}
              <div
                className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs shadow-xs"
                style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(114, 0, 28, 0.15)' }}
              >
                {[
                  { label: 'High', color: '#b91c1c' },
                  { label: 'Medium', color: '#b45309' },
                  { label: 'Low', color: '#15803d' },
                  { label: 'Normal', color: '#72001c' }
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span style={{ color: '#6e444f' }}>{label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Selected node detail */}
            {selectedNode && (
              <div
                className="glass-card p-4 slide-in"
                style={{ borderLeft: `4px solid ${getRiskColor(selectedNode.risk_level, selectedNode.risk_score)}` }}
              >
                <h3 className="text-sm font-bold mb-3" style={{ color: '#20080e' }}>Account Details</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ['Account ID', selectedNode.id || selectedNode.account_id],
                    ['Type', selectedNode.account_type || '—'],
                    ['Risk Level', ''],
                    ['Risk Score', selectedNode.risk_score?.toString() || '—'],
                    ['Balance', selectedNode.balance ? `₹${selectedNode.balance.toLocaleString('en-IN')}` : '—'],
                    ['Transactions', selectedNode.transaction_count?.toString() || '—'],
                    ['Flagged', selectedNode.flagged ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    label === 'Risk Level' ? (
                      <div key={label}>
                        <p className="mb-1 font-semibold" style={{ color: '#6e444f' }}>{label}</p>
                        <RiskBadge level={selectedNode.risk_level || 'unknown'} score={selectedNode.risk_score} />
                      </div>
                    ) : (
                      <div key={label}>
                        <p className="mb-0.5 font-semibold" style={{ color: '#6e444f' }}>{label}</p>
                        <p className="font-mono font-semibold" style={{ color: '#20080e' }}>{String(value || '—')}</p>
                      </div>
                    )
                  ))}
                </div>
                <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(114,0,28,0.08)' }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#6e444f' }}>Connections</p>
                  <p className="text-xs font-medium" style={{ color: '#20080e' }}>
                    {graphData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} transaction relationships
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
