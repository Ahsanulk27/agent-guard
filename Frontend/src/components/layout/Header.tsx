import { useStore } from '@/store/useStore';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-lg font-semibold text-foreground">
      {prefix}{display.toFixed(2)}
    </motion.span>
  );
}

export function Header() {
  const { agents, setOnboardingOpen } = useStore();

  const totalSpend = agents.reduce((sum, a) => sum + a.spentBudget, 0);
  const activeCount = agents.filter((a) => a.status === 'active').length;

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-8">
        {/* System Status */}
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">System Status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-healthy animate-pulse-dot" />
            <span className="font-mono text-xs text-status-healthy font-medium">HEALTHY</span>
          </div>
        </div>

        {/* Total Spend */}
        <div className="hidden sm:flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Total Managed Spend</span>
          <AnimatedNumber value={totalSpend} prefix="$" />
        </div>

        {/* Active Agents */}
        <div className="hidden sm:flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Active Agents</span>
          <span className="font-mono text-lg font-semibold text-foreground">{activeCount}</span>
        </div>
      </div>

      <button
        onClick={() => setOnboardingOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary font-mono text-xs rounded-sm hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Agent</span>
      </button>
    </header>
  );
}
