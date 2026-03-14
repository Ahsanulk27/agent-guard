export type BackendAuditEventType =
  | "BLOCKED"
  | "PAYMENT"
  | "TOP_UP"
  | "SYSTEM_REGISTRATION";

export interface BackendAuditEntry {
  id?: string;
  timestamp: string;
  type: BackendAuditEventType;
  agent_id?: string;
  message?: string;
  url: string;
  amount?: number;
  success: boolean;
}
