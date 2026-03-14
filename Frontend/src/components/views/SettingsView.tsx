import { useState } from 'react';
import { useStore } from '@/store/useStore';

export function SettingsView() {
  const { addToast, setAuditLog } = useStore();
  const [backendUrl, setBackendUrl] = useState('http://localhost:3000');

  const handleSave = () => {
    addToast('success', 'Backend URL updated');
  };

  const handleFlush = () => {
    setAuditLog([]);
    addToast('success', 'Audit log flushed');
  };

  return (
    <div className="p-5 max-w-lg space-y-8">
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-4">Configuration</h2>

        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-xs text-muted-foreground">Backend URL</span>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="flex-1 font-mono text-xs bg-card border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
              />
              <button
                onClick={handleSave}
                className="font-mono text-xs px-3 py-2 border border-primary text-primary rounded-sm hover:bg-primary/10 transition-colors"
              >
                Save
              </button>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-4">Appearance</h2>
        <div className="flex items-center justify-between p-3 border border-border rounded-sm bg-card">
          <span className="font-mono text-xs text-muted-foreground">Theme</span>
          <span className="font-mono text-[10px] text-muted-foreground/50 px-2 py-0.5 border border-border rounded-sm">
            DARK — LOCKED
          </span>
        </div>
      </div>

      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-destructive mb-4">Danger Zone</h2>
        <button
          onClick={handleFlush}
          className="font-mono text-xs px-3 py-2 border border-destructive text-destructive rounded-sm hover:bg-destructive/10 transition-colors"
        >
          Flush Audit Log
        </button>
      </div>
    </div>
  );
}
