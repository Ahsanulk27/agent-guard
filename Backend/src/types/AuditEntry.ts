export type AuditEventType =
  | "INFO"
  | "BLOCKED"
  | "PAYMENT"
  | "TOP_UP"
  | "SYSTEM_REGISTRATION";

export interface AuditEntry {
  id?: string;
  type: AuditEventType;
  url: string;
  amount?: number;
  agent_id?: string;
  success: boolean;
  message?: string;
  timestamp: string;
}
