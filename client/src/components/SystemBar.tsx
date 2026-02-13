import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Bell, Settings, ChevronDown, LogOut, User, Zap, Wifi, Database } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function SystemBar() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);

  // Mock system health data (would be real in production)
  const systemHealth = {
    database: 'healthy',
    api: 'healthy',
    websocket: 'healthy',
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50
                 h-14 flex items-center justify-between px-6
                 bg-[var(--color-glass-2)] backdrop-blur-xl
                 border-b border-white/10
                 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
    >
      {/* Left: TerraForge Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-signal-primary)] to-[var(--color-signal-secondary)] flex items-center justify-center">
          <Zap className="w-5 h-5 text-[var(--color-government-night-base)]" />
        </div>
        <span className="text-lg font-bold text-[var(--color-text-primary)]">
          TerraForge
        </span>
      </div>

      {/* Center: Page Title (optional, can be set by pages) */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm text-[var(--color-text-tertiary)]">
          Mass Valuation Appraisal Suite
        </span>
      </div>

      {/* Right: System Controls */}
      <div className="flex items-center gap-4">
        {/* System Health Indicator */}
        <button
          onClick={() => setShowControlCenter(!showControlCenter)}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg
                     hover:bg-[var(--color-glass-2)] transition-colors duration-[var(--duration-fast)]"
          title="System Health"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-signal-success)] shadow-[0_0_6px_rgba(0,255,136,0.6)]" />
            <Wifi className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </div>
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg
                     hover:bg-[var(--color-glass-2)] transition-colors duration-[var(--duration-fast)]"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
          {/* Notification Badge */}
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full
                       bg-[var(--color-signal-alert)]
                       shadow-[0_0_6px_rgba(255,51,102,0.6)]"
          />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                       hover:bg-[var(--color-glass-2)] transition-colors duration-[var(--duration-fast)]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-signal-primary)] to-[var(--color-signal-secondary)] flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--color-government-night-base)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {user?.name || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />

              {/* Menu */}
              <div
                className="absolute top-full right-0 mt-2 w-64 z-50
                           bg-[var(--color-government-night-elevated)] backdrop-blur-xl
                           border border-white/10 rounded-xl
                           shadow-[0_10px_40px_rgba(0,0,0,0.4)]
                           overflow-hidden"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">
                    {user?.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    {user?.email}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-signal-primary)]/20 text-[var(--color-signal-primary)]">
                      {user?.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2
                               hover:bg-[var(--color-glass-2)] transition-colors duration-[var(--duration-fast)]
                               text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-2
                               hover:bg-[var(--color-glass-2)] transition-colors duration-[var(--duration-fast)]
                               text-[var(--color-signal-alert)] hover:text-[var(--color-signal-alert)]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Control Center Dropdown */}
      {showControlCenter && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowControlCenter(false)}
          />

          {/* Control Center Panel */}
          <div
            className="absolute top-full right-6 mt-2 w-80 z-50
                       bg-[var(--color-government-night-elevated)] backdrop-blur-xl
                       border border-white/10 rounded-xl
                       shadow-[0_10px_40px_rgba(0,0,0,0.4)]
                       overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Control Center
              </h3>
            </div>

            {/* System Health */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-signal-success)]" />
                  <span className="text-xs text-[var(--color-text-tertiary)]">Healthy</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-signal-success)]" />
                  <span className="text-xs text-[var(--color-text-tertiary)]">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">WebSocket</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-signal-success)]" />
                  <span className="text-xs text-[var(--color-text-tertiary)]">Connected</span>
                </div>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="px-4 py-3 border-t border-white/10">
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                           hover:bg-[var(--color-glass-2)] transition-colors duration-[var(--duration-fast)]"
              >
                <span className="text-sm text-[var(--color-text-secondary)]">System Settings</span>
                <Settings className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
