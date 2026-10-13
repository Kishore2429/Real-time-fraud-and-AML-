import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  BarChart3,
  Network,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import api from '../services/api';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { path: '/transactions', label: 'Transactions', icon: <ArrowLeftRight size={18} /> },
  { path: '/fraud-alerts', label: 'Fraud Alerts', icon: <ShieldAlert size={18} /> },
  { path: '/aml', label: 'AML Monitoring', icon: <BarChart3 size={18} /> },
  { path: '/network', label: 'Account Network', icon: <Network size={18} /> },
  { path: '/cases', label: 'Investigation Cases', icon: <Briefcase size={18} /> },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const result = await api.health();
      setConnected(result.status === 'ok');
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 relative select-none"
      style={{
        width: collapsed ? '64px' : '220px',
        background: 'linear-gradient(180deg, #ffffff 0%, #faf5f6 100%)',
        borderRight: '1px solid rgba(114, 0, 28, 0.1)',
        minHeight: '100vh',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ minHeight: '72px' }}>
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg shadow-sm"
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #72001c, #9e0c2d)',
            boxShadow: '0 2px 10px rgba(114, 0, 28, 0.25)',
          }}
        >
          <Zap size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm leading-tight tracking-wider" style={{ color: '#72001c' }}>
              SYNESIS 26
            </div>
            <div className="text-[10px] font-semibold mt-0.5 tracking-widest uppercase" style={{ color: '#9e2a47' }}>
              Fraud &amp; AML
            </div>
          </div>
        )}
      </div>

      {/* DEMO label */}
      {!collapsed && (
        <div className="mx-3 mb-4">
          <div
            className="text-center py-1 rounded text-xs font-semibold tracking-widest"
            style={{
              background: 'rgba(114, 0, 28, 0.06)',
              border: '1px solid rgba(114, 0, 28, 0.18)',
              color: '#72001c',
            }}
          >
            DEMO ENV
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'nav-active'
                  : 'text-[#6e444f] hover:text-[#72001c] hover:bg-[#72001c]/5'
              }`}
              style={
                isActive
                  ? { borderLeft: '3px solid #72001c', background: 'rgba(114, 0, 28, 0.08)', color: '#72001c' }
                  : { borderLeft: '3px solid transparent' }
              }
            >
              <span
                className={`flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#72001c]' : 'text-[#8c626d] group-hover:text-[#72001c]'
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="p-3">
        {!collapsed ? (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(114, 0, 28, 0.03)', border: '1px solid rgba(114, 0, 28, 0.08)' }}
          >
            {connected === null ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot" />
                <span className="text-amber-700 font-medium">Checking...</span>
              </>
            ) : connected ? (
              <>
                <Wifi size={12} className="text-emerald-600" />
                <span className="text-emerald-700 font-medium">Backend Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-rose-600" />
                <span className="text-rose-700 font-medium">Disconnected</span>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {connected ? (
              <Wifi size={16} className="text-emerald-600" />
            ) : connected === false ? (
              <WifiOff size={16} className="text-rose-600" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-500 pulse-dot" />
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(114, 0, 28, 0.2)',
          color: '#72001c',
          zIndex: 10,
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
