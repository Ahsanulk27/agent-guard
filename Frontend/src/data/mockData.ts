import type { Agent, AuditEntry } from '@/store/useStore';

const generateSpendHistory = (days: number, maxSpend: number) => {
  const history: { timestamp: string; amount: number }[] = [];
  let cumulative = 0;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    cumulative += Math.random() * (maxSpend / days) * 1.5;
    cumulative = Math.min(cumulative, maxSpend);
    history.push({ timestamp: date.toISOString(), amount: parseFloat(cumulative.toFixed(2)) });
  }
  return history;
};

export const mockAgents: Agent[] = [
  {
    id: 'agt_001',
    name: 'Research Bot',
    agentId: 'research_bot',
    status: 'active',
    budget: 50.0,
    spentBudget: 24.83,
    maxPerRequest: 0.5,
    apiKey: 'sk-ag-7f3k9x2m4p8q1w5y6h0j3n8b2v4c9t1r',
    loopDetectionWindow: 60,
    maxIdenticalRequests: 3,
    createdAt: '2024-01-15T09:30:00Z',
    spendHistory: generateSpendHistory(14, 24.83),
  },
  {
    id: 'agt_002',
    name: 'Code Review Agent',
    agentId: 'code_review_agent',
    status: 'active',
    budget: 100.0,
    spentBudget: 87.45,
    maxPerRequest: 1.0,
    apiKey: 'sk-ag-9d2f5h8k1n4q7t0w3z6c9e2g5j8m1p4s',
    loopDetectionWindow: 30,
    maxIdenticalRequests: 5,
    createdAt: '2024-02-01T14:00:00Z',
    spendHistory: generateSpendHistory(14, 87.45),
  },
  {
    id: 'agt_003',
    name: 'Data Pipeline',
    agentId: 'data_pipeline',
    status: 'frozen',
    budget: 25.0,
    spentBudget: 25.0,
    maxPerRequest: 0.25,
    apiKey: 'sk-ag-3b6e9h2k5n8q1t4w7z0c3f6i9l2o5r8u',
    loopDetectionWindow: 60,
    maxIdenticalRequests: 3,
    createdAt: '2024-01-20T11:15:00Z',
    spendHistory: generateSpendHistory(14, 25.0),
  },
  {
    id: 'agt_004',
    name: 'Customer Support',
    agentId: 'customer_support',
    status: 'active',
    budget: 200.0,
    spentBudget: 42.17,
    maxPerRequest: 0.75,
    apiKey: 'sk-ag-1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t',
    loopDetectionWindow: 120,
    maxIdenticalRequests: 10,
    createdAt: '2024-02-10T08:45:00Z',
    spendHistory: generateSpendHistory(14, 42.17),
  },
  {
    id: 'agt_005',
    name: 'Content Writer',
    agentId: 'content_writer',
    status: 'insufficient_funds',
    budget: 10.0,
    spentBudget: 9.87,
    maxPerRequest: 0.3,
    apiKey: 'sk-ag-5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v',
    loopDetectionWindow: 60,
    maxIdenticalRequests: 3,
    createdAt: '2024-01-28T16:30:00Z',
    spendHistory: generateSpendHistory(14, 9.87),
  },
  {
    id: 'agt_006',
    name: 'Security Scanner',
    agentId: 'security_scanner',
    status: 'active',
    budget: 75.0,
    spentBudget: 12.5,
    maxPerRequest: 2.0,
    apiKey: 'sk-ag-8e1h4k7n0q3t6w9z2b5e8h1k4n7q0t3w',
    loopDetectionWindow: 45,
    maxIdenticalRequests: 2,
    createdAt: '2024-02-15T10:00:00Z',
    spendHistory: generateSpendHistory(14, 12.5),
  },
];

const eventTypes: AuditEntry['eventType'][] = ['INFO', 'PAYMENT', 'BLOCK'];
const messages: Record<AuditEntry['eventType'], string[]> = {
  INFO: [
    'Agent initialized session',
    'Request routed to gpt-4o',
    'Rate limit check passed',
    'Session token refreshed',
    'Health check completed',
    'Configuration reloaded',
  ],
  PAYMENT: [
    'Token consumption recorded',
    'Budget debit processed',
    'Completion tokens billed',
    'Prompt tokens charged',
    'Embedding request billed',
  ],
  BLOCK: [
    'AgentGuard_Blocked: Budget exceeded',
    'AgentGuard_Blocked: Rate limit hit',
    'AgentGuard_Blocked: Loop detected',
    'AgentGuard_Blocked: Max per-request exceeded',
    'AgentGuard_Blocked: Suspicious pattern',
  ],
};

export const generateAuditEntries = (count: number, startId: number = 0): AuditEntry[] => {
  const agents = mockAgents.map((a) => a.agentId);
  const entries: AuditEntry[] = [];
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.random() < 0.1 ? 2 : Math.random() < 0.4 ? 1 : 0];
    const agentId = agents[Math.floor(Math.random() * agents.length)];
    const msgs = messages[eventType];
    const timestamp = new Date(Date.now() - (count - i) * 3000);
    entries.push({
      id: `audit_${startId + i}`,
      timestamp: timestamp.toISOString(),
      agentId,
      eventType,
      message: msgs[Math.floor(Math.random() * msgs.length)],
      amount: eventType === 'PAYMENT' ? parseFloat((Math.random() * 0.5).toFixed(4)) : 0,
    });
  }
  return entries;
};

export const mockAuditLog: AuditEntry[] = generateAuditEntries(50);
