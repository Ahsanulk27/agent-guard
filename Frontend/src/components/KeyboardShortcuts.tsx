import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const shortcuts = [
  { key: 'N', action: 'New Agent' },
  { key: 'T', action: 'Audit Terminal' },
  { key: 'Esc', action: 'Close modal/drawer' },
  { key: '?', action: 'Toggle shortcuts' },
];

export function KeyboardShortcuts() {
  const { setOnboardingOpen, setActiveView, setDetailDrawerOpen, setSelectedAgent, closeTopUp, isOnboardingOpen, isDetailDrawerOpen, isTopUpDrawerOpen, isShortcutHelpOpen, setShortcutHelpOpen } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setOnboardingOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setActiveView('audit');
      } else if (e.key === 'Escape') {
        if (isOnboardingOpen) setOnboardingOpen(false);
        else if (isDetailDrawerOpen) { setDetailDrawerOpen(false); setSelectedAgent(null); }
        else if (isTopUpDrawerOpen) closeTopUp();
        else if (isShortcutHelpOpen) setShortcutHelpOpen(false);
      } else if (e.key === '?') {
        setShortcutHelpOpen(!isShortcutHelpOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOnboardingOpen, isDetailDrawerOpen, isTopUpDrawerOpen, isShortcutHelpOpen]);

  return (
    <>
      {/* ? button */}
      <button
        onClick={() => setShortcutHelpOpen(!isShortcutHelpOpen)}
        className="fixed bottom-5 right-5 md:bottom-5 md:right-5 z-30 w-7 h-7 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground font-mono text-xs hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        ?
      </button>

      <AnimatePresence>
        {isShortcutHelpOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-14 right-5 z-30 bg-card border border-border rounded-sm p-3 min-w-[180px]"
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Keyboard Shortcuts</div>
            <div className="space-y-1">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex justify-between gap-4 font-mono text-[11px]">
                  <span className="text-muted-foreground">{s.action}</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded-sm text-foreground text-[10px]">{s.key}</kbd>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
