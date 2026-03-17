import Fastify from "fastify";
import { connectRedis } from "./services/redis.js";
import { firewallHook } from "./middleware/firewall.js";
import fastifyCors from "@fastify/cors";
import adminRoutes from "./routes/adminRoutes.js";
import dotenv from "dotenv";
import proxyRoutes from "./routes/proxyRoutes.js";
dotenv.config();

const app = Fastify();
await connectRedis();

app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

app.addHook("preHandler", firewallHook);

app.register(adminRoutes, {prefix: "/admin"});

app.register(proxyRoutes);

app.listen({ port: 3000 }, () => {
  console.log("AgentGuard running on http://localhost:3000");
});
