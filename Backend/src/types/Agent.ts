export interface Agent {
  id: string;          
  name: string;        // Human-friendly name
  status: 'active' | 'frozen' | 'retired';
  totalBudget: number; // The current balance
  maxPerRequest: number; // Safety cap (e.g., $0.50)
  createdAt: string;
}