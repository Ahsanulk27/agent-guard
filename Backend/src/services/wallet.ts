import type { Agent } from "../types/Agent.js";
import { redisClient } from "../app.js";
import type { Invoice } from "../types/Invoice.js";

export async function processPayment(
  agent_id: string,
  invoice: Invoice,
){
  const key = `agent:${agent_id}`;
  const rawData = await redisClient.get(key);
  if (!rawData){
    return false;
  }

  const agent: Agent = JSON.parse(rawData);
  if (agent.status !== "active"){
    return false

  }
  if (invoice.amount_due > agent.maxPerRequest){
    console.log(`[WALLET] Payment of ${invoice.amount_due} ${invoice.currency} for invoice ${invoice.id} exceeds the agent's max per request limit.`);
    return false;
  }

  if (agent.totalBudget < invoice.amount_due) {
    return false;
  }

  agent.totalBudget -= invoice.amount_due;
  await redisClient.set(key, JSON.stringify(agent));
  return true;
}
