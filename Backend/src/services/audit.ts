import { redisClient } from "../app.js";
import type { AuditEntry } from "../types/AuditEntry.js";

export async function logTransaction(entry: Omit<AuditEntry, "timestamp">) {
  const fullEntry: AuditEntry = {
    id:
      entry.id ??
      `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
    message: entry.message ?? `${entry.type} · ${entry.url}`,
    timestamp: new Date().toISOString(),
  };

  await redisClient.lPush("agent_audit_log", JSON.stringify(fullEntry));
  await redisClient.lTrim("agent_audit_log", 0, 99);
}
