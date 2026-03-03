import Fastify from "fastify";

const mock = Fastify();

mock.post("/v1/chat/completions", async (request, reply) => {
  console.log("Mock Provider received a request!");

  const paymentToken = request.headers["x-agentguard-pay-token"];
  if (!paymentToken) {
    return reply.code(402).send({
      error: "Payment Required",
      invoice: {
        id: "invoice_123",
        amount_due: 0.5,
        currency: "usd",
        description: "AI completion request",
        pay_to: "x402://mock-provider-wallet-address",
      },
    });
  }

  return {
    id: "chatcmpl-123",
    object: "chat/completion",
    created: Date.now(),
    model: "gpt-4",
    choices: [
      {
        message: {
          role: "assistant",
          content: "This is a mock response from the x402 API",
        },
        finish_reason: "stop",
        index: 0,
      },
    ],
  };
});

mock.listen({ port: 4000 }, () => {
  console.log("Mock x402 API active on http://localhost:4000");
});
