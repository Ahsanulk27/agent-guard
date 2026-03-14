import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';

type Step = 0 | 1 | 2 | 3;
const stepLabels = ['Identity', 'Budget', 'Security', 'Credentials'];

export function OnboardingModal() {
  const { isOnboardingOpen, setOnboardingOpen, addAgent, addToast } = useStore();
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [budget, setBudget] = useState('');
  const [maxPerRequest, setMaxPerRequest] = useState('');
  const [loopWindow, setLoopWindow] = useState('60');
  const [maxIdentical, setMaxIdentical] = useState('3');
  const [generatedKey, setGeneratedKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const autoId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) e.name = 'Agent name is required';
      if (!(agentId || autoId).trim()) e.agentId = 'Agent ID is required';
    } else if (step === 1) {
      if (!budget || parseFloat(budget) <= 0) e.budget = 'Enter a valid budget amount';
    } else if (step === 2) {
      if (!maxPerRequest || parseFloat(maxPerRequest) <= 0) e.maxPerRequest = 'Enter a valid cap';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step === 2) {
      // Register agent
      setLoading(true);
      try {
        const agent = await api.registerAgent({
          name,
          agentId: agentId || autoId,
          budget: parseFloat(budget),
          maxPerRequest: parseFloat(maxPerRequest),
          loopDetectionWindow: parseInt(loopWindow),
          maxIdenticalRequests: parseInt(maxIdentical),
        });
        setGeneratedKey(agent.apiKey);
        addAgent(agent);
        setStep(3);
      } catch {
        addToast('error', 'Failed to register agent');
      } finally {
        setLoading(false);
      }
    } else {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleClose = () => {
    setOnboardingOpen(false);
    setStep(0);
    setName('');
    setAgentId('');
    setBudget('');
    setMaxPerRequest('');
    setLoopWindow('60');
    setMaxIdentical('3');
    setGeneratedKey('');
    setErrors({});
  };

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedKey]);

  return (
    <AnimatePresence>
      {isOnboardingOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[520px] bg-card border border-border rounded-sm mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-mono text-xs font-semibold text-foreground">New Agent</span>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step rail */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold
                      ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'border-2 border-primary text-primary' : 'border border-border text-muted-foreground'}
                    `}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className={`font-mono text-[10px] hidden sm:inline ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                    {i < stepLabels.length - 1 && <div className="w-8 h-px bg-border hidden sm:block" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-5 min-h-[200px]">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Agent Identity</div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">Agent Name</label>
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (!agentId) {} }}
                      placeholder="Research Bot"
                      className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
                    />
                    {errors.name && <div className="font-mono text-[10px] text-destructive mt-1">{errors.name}</div>}
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">Agent ID</label>
                    <input
                      value={agentId || autoId}
                      onChange={(e) => setAgentId(e.target.value)}
                      className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
                    />
                    {errors.agentId && <div className="font-mono text-[10px] text-destructive mt-1">{errors.agentId}</div>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Budget Configuration</div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">Initial Budget ($)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 font-mono text-xs text-muted-foreground">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="50.00"
                        className="w-full font-mono text-xs bg-background border border-border rounded-sm pl-7 pr-3 py-2 text-foreground outline-none focus:border-primary/50"
                      />
                    </div>
                    {errors.budget && <div className="font-mono text-[10px] text-destructive mt-1">{errors.budget}</div>}
                  </div>
                  {budget && parseFloat(budget) > 0 && (
                    <div>
                      <div className="flex justify-between font-mono text-[11px] text-muted-foreground mb-1">
                        <span>$0.00 / ${parseFloat(budget).toFixed(2)}</span>
                        <span>0%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-sm overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '0%' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Security Caps</div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">Max Per Request ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxPerRequest}
                      onChange={(e) => setMaxPerRequest(e.target.value)}
                      placeholder="0.50"
                      className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
                    />
                    <div className="font-mono text-[10px] text-muted-foreground mt-1">Requests exceeding this limit will be automatically blocked.</div>
                    {errors.maxPerRequest && <div className="font-mono text-[10px] text-destructive mt-1">{errors.maxPerRequest}</div>}
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">Loop Detection Window (seconds)</label>
                    <input
                      type="number"
                      value={loopWindow}
                      onChange={(e) => setLoopWindow(e.target.value)}
                      className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">Max Identical Requests</label>
                    <input
                      type="number"
                      value={maxIdentical}
                      onChange={(e) => setMaxIdentical(e.target.value)}
                      className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Agent Credentials</div>
                  <div className="font-mono text-xs px-3 py-2.5 rounded-sm border border-border text-foreground break-all" style={{ backgroundColor: 'hsl(0 0% 3%)' }}>
                    {generatedKey}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 font-mono text-xs px-3 py-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
                  >
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Key</>}
                  </button>
                  <div className="font-mono text-[10px] text-status-warning">
                    ⚠ This key will not be shown again. Store it securely.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between px-5 py-4 border-t border-border">
              {step > 0 && step < 3 ? (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="font-mono text-xs px-3 py-1.5 border border-border text-muted-foreground rounded-sm hover:text-foreground transition-colors"
                >
                  Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="font-mono text-xs px-4 py-1.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Registering...' : step === 2 ? 'Register' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="font-mono text-xs px-4 py-1.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
