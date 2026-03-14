export interface Agent {
  id: string;
  name: string; // Human-friendly name
  status: "active" | "frozen" | "retired" | "insufficient_funds";
  totalBudget: number; // The current balance
  spentBudget?: number;
  maxPerRequest: number; // Safety cap (e.g., $0.50)
  apiKey?: string;
  loopDetectionWindow?: number;
  maxIdenticalRequests?: number;
  createdAt: string;
}
