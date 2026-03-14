import { useStore, type ViewType } from '@/store/useStore';
import { LayoutDashboard, Bot, Terminal, Settings } from 'lucide-react';

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'overview', label: 'Overview', icon: LayoutDashboard },
  { view: 'agents', label: 'Agents', icon: Bot },
  { view: 'audit', label: 'Audit Log', icon: Terminal },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { activeView, setActiveView } = useStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen border-r border-border bg-sidebar shrink-0">
        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono font-bold text-sm">■</span>
            <span className="font-mono font-semibold text-sm text-foreground tracking-tight">AgentGuard</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium transition-colors
                  ${isActive
                    ? 'bg-sidebar-accent text-foreground'
                    : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Redis status */}
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-healthy animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Redis Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar flex">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`
                flex-1 flex flex-col items-center gap-1 py-3 text-[10px]
                ${isActive ? 'text-primary' : 'text-muted-foreground'}
              `}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
