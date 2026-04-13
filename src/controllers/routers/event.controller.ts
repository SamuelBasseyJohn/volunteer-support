/**
 * CONTROLLER LAYER — Event Controller
 *
 * Handles all HTTP-style request logic for events and volunteer applications.
 * Each procedure validates input (Zod), enforces authorisation, then
 * delegates actual database work to the Event Model (~/models/event.model).
 *
 * Procedures:
 *  - createEvent          (admin / org)
 *  - updateEvent          (admin / org owner)
 *  - deleteEvent          (admin / org owner)
 *  - getEvent             (public)
 *  - getMyEvents          (org / admin)
 *  - getAllEvents          (public, with filters)
 *  - getAllEventsAdmin     (admin)
 *  - getAcceptedEvents    (volunteer)
 *  - getMyApplications    (volunteer)
 *  - getLatest            (public, home page)
 *  - applyToEvent         (volunteer)
 *  - cancelApplication    (volunteer)
 *  - acceptApplication    (admin / org)
 *  - rejectApplication    (admin / org)
 *  - confirmAttendance    (admin / org)
 */

import { Role, Status } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/controllers/trpc";
import * as EventModel from "~/models/event.model";

/** Helper — only admins and organisations may manage events. */
const canManage = (role: Role) =>
  role === Role.ADMIN || role === Role.ORGANIZATION;

export const eventController = createTRPCRouter({
  // ─── Create (admin / org) ─────────────────────────────────────────────────
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required").max(100),
        description: z.string().max(500).optional(),
        location: z.string().max(100).optional(),
        category: z.string().optional(),
        date: z.string().date(),
        max_participants: z.number().min(1, "Must have at least 1 volunteer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        if (!user || !canManage(user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and organisations can create events!",
          });
        }
        const event = await EventModel.createEvent(ctx.db, {
          ...input,
          userId: user.id,
        });
        return { success: true, event };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create event!",
        });
      }
    }),

  // ─── Update (admin / org owner) ──────────────────────────────────────────
  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        location: z.string().max(100).optional(),
        category: z.string().optional(),
        date: z.string().date().optional(),
        max_participants: z.number().min(1).optional(),
        status: z.enum(["OPEN", "CLOSED"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        const event = await ctx.db.opportunity.findUnique({ where: { id: input.id } });
        if (!event)
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        if (!user || (user.role !== Role.ADMIN && event.userId !== user.id))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to edit this event",
          });
        const updated = await EventModel.updateEvent(ctx.db, input);
        return { success: true, event: updated };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update event",
        });
      }
    }),

  // ─── Delete (admin / org owner) ──────────────────────────────────────────
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        const event = await ctx.db.opportunity.findUnique({ where: { id: input.id } });
        if (!event)
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        if (!user || (user.role !== Role.ADMIN && event.userId !== user.id))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to delete this event",
          });
        await EventModel.deleteEvent(ctx.db, input.id);
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete event",
        });
      }
    }),

  // ─── Get single event with applicants ────────────────────────────────────
  getEvent: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await EventModel.findEventById(ctx.db, input.id);
      } catch (err) {
        if (
          err instanceof PrismaClientKnownRequestError &&
          err.code === "P2025"
        )
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found!" });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch event!",
        });
      }
    }),

  // ─── My events (org / admin) ──────────────────────────────────────────────
  getMyEvents: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await EventModel.findEventsByUser(ctx.db, ctx.session.user.id);
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Unable to find user's events!",
      });
    }
  }),

  // ─── All events with search/filter (public) ───────────────────────────────
  getAllEvents: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          category: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await EventModel.findAllEvents(ctx.db, {
          ...input,
          currentUserId: ctx.session?.user?.id ?? null,
        });
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to find events",
        });
      }
    }),

  // ─── All events admin overview ────────────────────────────────────────────
  getAllEventsAdmin: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
      if (!user || !canManage(user.role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      return await EventModel.findAllEventsAdmin(ctx.db);
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch events",
      });
    }
  }),

  // ─── Accepted events (volunteer) ──────────────────────────────────────────
  getAcceptedEvents: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await EventModel.findAcceptedEvents(ctx.db, ctx.session.user.id);
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong retrieving data!",
      });
    }
  }),

  // ─── My applications dashboard (volunteer) ────────────────────────────────
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await EventModel.findMyApplications(ctx.db, ctx.session.user.id);
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch applications",
      });
    }
  }),

  // ─── Latest events (home page) ────────────────────────────────────────────
  getLatest: publicProcedure.query(async ({ ctx }) => {
    try {
      return await EventModel.findLatestEvents(ctx.db);
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred retrieving latest events",
      });
    }
  }),

  // ─── Apply ────────────────────────────────────────────────────────────────
  applyToEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        if (!user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User does not exist" });
        const event = await EventModel.findEventRaw(ctx.db, input.id);
        if (!event)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Event does not exist" });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const eventDay = new Date(event.date); eventDay.setHours(0, 0, 0, 0);
        if (eventDay < today)
          throw new TRPCError({ code: "FORBIDDEN", message: "Event has already passed!" });
        const already = await EventModel.findExistingApplication(ctx.db, user.id, event.id);
        if (already)
          throw new TRPCError({ code: "CONFLICT", message: "You have already applied for this event." });
        const application = await EventModel.applyToEvent(ctx.db, user.id, event.id);
        return { success: true, application };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong while applying.",
        });
      }
    }),

  // ─── Cancel ───────────────────────────────────────────────────────────────
  cancelApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        if (!user)
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User does not exist" });
        const event = await EventModel.findEventRaw(ctx.db, input.id);
        if (!event)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Event does not exist" });
        await EventModel.cancelApplication(ctx.db, user.id, event.id);
        return { success: true, message: "Application cancelled" };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to cancel application",
        });
      }
    }),

  // ─── Accept application ───────────────────────────────────────────────────
  acceptApplication: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const admin = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        if (!admin || !canManage(admin.role))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and organisations can accept applications!",
          });
        const application = await EventModel.findApplicationById(
          ctx.db, input.applicationId, true,
        ) as (Awaited<ReturnType<typeof ctx.db.signup.findUnique>> & { opportunity: { max_participants: number } }) | null;
        if (!application)
          throw new TRPCError({ code: "NOT_FOUND", message: "Application not found!" });
        if (application.status !== Status.PENDING)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Application already processed!" });
        const confirmedCount = await EventModel.countConfirmedSignups(
          ctx.db, application.opportunityId,
        );
        if (confirmedCount >= application.opportunity.max_participants)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Event is already full." });
        const updated = await EventModel.acceptApplication(ctx.db, input.applicationId);
        return { success: true, message: "Application accepted", application: updated };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to accept application",
        });
      }
    }),

  // ─── Reject application ───────────────────────────────────────────────────
  rejectApplication: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const admin = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        if (!admin || !canManage(admin.role))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and organisations can reject applications",
          });
        const application = await EventModel.findApplicationById(ctx.db, input.applicationId);
        if (!application || application.status === Status.REJECTED)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application does not exist or already rejected",
          });
        const updated = await EventModel.rejectApplication(ctx.db, input.applicationId);
        return { success: true, message: "Application rejected", application: updated };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject application",
        });
      }
    }),

  // ─── Confirm attendance (org / admin) ────────────────────────────────────
  confirmAttendance: protectedProcedure
    .input(z.object({ signupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
        if (!user || !canManage(user.role))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins/orgs can confirm attendance",
          });
        const signup = await EventModel.findSignupById(ctx.db, input.signupId, true);
        if (!signup)
          throw new TRPCError({ code: "NOT_FOUND", message: "Signup not found" });
        if (signup.status !== Status.CONFIRMED)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Volunteer must be confirmed before attendance can be logged",
          });
        const updated = await EventModel.confirmAttendance(ctx.db, input.signupId);
        return { success: true, signup: updated };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to confirm attendance",
        });
      }
    }),
});
