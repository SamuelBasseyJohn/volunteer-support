/**
 * MODEL LAYER — Event Model
 *
 * Pure database query functions for the Opportunity (event) and Signup entities.
 * Controllers call these functions; no tRPC or HTTP logic lives here.
 *
 * Each function accepts the Prisma client (db) and the data it needs, then
 * returns the raw Prisma result. This keeps database concerns isolated from
 * request-handling concerns.
 */

import { type PrismaClient, OpportunityStatus, Status } from "@prisma/client";

// ─── Type helpers ────────────────────────────────────────────────────────────

export type Db = PrismaClient;

export type CreateEventInput = {
  title: string;
  description?: string;
  location?: string;
  category?: string;
  date: string;
  max_participants: number;
  userId: string;
};

export type UpdateEventInput = {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  category?: string;
  date?: string;
  max_participants?: number;
  status?: "OPEN" | "CLOSED";
};

export type GetAllEventsFilter = {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  currentUserId?: string | null;
};

// ─── Event CRUD ──────────────────────────────────────────────────────────────

/** Create a new volunteer opportunity. */
export async function createEvent(db: Db, input: CreateEventInput) {
  return db.opportunity.create({
    data: {
      title: input.title,
      description: input.description,
      location: input.location,
      category: input.category,
      date: new Date(input.date),
      max_participants: input.max_participants,
      status: OpportunityStatus.OPEN,
      userId: input.userId,
    },
  });
}

/** Update an existing opportunity. */
export async function updateEvent(db: Db, input: UpdateEventInput) {
  return db.opportunity.update({
    where: { id: input.id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.date && { date: new Date(input.date) }),
      ...(input.max_participants && { max_participants: input.max_participants }),
      ...(input.status && { status: input.status as OpportunityStatus }),
    },
  });
}

/** Delete an opportunity by id. */
export async function deleteEvent(db: Db, id: string) {
  return db.opportunity.delete({ where: { id } });
}

/** Find a single event with all its applicants. */
export async function findEventById(db: Db, id: string) {
  return db.opportunity.findUniqueOrThrow({
    where: { id },
    include: {
      signups: {
        include: {
          user: { select: { id: true, name: true, email: true, skills: true } },
        },
      },
    },
  });
}

/** Find an event without relations (lightweight lookup). */
export async function findEventRaw(db: Db, id: string) {
  return db.opportunity.findUnique({ where: { id } });
}

/** All events posted by a specific user (org/admin dashboard). */
export async function findEventsByUser(db: Db, userId: string) {
  return db.opportunity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { signups: true } } },
  });
}

/** Public browsable events with optional search/filter. */
export async function findAllEvents(db: Db, filter: GetAllEventsFilter) {
  const events = await db.opportunity.findMany({
    where: {
      date: {
        gte: filter.dateFrom ? new Date(filter.dateFrom) : new Date(),
        ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
      },
      status: OpportunityStatus.OPEN,
      ...(filter.category && { category: filter.category }),
      ...(filter.search && {
        OR: [
          { title: { contains: filter.search, mode: "insensitive" } },
          { location: { contains: filter.search, mode: "insensitive" } },
          { description: { contains: filter.search, mode: "insensitive" } },
        ],
      }),
    },
    include: { signups: { select: { userId: true } } },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    category: event.category,
    date: event.date,
    applied: event.signups.some((s) => s.userId === filter.currentUserId),
  }));
}

/** All events for admin oversight (no public filter). */
export async function findAllEventsAdmin(db: Db) {
  return db.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { signups: true } } },
  });
}

/** Latest 3 open events (home page widget). */
export async function findLatestEvents(db: Db) {
  return db.opportunity.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    where: { status: OpportunityStatus.OPEN },
  });
}

// ─── Signups (applications) ──────────────────────────────────────────────────

/** Fetch a volunteer's confirmed (accepted) events. */
export async function findAcceptedEvents(db: Db, userId: string) {
  const signups = await db.signup.findMany({
    where: { userId, status: Status.CONFIRMED },
    include: { opportunity: true },
  });
  return signups.map((s) => ({
    signupId: s.id,
    id: s.opportunityId,
    title: s.opportunity.title,
    description: s.opportunity.description,
    location: s.opportunity.location,
    category: s.opportunity.category,
    date: s.opportunity.date,
    attendanceConfirmed: s.attendanceConfirmed,
    applied: true,
  }));
}

/** Fetch all applications made by a volunteer (dashboard). */
export async function findMyApplications(db: Db, userId: string) {
  const signups = await db.signup.findMany({
    where: { userId },
    include: { opportunity: true },
    orderBy: { createdAt: "desc" },
  });
  return signups.map((s) => ({
    signupId: s.id,
    opportunityId: s.opportunityId,
    title: s.opportunity.title,
    location: s.opportunity.location,
    category: s.opportunity.category,
    date: s.opportunity.date,
    status: s.status,
    attendanceConfirmed: s.attendanceConfirmed,
  }));
}

/** Apply a volunteer to an event — creates a PENDING signup. */
export async function applyToEvent(db: Db, userId: string, eventId: string) {
  return db.signup.create({
    data: { userId, opportunityId: eventId, status: Status.PENDING },
  });
}

/** Check whether a volunteer has already applied to an event. */
export async function findExistingApplication(
  db: Db,
  userId: string,
  eventId: string,
) {
  return db.signup.findFirst({ where: { userId, opportunityId: eventId } });
}

/** Cancel (delete) a volunteer's application. */
export async function cancelApplication(
  db: Db,
  userId: string,
  eventId: string,
) {
  return db.signup.deleteMany({ where: { userId, opportunityId: eventId } });
}

/** Find an application by its id, optionally including the event. */
export async function findApplicationById(
  db: Db,
  applicationId: string,
  includeOpportunity = false,
) {
  return db.signup.findUnique({
    where: { id: applicationId },
    ...(includeOpportunity && { include: { opportunity: true } }),
  });
}

/** Count confirmed signups for a specific event. */
export async function countConfirmedSignups(db: Db, opportunityId: string) {
  return db.signup.count({
    where: { opportunityId, status: Status.CONFIRMED },
  });
}

/** Mark an application as CONFIRMED. */
export async function acceptApplication(db: Db, applicationId: string) {
  return db.signup.update({
    where: { id: applicationId },
    data: { status: Status.CONFIRMED },
  });
}

/** Mark an application as REJECTED. */
export async function rejectApplication(db: Db, applicationId: string) {
  return db.signup.update({
    where: { id: applicationId },
    data: { status: Status.REJECTED },
  });
}

/** Mark a confirmed volunteer's attendance. */
export async function confirmAttendance(db: Db, signupId: string) {
  return db.signup.update({
    where: { id: signupId },
    data: { attendanceConfirmed: true },
  });
}

/** Find a signup by id, optionally including its event. */
export async function findSignupById(
  db: Db,
  signupId: string,
  includeOpportunity = false,
) {
  return db.signup.findUnique({
    where: { id: signupId },
    ...(includeOpportunity && { include: { opportunity: true } }),
  });
}
