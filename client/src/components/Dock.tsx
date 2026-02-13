import { useLocation } from 'wouter';
import {
  Home,
  Scale,
  Map,
  Database,
  TrendingUp,
  Brain,
  Users,
  Shield,
  Layers,
  BarChart3,
  Building2,
  Calculator,
  type LucideIcon,
} from 'lucide-react';

interface DockApp {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

export function Dock() {
  const [location, setLocation] = useLocation();

  const apps: DockApp[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
    },
    {
      id: 'appeals',
      label: 'Appeals',
      icon: Scale,
      path: '/appeals',
      badge: 12, // Example: 12 pending appeals
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/appeals/analytics',
    },
    {
      id: 'map',
      label: 'Map',
      icon: Map,
      path: '/map-explorer',
    },
    {
      id: 'data',
      label: 'Data',
      icon: Database,
      path: '/wa-data-ingestion',
    },
    {
      id: 'defense',
      label: 'Defense',
      icon: Shield,
      path: '/appeal-defense',
    },
    {
      id: 'appraisal',
      label: 'Appraisal',
      icon: Building2,
      path: '/mass-appraisal',
    },
    {
      id: 'ratio',
      label: 'Ratio Study',
      icon: Calculator,
      path: '/ratio-study',
    },

  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location === '/';
    }
    return location.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4">
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-2xl
                   bg-[var(--color-glass-3)] backdrop-blur-xl
                   border border-white/20
                   shadow-[0_-10px_40px_rgba(0,0,0,0.3),0_0_60px_rgba(0,255,238,0.1)]"
      >
        {apps.map((app) => {
          const Icon = app.icon;
          const active = isActive(app.path);

          return (
            <button
              key={app.id}
              onClick={() => setLocation(app.path)}
              className={`
                relative group flex flex-col items-center justify-center
                w-14 h-14 rounded-xl
                transition-all duration-[var(--duration-normal)]
                ${
                  active
                    ? 'bg-[var(--color-signal-primary)] text-[var(--color-government-night-base)] scale-110'
                    : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-2)] hover:text-[var(--color-text-primary)] hover:scale-105'
                }
              `}
              title={app.label}
            >
              <Icon className="w-6 h-6" />

              {/* Badge */}
              {app.badge && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                             bg-[var(--color-signal-alert)] text-white
                             text-xs font-bold flex items-center justify-center
                             shadow-[0_0_10px_rgba(255,51,102,0.5)]"
                >
                  {app.badge}
                </span>
              )}

              {/* Active Indicator */}
              {active && (
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2
                             w-1 h-1 rounded-full
                             bg-[var(--color-signal-primary)]
                             shadow-[0_0_8px_rgba(0,255,238,0.8)]"
                />
              )}

              {/* Tooltip */}
              <span
                className="absolute -top-10 left-1/2 -translate-x-1/2
                           px-3 py-1 rounded-lg
                           bg-[var(--color-government-night-base)] border border-white/20
                           text-xs font-medium text-[var(--color-text-primary)]
                           opacity-0 group-hover:opacity-100
                           transition-opacity duration-[var(--duration-fast)]
                           pointer-events-none whitespace-nowrap
                           shadow-lg"
              >
                {app.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
