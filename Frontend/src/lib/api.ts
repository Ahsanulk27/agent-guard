import { mockAuditLog, generateAuditEntries } from "@/data/mockData";
import axios from "axios";
import type { Agent } from "@/store/useStore";
import type { BackendAgent } from "../types/Agent";
import type { BackendAuditEntry } from "../types/AuditEntry";
import { mapBackendAgent, mapBackendAuditEntry } from "./utils";

const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 5000,
});

let auditCounter = mockAuditLog.length;

export const api = {
  getStats: async () => {
    const response = await client.get<BackendAgent[]>("/admin/stats");
    const agents = response.data.map<Agent>((agent) => {
      return mapBackendAgent(agent);
    });
    return { agents, status: "healthy" };
  },

  getAudit: async () => {
    try {
      const response = await client.get<
        Array<
          BackendAuditEntry & {
            agentId?: string;
            eventType?: "INFO" | "PAYMENT" | "BLOCK";
          }
        >
      >("/admin/audit");

      const entries = response.data
        .map((entry) => {
          if (entry.eventType && entry.agentId) {
            return {
              id:
                entry.id ??
                `audit_${new Date(entry.timestamp || Date.now()).getTime()}_${Math.random().toString(36).slice(2, 6)}`,
              timestamp: entry.timestamp,
              agentId: entry.agentId,
              eventType: entry.eventType,
              message: entry.message ?? `${entry.type} · ${entry.url}`,
              amount: entry.amount ?? 0,
            };
          }

          return mapBackendAuditEntry(entry);
        })
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

      return { entries, total: entries.length };
    } catch {
      await delay(200);
      const newEntries = generateAuditEntries(
        Math.random() < 0.4 ? 1 : 0,
        auditCounter,
      );
      auditCounter += newEntries.length;
      return { entries: newEntries, total: auditCounter };
    }
  },

  registerAgent: async (data: {
    name: string;
    agentId: string;
    budget: number;
    maxPerRequest: number;
    loopDetectionWindow: number;
    maxIdenticalRequests: number;
  }): Promise<Agent> => {
    const body = {
      id: data.agentId,
      name: data.name,
      initialBudget: data.budget,
      maxPerRequest: data.maxPerRequest,
      loopDetectionWindow: data.loopDetectionWindow,
      maxIdenticalRequests: data.maxIdenticalRequests,
    };
    const response = await client.post("/admin/register", body);

    const backend = response.data as BackendAgent;
    const agent = mapBackendAgent(backend);
    return agent;
  },

  topUpBudget: async (agentId: string, amount: number) => {
    const response = await client.post<{
      message: string;
      agent: BackendAgent;
    }>("/admin/top-up", {
      agent_id: agentId,
      amount: amount,
    });
    return mapBackendAgent(response.data.agent);
  },

  toggleFreeze: async (agentId: string, status: "active" | "frozen") => {
    const response = await client.patch<BackendAgent>(
      `/admin/agent/${agentId}/toggle-freeze`,
      {
        status,
      },
    );
    return mapBackendAgent(response.data);
  },

  regenerateKey: async (agentId: string) => {
    const response = await client.post<BackendAgent>(
      `/admin/agent/${agentId}/regenerate-key`,
      {},
    );
    return mapBackendAgent(response.data);
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
