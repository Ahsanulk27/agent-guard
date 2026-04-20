import { registerHandler, loginHandler } from "../controllers/authController.js";
import type { FastifyInstance } from "fastify";

export default async function authRoutes(app: FastifyInstance) {
    app.post("/register", registerHandler);
    app.post("/login", loginHandler);
}