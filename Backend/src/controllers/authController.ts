import type { FastifyRequest, FastifyReply } from "fastify";
import { userService } from "../services/userService.js";
import bcrypt from "bcryptjs";

export const registerHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };
  if (!email || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }

  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    return reply.code(400).send({ error: "Email already exists" });
  }

  const user = await userService.createUser(email, password);

  const token = request.server.jwt.sign({ userId: user.id, email: user.email });

  return reply.code(201).send({
    message: "User registered successfully",
    token,
  });
};

export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };
  
  const user = await userService.findByEmail(email);
  if (!user) {
    return reply.code(401).send({error:"Invalid email or password"});
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return reply.code(401).send({error:"Invalid email or password"});
  }
  const token = request.server.jwt.sign({id: user.id, email: user.email})

  return reply.send({ token }); 
};

