import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

interface ApiKeyFieldProps {
  apiKey: string;
  onRegenerate?: () => void;
}

export function ApiKeyField({ apiKey, onRegenerate }: ApiKeyFieldProps) {
  const { addToast } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [regenerateState, setRegenerateState] = useState<'idle' | 'confirm'>('idle');

  const masked = `sk-ag-${'•'.repeat(24)}`;

  // Auto-hide after 10s
  useEffect(() => {
    if (!revealed) return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRevealed(false);
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [revealed]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKey]);

  const handleRegenerate = () => {
    if (regenerateState === 'idle') {
      setRegenerateState('confirm');
      setTimeout(() => setRegenerateState('idle'), 3000);
    } else {
      onRegenerate?.();
      setRegenerateState('idle');
      addToast('success', 'API key regenerated');
    }
  };

  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">API Credentials</div>

      <div className="relative">
        <div className="font-mono text-xs px-3 py-2.5 rounded-sm border border-border text-foreground"
          style={{ backgroundColor: 'hsl(0 0% 3%)' }}>
          {revealed ? apiKey : masked}
        </div>
        {revealed && countdown > 0 && (
          <div className="mt-1 h-0.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 10) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {revealed ? 'Hide' : 'Reveal'}
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="w-3 h-3" />
          {copied ? '✓ Copied' : 'Copy'}
        </button>

        {onRegenerate && (
          <button
            onClick={handleRegenerate}
            className={`flex items-center gap-1 font-mono text-[10px] px-2 py-1 border rounded-sm transition-colors ${
              regenerateState === 'confirm'
                ? 'border-status-warning text-status-warning'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            {regenerateState === 'confirm' ? 'Confirm Regenerate ↵' : 'Regenerate'}
          </button>
        )}
      </div>
    </div>
  );
}
