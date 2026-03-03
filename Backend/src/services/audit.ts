import { redisClient } from "../app.js";
import type { AuditEntry } from "../types/AuditEntry.js";

export async function logTransaction(entry: Omit<AuditEntry, "timestamp">) {
    const fullEntry: AuditEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
    }

    await redisClient.lPush("agent_audit_log", JSON.stringify(fullEntry));
    await redisClient.lTrim("agent_audit_log", 0, 99);
} 