import type { FastifyInstance } from "fastify";
import proxyHandler from "../controllers/proxyController.js";

export default async function proxyRoutes(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    url: "/*",
    handler: proxyHandler,
  });
}
