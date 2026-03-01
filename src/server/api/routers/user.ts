import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc"
import * as bcrypt from "bcrypt"

export const userRouter = createTRPCRouter({
  // ─── Register ─────────────────────────────────────────────────────────────
  createUser: publicProcedure.input(
    z.object({
      name: z.string().min(1, "Name is required").max(100),
      email: z.string().email("Invalid email"),
      role: z.enum(["VOLUNTEER", "ORGANIZATION"]).default("VOLUNTEER"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email } })
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" })
      const hash = await bcrypt.hash(input.password, 10)
      const newUser = await ctx.db.user.create({
        data: { name: input.name, email: input.email, role: input.role, password: hash },
        select: { id: true, name: true, email: true, role: true }
      })
      return { success: true, user: newUser }
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" })
    }
  }),

  // ─── Get own profile ──────────────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { id: true, name: true, email: true, role: true, bio: true, phone: true, skills: true, createdAt: true }
      })
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
      return user
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch profile" })
    }
  }),

  // ─── Update profile ───────────────────────────────────────────────────────
  updateProfile: protectedProcedure.input(
    z.object({
      name: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      phone: z.string().max(30).optional(),
      skills: z.array(z.string()).optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const updated = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.skills !== undefined && { skills: input.skills }),
        },
        select: { id: true, name: true, email: true, role: true, bio: true, phone: true, skills: true }
      })
      return { success: true, user: updated }
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update profile" })
    }
  }),
})