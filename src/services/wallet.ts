import { redisClient } from "../app.js";

interface Invoice {
  id: string;
  amount_due: number;
  currency: string;
  description: string;
}
const MAX_PER_TRANSACTION_AMOUNT = 0.5;

export async function processPayment(
  agent_id: string,
  invoice: Invoice,
){
  if (!agent_id) {
    console.log("[WALLET] Missing agent id");
    return false;
  }
  if (invoice.amount_due > MAX_PER_TRANSACTION_AMOUNT) {
    console.log(
      `[WALLET] Payment of ${invoice.amount_due} ${invoice.currency} for invoice ${invoice.id} exceeds the maximum allowed amount.`,
    );
    return false;
  }
  const key = `budget:${agent_id}`;
  const raw_budget = await redisClient.get(key);
  const budget: number = raw_budget ? parseFloat(raw_budget) : 0;
  if (budget < invoice.amount_due) {
    return false;
  }
  const new_budget = budget - invoice.amount_due;
  await redisClient.set(key, new_budget.toString());
  console.log(
    `[WALLET] Processing payment of ${invoice.amount_due} ${invoice.currency} for invoice ${invoice.id}`,
  );
  return true;
}
