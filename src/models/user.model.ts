/**
 * MODEL LAYER — User Model
 *
 * Pure database query functions for the User entity.
 * Controllers call these functions; no tRPC or HTTP logic lives here.
 */

import { type PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

export type Db = PrismaClient;

export type CreateUserInput = {
  name: string;
  email: string;
  role: "VOLUNTEER" | "ORGANIZATION";
  password: string;
};

export type UpdateProfileInput = {
  id: string;
  name?: string;
  bio?: string;
  phone?: string;
  skills?: string[];
};

// ─── User queries ─────────────────────────────────────────────────────────────

/** Find a user by email (used for login checks). */
export async function findUserByEmail(db: Db, email: string) {
  return db.user.findUnique({ where: { email } });
}

/** Find a user by id (lightweight lookup for role checks). */
export async function findUserById(db: Db, id: string) {
  return db.user.findUnique({ where: { id } });
}

/** Register a new user with a hashed password. */
export async function createUser(db: Db, input: CreateUserInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return null; // caller handles the conflict error

  const hash = await bcrypt.hash(input.password, 10);
  return db.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      password: hash,
    },
    select: { id: true, name: true, email: true, role: true },
  });
}

/** Fetch the authenticated user's full profile. */
export async function getUserProfile(db: Db, id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      phone: true,
      skills: true,
      createdAt: true,
    },
  });
}

/** Update editable profile fields. */
export async function updateUserProfile(db: Db, input: UpdateProfileInput) {
  return db.user.update({
    where: { id: input.id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.skills !== undefined && { skills: input.skills }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      phone: true,
      skills: true,
    },
  });
}
