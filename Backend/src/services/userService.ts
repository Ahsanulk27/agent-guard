import { redisClient } from "./redis.js";
import type { User } from "../types/User.js";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid";

export const userService = {
    async createUser(email: string, password: string): Promise<User> {
        const userId = `user_${uuidv4()}`;
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser: User = {
            id: userId,
            email,
            passwordHash,
            createdAt: new Date().toISOString(),
        }
        await redisClient.hSet(`user:${userId}`, {
            id: newUser.id,
            email: newUser.email,
            passwordHash: newUser.passwordHash,
            createdAt: newUser.createdAt,
        })
        await redisClient.hSet("user:email_to_id", email, userId);

        return newUser;

    },

    async findByEmail(email: string): Promise<User | null> {
        const userId = await redisClient.hGet("user:email_to_id", email);
        if (!userId){
            return null;
        }
        const userData = await redisClient.hGetAll(`user:${userId}`);
        return userData as unknown as User;
    },

    async linkAgentToUser(userId: string, agentId: string) {
        await redisClient.sAdd(`user:${userId}:agents`, agentId);
    }

}