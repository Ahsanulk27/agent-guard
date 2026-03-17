import type { FastifyRequest, FastifyReply } from "fastify";
import { processPayment } from "../services/wallet.js";
import { logTransaction } from "../services/audit.js";
export default async function proxyHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const MOCK_UPSTREAM = "http://localhost:4000";
  const targetUrl = `${MOCK_UPSTREAM}${request.url}`;

  const performRequest = async (useToken = false) => {
    const headers: any = {
      "Content-Type": "application/json",
    };

    if (useToken) {
      headers["x-agentguard-pay-token"] = "paid";
    }

    return await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: ["POST", "PUT", "PATCH"].includes(request.method)
        ? JSON.stringify(request.body)
        : null,
    });
  };

  let response = await performRequest();
  let data = await response.json();
  const agent = (request as any).agent;
  if (response.status === 402) {
    const invoice = data.invoice;
    const payment = await processPayment(agent.id, invoice);
    if (!payment.success) {
      const isLimitExceeded = payment.reason === "AMOUNT_EXCEEDS_LIMIT";
      const errorCode = isLimitExceeded
        ? "AgentGuard_Limit_Exceeded"
        : "AgentGuard_Insufficient_Budget";
      const errorMessage = isLimitExceeded
        ? `Request of ${invoice.amount_due} exceeds your safety cap.`
        : `Agent ${agent.id} has insufficient funds.`;

      await logTransaction({
        type: "BLOCKED",
        url: request.url,
        agent_id: agent.id,
        amount: invoice.amount_due,
        success: false,
        message: errorMessage,
      });
      return reply.code(403).send({
        error: errorCode,
        message: errorMessage,
        invoice: invoice,
      });
    }
    await logTransaction({
      type: "PAYMENT",
      url: request.url,
      agent_id: agent.id,
      amount: invoice.amount_due,
      success: true,
      message: `Auto-negotiated x402 payment for ${invoice.amount_due} ${invoice.currency}`,
    });

    response = await performRequest(true);
    data = await response.json();
  }

  return reply.code(response.status).send(data);
}
