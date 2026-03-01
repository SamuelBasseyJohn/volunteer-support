import { OpportunityStatus, Role, Status } from "@prisma/client"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc"

const canManage = (role: Role) => role === Role.ADMIN || role === Role.ORGANIZATION

export const eventRouter = createTRPCRouter({
  // ─── Create (admin / org) ──────────────────────────────────────────────────
  createEvent: protectedProcedure.input(
    z.object({
      title: z.string().min(1, "Title is required").max(100),
      description: z.string().max(500).optional(),
      location: z.string().max(100).optional(),
      category: z.string().optional(),
      date: z.string().date(),
      max_participants: z.number().min(1, "Must have at least 1 volunteer")
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
      if (!user || !canManage(user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and organisations can create events!" })
      }
      const event = await ctx.db.opportunity.create({
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          category: input.category,
          date: new Date(input.date),
          max_participants: input.max_participants,
          status: OpportunityStatus.OPEN,
          userId: user.id
        }
      })
      return { success: true, event }
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create event!" })
    }
  }),

  // ─── Update (admin / org owner) ───────────────────────────────────────────
  updateEvent: protectedProcedure.input(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      location: z.string().max(100).optional(),
      category: z.string().optional(),
      date: z.string().date().optional(),
      max_participants: z.number().min(1).optional(),
      status: z.enum(["OPEN", "CLOSED"]).optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
      const event = await ctx.db.opportunity.findUnique({ where: { id: input.id } })
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
      if (!user || (user.role !== Role.ADMIN && event.userId !== user.id))
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to edit this event" })
      const updated = await ctx.db.opportunity.update({
        where: { id: input.id },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.date && { date: new Date(input.date) }),
          ...(input.max_participants && { max_participants: input.max_participants }),
          ...(input.status && { status: input.status as OpportunityStatus }),
        }
      })
      return { success: true, event: updated }
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update event" })
    }
  }),

  // ─── Delete (admin / org owner) ───────────────────────────────────────────
  deleteEvent: protectedProcedure.input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
        const event = await ctx.db.opportunity.findUnique({ where: { id: input.id } })
        if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
        if (!user || (user.role !== Role.ADMIN && event.userId !== user.id))
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to delete this event" })
        await ctx.db.opportunity.delete({ where: { id: input.id } })
        return { success: true }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete event" })
      }
    }),

  // ─── Get single event with applicants ────────────────────────────────────
  getEvent: publicProcedure.input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.opportunity.findUniqueOrThrow({
          where: { id: input.id },
          include: {
            signups: {
              include: {
                user: { select: { id: true, name: true, email: true, skills: true } }
              }
            }
          }
        })
      } catch (err) {
        if (err instanceof PrismaClientKnownRequestError && err.code === "P2025")
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found!" })
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch event!" })
      }
    }),

  // ─── My events (org / admin) ──────────────────────────────────────────────
  getMyEvents: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id
      return await ctx.db.opportunity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { signups: true } } }
      })
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "NOT_FOUND", message: "Unable to find user's events!" })
    }
  }),

  // ─── All events with search/filter (public) ───────────────────────────────
  getAllEvents: publicProcedure.input(z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    try {
      const userId = ctx.session?.user?.id ?? null
      const events = await ctx.db.opportunity.findMany({
        where: {
          date: {
            gte: input?.dateFrom ? new Date(input.dateFrom) : new Date(),
            ...(input?.dateTo && { lte: new Date(input.dateTo) })
          },
          status: OpportunityStatus.OPEN,
          ...(input?.category && { category: input.category }),
          ...(input?.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { location: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ]
          })
        },
        include: { signups: { select: { userId: true } } }
      })
      return events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        date: event.date,
        applied: event.signups.some(s => s.userId === userId)
      }))
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to find events" })
    }
  }),

  // ─── All events admin overview ────────────────────────────────────────────
  getAllEventsAdmin: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
      if (!user || !canManage(user.role))
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" })
      return await ctx.db.opportunity.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { signups: true } } }
      })
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch events" })
    }
  }),

  // ─── Accepted events (volunteer) ──────────────────────────────────────────
  getAcceptedEvents: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    try {
      const signups = await ctx.db.signup.findMany({
        where: { userId, status: Status.CONFIRMED },
        include: { opportunity: true }
      })
      return signups.map(s => ({
        signupId: s.id,
        id: s.opportunityId,
        title: s.opportunity.title,
        description: s.opportunity.description,
        location: s.opportunity.location,
        category: s.opportunity.category,
        date: s.opportunity.date,
        attendanceConfirmed: s.attendanceConfirmed,
        applied: true
      }))
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong retrieving data!" })
    }
  }),

  // ─── My applications dashboard (volunteer) ────────────────────────────────
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    try {
      const signups = await ctx.db.signup.findMany({
        where: { userId },
        include: { opportunity: true },
        orderBy: { createdAt: "desc" }
      })
      return signups.map(s => ({
        signupId: s.id,
        opportunityId: s.opportunityId,
        title: s.opportunity.title,
        location: s.opportunity.location,
        category: s.opportunity.category,
        date: s.opportunity.date,
        status: s.status,
        attendanceConfirmed: s.attendanceConfirmed,
      }))
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch applications" })
    }
  }),

  // ─── Latest events (home page) ────────────────────────────────────────────
  getLatest: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.opportunity.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        where: { status: OpportunityStatus.OPEN }
      })
    } catch (err) {
      if (err instanceof TRPCError) throw err
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An error occured retrieving latest events" })
    }
  }),

  // ─── Apply ────────────────────────────────────────────────────────────────
  applyToEvent: protectedProcedure.input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User does not exist" })
        const event = await ctx.db.opportunity.findUnique({ where: { id: input.id } })
        if (!event) throw new TRPCError({ code: "BAD_REQUEST", message: "Event does not exist" })
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const eventDay = new Date(event.date); eventDay.setHours(0, 0, 0, 0)
        if (eventDay < today) throw new TRPCError({ code: "FORBIDDEN", message: "Event has already passed!" })
        const already = await ctx.db.signup.findFirst({ where: { userId: user.id, opportunityId: event.id } })
        if (already) throw new TRPCError({ code: "CONFLICT", message: "You have already applied for this event." })
        const application = await ctx.db.signup.create({
          data: { userId: user.id, opportunityId: event.id, status: Status.PENDING }
        })
        return { success: true, application }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong while applying." })
      }
    }),

  // ─── Cancel ───────────────────────────────────────────────────────────────
  cancelApplication: protectedProcedure.input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User does not exist" })
        const event = await ctx.db.opportunity.findUnique({ where: { id: input.id } })
        if (!event) throw new TRPCError({ code: "BAD_REQUEST", message: "Event does not exist" })
        await ctx.db.signup.deleteMany({ where: { userId: user.id, opportunityId: event.id } })
        return { success: true, message: "Application cancelled" }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to cancel application" })
      }
    }),

  // ─── Accept ───────────────────────────────────────────────────────────────
  acceptApplication: protectedProcedure.input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const admin = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
        if (!admin || !canManage(admin.role))
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and organisations can accept applications!" })
        const application = await ctx.db.signup.findUnique({
          where: { id: input.applicationId },
          include: { opportunity: true }
        })
        if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found!" })
        if (application.status !== Status.PENDING)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Application already processed!" })
        const confirmedCount = await ctx.db.signup.count({
          where: { opportunityId: application.opportunityId, status: Status.CONFIRMED }
        })
        if (confirmedCount >= application.opportunity.max_participants)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Event is already full." })
        const updated = await ctx.db.signup.update({
          where: { id: input.applicationId }, data: { status: Status.CONFIRMED }
        })
        return { success: true, message: "Application accepted", application: updated }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to accept application" })
      }
    }),

  // ─── Reject ───────────────────────────────────────────────────────────────
  rejectApplication: protectedProcedure.input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const admin = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
        if (!admin || !canManage(admin.role))
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and organisations can reject applications" })
        const application = await ctx.db.signup.findUnique({ where: { id: input.applicationId } })
        if (!application || application.status === Status.REJECTED)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Application does not exist or already rejected" })
        const updated = await ctx.db.signup.update({
          where: { id: input.applicationId }, data: { status: Status.REJECTED }
        })
        return { success: true, message: "Application rejected", application: updated }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reject application" })
      }
    }),

  // ─── Confirm attendance (org / admin) ────────────────────────────────────
  confirmAttendance: protectedProcedure.input(z.object({ signupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } })
        if (!user || !canManage(user.role))
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins/orgs can confirm attendance" })
        const signup = await ctx.db.signup.findUnique({
          where: { id: input.signupId },
          include: { opportunity: true }
        })
        if (!signup) throw new TRPCError({ code: "NOT_FOUND", message: "Signup not found" })
        if (signup.status !== Status.CONFIRMED)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Volunteer must be confirmed before attendance can be logged" })
        const updated = await ctx.db.signup.update({
          where: { id: input.signupId }, data: { attendanceConfirmed: true }
        })
        return { success: true, signup: updated }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to confirm attendance" })
      }
    }),
})