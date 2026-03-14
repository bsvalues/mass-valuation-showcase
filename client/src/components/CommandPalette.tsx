import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useLocation } from 'wouter';
import {
  Home,
  BarChart3,
  FileText,
  Map,
  Database,
  Users,
  Settings,
  Search,
  TrendingUp,
  Scale,
  MessageSquare,
  FileUp,
  Calendar,
  Bell,
  Shield,
  Layers,
  Brain,
  Workflow,
  Calculator,
  type LucideIcon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  action: () => void;
  category: 'navigation' | 'action' | 'data';
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Keyboard shortcut handler (⌘K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentCommands');
    if (stored) {
      setRecentCommands(JSON.parse(stored));
    }
  }, []);

  const executeCommand = (commandId: string, action: () => void) => {
    action();
    setOpen(false);

    // Update recent commands
    const updated = [commandId, ...recentCommands.filter(id => id !== commandId)].slice(0, 5);
    setRecentCommands(updated);
    localStorage.setItem('recentCommands', JSON.stringify(updated));
  };

  // Define all commands
  const commands: CommandItem[] = [
    // Navigation Commands
    {
      id: 'nav-home',
      label: 'Home Dashboard',
      description: 'Return to main dashboard',
      icon: Home,
      category: 'navigation',
      action: () => setLocation('/'),
      keywords: ['dashboard', 'main', 'overview'],
    },
    {
      id: 'nav-appeals',
      label: 'Appeals Management',
      description: 'Manage property appeals',
      icon: FileText,
      category: 'navigation',
      action: () => setLocation('/appeals'),
      keywords: ['appeals', 'property', 'management'],
    },
    {
      id: 'nav-appeals-analytics',
      label: 'Appeal Analytics',
      description: 'View appeal statistics and trends',
      icon: BarChart3,
      category: 'navigation',
      action: () => setLocation('/appeals/analytics'),
      keywords: ['analytics', 'statistics', 'charts'],
    },
    {
      id: 'nav-comparison',
      label: 'Appeal Comparison',
      description: 'Compare multiple appeals side-by-side',
      icon: Scale,
      category: 'navigation',
      action: () => setLocation('/appeals/comparison'),
      keywords: ['compare', 'analysis'],
    },
    {
      id: 'nav-templates',
      label: 'Resolution Templates',
      description: 'Manage appeal resolution templates',
      icon: FileText,
      category: 'navigation',
      action: () => setLocation('/templates'),
      keywords: ['templates', 'resolution'],
    },
    {
      id: 'nav-map',
      label: 'Map Explorer',
      description: 'View properties on interactive map',
      icon: Map,
      category: 'navigation',
      action: () => setLocation('/map-explorer'),
      keywords: ['map', 'gis', 'spatial'],
    },
    {
      id: 'nav-data-ingestion',
      label: 'Data Ingestion',
      description: 'Upload and import data',
      icon: Database,
      category: 'navigation',
      action: () => setLocation('/wa-data-ingestion'),
      keywords: ['upload', 'import', 'csv'],
    },
    {
      id: 'nav-regression',
      label: 'Regression Studio',
      description: 'Statistical analysis and modeling',
      icon: TrendingUp,
      category: 'navigation',
      action: () => setLocation('/regression-studio'),
      keywords: ['regression', 'statistics', 'modeling'],
    },
    {
      id: 'nav-avm',
      label: 'AVM Studio',
      description: 'Automated valuation models',
      icon: Brain,
      category: 'navigation',
      action: () => setLocation('/avm-studio'),
      keywords: ['avm', 'machine learning', 'prediction'],
    },
    {
      id: 'nav-model-management',
      label: 'Model Management',
      description: 'Manage saved AVM models',
      icon: Layers,
      category: 'navigation',
      action: () => setLocation('/model-management'),
      keywords: ['models', 'saved'],
    },
    {
      id: 'nav-admin-users',
      label: 'User Management',
      description: 'Manage system users',
      icon: Users,
      category: 'navigation',
      action: () => setLocation('/admin/users'),
      keywords: ['users', 'admin', 'permissions'],
    },
    {
      id: 'nav-governance',
      label: 'Governance & Audit',
      description: 'View audit logs and compliance',
      icon: Shield,
      category: 'navigation',
      action: () => setLocation('/governance'),
      keywords: ['audit', 'logs', 'compliance'],
    },
    {
      id: 'nav-mass-appraisal-dashboard',
      label: 'Mass Appraisal Dashboard',
      description: 'County-wide assessment quality metrics and ratio distribution',
      icon: BarChart3,
      category: 'navigation',
      action: () => setLocation('/mass-appraisal-dashboard'),
      keywords: ['mass appraisal', 'cod', 'prd', 'county', 'dashboard', 'quality'],
    },
    {
      id: 'nav-cluster-heatmap',
      label: 'Cluster Heatmap',
      description: 'Visualize property value clusters on the map',
      icon: Map,
      category: 'navigation',
      action: () => setLocation('/cluster-map'),
      keywords: ['cluster', 'heatmap', 'map', 'spatial', 'neighborhood'],
    },
    {
      id: 'nav-property-heatmap',
      label: 'Property Value Heatmap',
      description: 'Filter and visualize assessed values by type and neighborhood',
      icon: Map,
      category: 'navigation',
      action: () => setLocation('/property-heatmap'),
      keywords: ['heatmap', 'property', 'value', 'filter', 'neighborhood'],
    },
    {
      id: 'nav-ratio-study-analyzer',
      label: 'Ratio Study Analyzer',
      description: 'Deep-dive assessment ratio analysis with IAAO standards',
      icon: TrendingUp,
      category: 'navigation',
      action: () => setLocation('/ratio-study-analyzer'),
      keywords: ['ratio', 'cod', 'prd', 'study', 'analyzer', 'iaao'],
    },
    {
      id: 'nav-value-drivers',
      label: 'Value Driver Analysis',
      description: 'Analyze factors driving property values',
      icon: TrendingUp,
      category: 'navigation',
      action: () => setLocation('/value-drivers'),
      keywords: ['value drivers', 'regression', 'factors', 'analysis'],
    },

    // Action Commands
    {
      id: 'action-new-appeal',
      label: 'Create New Appeal',
      description: 'Start a new property appeal',
      icon: FileUp,
      category: 'action',
      action: () => {
        setLocation('/appeals');
        // Trigger new appeal modal (would need to be implemented)
      },
      keywords: ['new', 'create', 'appeal'],
    },
    {
      id: 'action-run-ratio-study',
      label: 'Run Ratio Study',
      description: 'Analyze assessment ratios (COD/PRD)',
      icon: Calculator,
      category: 'action',
      action: () => setLocation('/ratio-study'),
      keywords: ['ratio', 'cod', 'prd', 'study'],
    },
    {
      id: 'action-export-report',
      label: 'Export Report',
      description: 'Generate and download system summary CSV',
      icon: FileText,
      category: 'action',
      action: () => {
        // Generate a system summary report as CSV and trigger browser download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const rows = [
          ['TerraFusion Mass Valuation Appraisal Suite — System Report'],
          ['Generated', new Date().toLocaleString()],
          [''],
          ['Section', 'Metric', 'Value'],
          ['System', 'Report Type', 'Summary Export'],
          ['System', 'Export Timestamp', new Date().toISOString()],
          ['Navigation', 'Current Page', window.location.pathname],
          ['System', 'User Agent', navigator.userAgent.split(' ').slice(-2).join(' ')],
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `terraforge-report-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
      },
      keywords: ['export', 'csv', 'report', 'download'],
    },
    // Removed duplicate - use nav-data-ingestion instead
    {
      id: 'action-generate-defense',
      label: 'Generate Defense Document',
      description: 'Create appeal defense documentation',
      icon: Shield,
      category: 'action',
      action: () => setLocation('/appeal-defense'),
      keywords: ['defense', 'document', 'generate'],
    },
    {
      id: 'action-view-recent-appeals',
      label: 'View Recent Appeals',
      description: 'Show latest appeal submissions',
      icon: Calendar,
      category: 'action',
      action: () => setLocation('/appeals'),
      keywords: ['recent', 'latest', 'appeals'],
    },
    {
      id: 'action-system-health',
      label: 'System Health Check',
      description: 'View system status and performance',
      icon: Workflow,
      category: 'action',
      action: () => setLocation('/background-jobs'),
      keywords: ['health', 'status', 'performance', 'system', 'jobs'],
    },
    {
      id: 'action-train-model',
      label: 'Train AVM Model',
      description: 'Start model training',
      icon: Brain,
      category: 'action',
      action: () => setLocation('/avm-studio'),
      keywords: ['train', 'model', 'avm'],
    },

    // Data Commands
    // Removed duplicate - use nav-map instead
  ];

  const filteredRecentCommands = commands.filter(cmd => recentCommands.includes(cmd.id));

  return (
    <>
      {/* Keyboard hint button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full
                   bg-[var(--color-glass-2)] backdrop-blur-xl border border-white/10
                   text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                   hover:bg-[var(--color-glass-3)] transition-all duration-[var(--duration-fast)]
                   shadow-[0_0_20px_rgba(0,255,238,0.1)]"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm font-medium">Search</span>
        <kbd className="px-2 py-0.5 text-xs rounded bg-white/10 border border-white/20">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Palette"
        className="fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

        {/* Command Palette Container */}
        <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
          <Command.Input
            placeholder="Search commands, pages, and actions..."
            className="w-full px-6 py-4 bg-[var(--color-glass-4)] backdrop-blur-xl
                       border border-white/20 rounded-t-2xl
                       text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]
                       focus:outline-none focus:border-[var(--color-signal-primary)]
                       text-lg font-medium"
          />

          <Command.List className="max-h-[400px] overflow-y-auto bg-[var(--color-government-night-elevated)]
                                    backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl
                                    shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <Command.Empty className="px-6 py-8 text-center text-[var(--color-text-tertiary)]">
              No results found.
            </Command.Empty>

            {/* Recent Commands */}
            {filteredRecentCommands.length > 0 && (
              <Command.Group
                heading="Recent"
                className="px-4 py-2 text-xs font-bold text-[var(--color-signal-primary)] uppercase tracking-wider"
              >
                {filteredRecentCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.description} ${cmd.keywords?.join(' ')}`}
                      onSelect={() => executeCommand(cmd.id, cmd.action)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer
                                 hover:bg-[var(--color-glass-2)] rounded-lg
                                 transition-colors duration-[var(--duration-fast)]
                                 data-[selected=true]:bg-[var(--color-glass-3)]"
                    >
                      <Icon className="w-5 h-5 text-[var(--color-signal-primary)]" />
                      <div className="flex-1">
                        <div className="text-[var(--color-text-primary)] font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-sm text-[var(--color-text-tertiary)]">{cmd.description}</div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {/* Navigation Commands */}
            <Command.Group
              heading="Navigation"
              className="px-4 py-2 text-xs font-bold text-[var(--color-signal-primary)] uppercase tracking-wider"
            >
              {commands
                .filter((cmd) => cmd.category === 'navigation')
                .map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.description} ${cmd.keywords?.join(' ')}`}
                      onSelect={() => executeCommand(cmd.id, cmd.action)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer
                                 hover:bg-[var(--color-glass-2)] rounded-lg
                                 transition-colors duration-[var(--duration-fast)]
                                 data-[selected=true]:bg-[var(--color-glass-3)]"
                    >
                      <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      <div className="flex-1">
                        <div className="text-[var(--color-text-primary)] font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-sm text-[var(--color-text-tertiary)]">{cmd.description}</div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
            </Command.Group>

            {/* Action Commands */}
            <Command.Group
              heading="Actions"
              className="px-4 py-2 text-xs font-bold text-[var(--color-signal-primary)] uppercase tracking-wider"
            >
              {commands
                .filter((cmd) => cmd.category === 'action')
                .map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.description} ${cmd.keywords?.join(' ')}`}
                      onSelect={() => executeCommand(cmd.id, cmd.action)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer
                                 hover:bg-[var(--color-glass-2)] rounded-lg
                                 transition-colors duration-[var(--duration-fast)]
                                 data-[selected=true]:bg-[var(--color-glass-3)]"
                    >
                      <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      <div className="flex-1">
                        <div className="text-[var(--color-text-primary)] font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-sm text-[var(--color-text-tertiary)]">{cmd.description}</div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
            </Command.Group>

            {/* Data Commands */}
            <Command.Group
              heading="Data"
              className="px-4 py-2 text-xs font-bold text-[var(--color-signal-primary)] uppercase tracking-wider"
            >
              {commands
                .filter((cmd) => cmd.category === 'data')
                .map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.description} ${cmd.keywords?.join(' ')}`}
                      onSelect={() => executeCommand(cmd.id, cmd.action)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer
                                 hover:bg-[var(--color-glass-2)] rounded-lg
                                 transition-colors duration-[var(--duration-fast)]
                                 data-[selected=true]:bg-[var(--color-glass-3)]"
                    >
                      <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      <div className="flex-1">
                        <div className="text-[var(--color-text-primary)] font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-sm text-[var(--color-text-tertiary)]">{cmd.description}</div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}
