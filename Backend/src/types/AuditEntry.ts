export interface AuditEntry {

    type: string;
    url: string;
    amount?: number;
    agent_id?: string;
    success: boolean;
    timestamp: string;
}