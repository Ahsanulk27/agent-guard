import type { FastifyInstance } from "fastify";
import { getAllAuditEntries, getStats, registerAgent, topUpAgent, toggleFreezeAgent, regenerateKey } from "../controllers/adminController.js";


export default async function adminRoutes(app: FastifyInstance){
    app.get("/audit", getAllAuditEntries);
    app.get("/stats", getStats);
    app.post("/register", registerAgent);
    app.post("/top-up", topUpAgent);
    app.patch("/agent/:id/toggle-freeze", toggleFreezeAgent);
    app.post("/agent/:id/regenerate-key", regenerateKey);
}