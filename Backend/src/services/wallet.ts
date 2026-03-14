import type { Agent } from "../types/Agent.js";
import { redisClient } from "../app.js";
import type { Invoice } from "../types/Invoice.js";

export async function processPayment(agent_id: string, invoice: Invoice) {
  const key = `agent:${agent_id}`;
  const rawData = await redisClient.get(key);
  if (!rawData) {
    return { success: false, reason: "AGENT_NOT_FOUND" };
  }

  const agent: Agent = JSON.parse(rawData);
  if (agent.status !== "active") {
    return { success: false, reason: "AGENT_FROZEN" };
  }
  if (invoice.amount_due > agent.maxPerRequest) {
    console.log(
      `[WALLET] Payment of ${invoice.amount_due} ${invoice.currency} for invoice ${invoice.id} exceeds the agent's max per request limit.`,
    );
    return { success: false, reason: "AMOUNT_EXCEEDS_LIMIT" };
  }

  if (agent.totalBudget < invoice.amount_due) {
    return { success: false, reason: "INSUFFICIENT FUNDS" };
  }

  const newBudget = Number(agent.totalBudget) - Number(invoice.amount_due);
  agent.totalBudget = Number(newBudget.toFixed(2));
  agent.spentBudget = Number(
    (Number(agent.spentBudget ?? 0) + invoice.amount_due).toFixed(2),
  );
  await redisClient.set(key, JSON.stringify(agent));
  return { success: true };
}


// start working on the top up, freeze and rotate key 
// endpoints (return Agent body as response 
// and chekc if you wanna add Audit logsfor these endpoint 
// actions)