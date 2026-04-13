/**
 * CONTROLLER LAYER — User Controller
 *
 * Handles request validation and authorisation for all user-related
 * operations, then delegates data access to the User Model.
 *
 * Procedures:
 *  - createUser      (public — registration)
 *  - getProfile      (protected — own profile)
 *  - updateProfile   (protected — edit own profile)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/controllers/trpc";
import * as UserModel from "~/models/user.model";

export const userController = createTRPCRouter({
  // ─── Register ─────────────────────────────────────────────────────────────
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        email: z.string().email("Invalid email"),
        role: z.enum(["VOLUNTEER", "ORGANIZATION"]).default("VOLUNTEER"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const newUser = await UserModel.createUser(ctx.db, input);
        if (!newUser)
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        return { success: true, user: newUser };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }
    }),

  // ─── Get own profile ──────────────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await UserModel.getUserProfile(ctx.db, ctx.session.user.id);
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return user;
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch profile",
      });
    }
  }),

  // ─── Update profile ───────────────────────────────────────────────────────
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().max(30).optional(),
        skills: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await UserModel.updateUserProfile(ctx.db, {
          id: ctx.session.user.id,
          ...input,
        });
        return { success: true, user: updated };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),
});
