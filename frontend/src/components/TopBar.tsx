import React, { useState } from 'react';
import { Search, Bell, User } from 'lucide-react';

interface TopBarProps {
  sidebarCollapsed: boolean;
}

export default function TopBar({ sidebarCollapsed: _ }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header
      className="flex items-center gap-4 px-6 h-16 flex-shrink-0"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(114, 0, 28, 0.1)',
        boxShadow: '0 1px 3px rgba(114, 0, 28, 0.03)',
      }}
    >
      {/* Search bar */}
      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#72001c' }} />
        <input
          id="global-search"
          type="text"
          placeholder="Search transactions, alerts, accounts..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
          style={{
            background: '#faf5f6',
            border: '1px solid rgba(114, 0, 28, 0.15)',
            color: '#20080e',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#72001c';
            e.target.style.boxShadow = '0 0 0 3px rgba(114, 0, 28, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(114, 0, 28, 0.15)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div className="flex-1" />

      {/* Date/time */}
      <div className="hidden md:flex flex-col items-end text-xs">
        <span className="font-mono font-semibold" style={{ color: '#20080e' }}>{timeStr}</span>
        <span style={{ color: '#8c626d' }}>{dateStr}</span>
      </div>

      {/* Notifications */}
      <button
        id="notifications-btn"
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: '#72001c' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(114, 0, 28, 0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: '#b91c1c' }}
        />
      </button>

      {/* User */}
      <button
        id="user-menu-btn"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(114, 0, 28, 0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="User menu"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shadow-xs"
          style={{ background: 'linear-gradient(135deg, #72001c, #9e0c2d)' }}
        >
          <User size={14} className="text-white" />
        </div>
        <span className="hidden md:block font-medium" style={{ color: '#20080e' }}>Analyst</span>
      </button>
    </header>
  );
}
