export interface BackendAgent {
  id: string;
  name: string;
  status: "active" | "frozen" | "retired" | "insufficient_funds";
  totalBudget: number;
  spentBudget?: number;
  maxPerRequest: number;
  apiKey?: string;
  loopDetectionWindow?: number;
  maxIdenticalRequests?: number;
  createdAt: string;

}
