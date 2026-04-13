/**
 * MODEL LAYER — Database Client
 *
 * This is the singleton Prisma client that connects to the database.
 * It is the foundation of the Model layer in the MVC architecture.
 * All data access goes through this client, either directly in model
 * functions or via the tRPC context.
 */

import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
