import { create } from 'zustand';

export type ViewType = 'overview' | 'agents' | 'audit' | 'settings';
export type AgentStatus = 'active' | 'frozen' | 'insufficient_funds';

export interface Agent {
  id: string;
  name: string;
  agentId: string;
  status: AgentStatus;
  budget: number;
  spentBudget: number;
  maxPerRequest: number;
  apiKey: string;
  loopDetectionWindow: number;
  maxIdenticalRequests: number;
  createdAt: string;
  spendHistory: { timestamp: string; amount: number }[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  agentId: string;
  eventType: 'INFO' | 'PAYMENT' | 'BLOCK';
  message: string;
  amount: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppState {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;

  isOnboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;

  isDetailDrawerOpen: boolean;
  setDetailDrawerOpen: (open: boolean) => void;

  isTopUpDrawerOpen: boolean;
  topUpAgentId: string | null;
  openTopUp: (agentId: string) => void;
  closeTopUp: () => void;

  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addAgent: (agent: Agent) => void;

  auditLog: AuditEntry[];
  setAuditLog: (entries: AuditEntry[]) => void;
  addAuditEntries: (entries: AuditEntry[]) => void;

  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;

  isShortcutHelpOpen: boolean;
  setShortcutHelpOpen: (open: boolean) => void;
}

let toastCounter = 0;

export const useStore = create<AppState>((set) => ({
  activeView: 'overview',
  setActiveView: (view) => set({ activeView: view }),

  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  isOnboardingOpen: false,
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),

  isDetailDrawerOpen: false,
  setDetailDrawerOpen: (open) => set({ isDetailDrawerOpen: open }),

  isTopUpDrawerOpen: false,
  topUpAgentId: null,
  openTopUp: (agentId) => set({ isTopUpDrawerOpen: true, topUpAgentId: agentId }),
  closeTopUp: () => set({ isTopUpDrawerOpen: false, topUpAgentId: null }),

  agents: [],
  setAgents: (agents) => set({ agents }),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      selectedAgent: state.selectedAgent?.id === id ? { ...state.selectedAgent, ...updates } : state.selectedAgent,
    })),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),

  auditLog: [],
  setAuditLog: (entries) => set({ auditLog: entries }),
  addAuditEntries: (entries) =>
    set((state) => ({ auditLog: [...state.auditLog, ...entries] })),

  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  isShortcutHelpOpen: false,
  setShortcutHelpOpen: (open) => set({ isShortcutHelpOpen: open }),
}));
