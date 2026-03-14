import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BackendAgent } from "../types/Agent";
import type { BackendAuditEntry } from "../types/AuditEntry";
import type { Agent, AuditEntry } from "@/store/useStore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapBackendAgent(agent: BackendAgent): Agent {
  return {
    id: agent.id,
    name: agent.name,
    agentId: agent.id,
    status: agent.status === "retired" ? "frozen" : agent.status,
    budget: agent.totalBudget,
    spentBudget: agent.spentBudget ?? 0,
    maxPerRequest: agent.maxPerRequest,
    apiKey: agent.apiKey ?? "",
    loopDetectionWindow: agent.loopDetectionWindow ?? 60,
    maxIdenticalRequests: agent.maxIdenticalRequests ?? 3,
    createdAt: agent.createdAt,
    spendHistory: [],
  };
}

export function mapBackendAuditEntry(entry: BackendAuditEntry): AuditEntry {
  const eventType: AuditEntry["eventType"] =
    entry.type === "BLOCKED"
      ? "BLOCK"
      : entry.type === "PAYMENT"
        ? "PAYMENT"
        : "INFO";

  return {
    id:
      entry.id ??
      `audit_${new Date(entry.timestamp || Date.now()).getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: entry.timestamp,
    agentId: entry.agent_id ?? "system",
    eventType,
    message: entry.message ?? `${entry.type} · ${entry.url}`,
    amount: entry.amount ?? 0,
  };
}
