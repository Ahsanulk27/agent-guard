import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              font-mono text-xs px-4 py-3 rounded-sm border bg-card
              ${toast.type === 'error' ? 'border-destructive text-destructive' : ''}
              ${toast.type === 'success' ? 'border-status-healthy text-status-healthy' : ''}
              ${toast.type === 'info' ? 'border-border text-foreground' : ''}
            `}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
