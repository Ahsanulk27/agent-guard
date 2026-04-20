import type { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.code(401).send({error: "Unauthorized: Invalid or missing token"})
    }
}

/// test the /auth/register and /auth/login endpoints