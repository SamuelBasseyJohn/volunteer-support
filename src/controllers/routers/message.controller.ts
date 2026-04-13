/**
 * CONTROLLER LAYER — Message Controller
 *
 * Handles chat messages for event groups.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/controllers/trpc";
import * as MessageModel from "~/models/message.model";
import * as EventModel from "~/models/event.model";
import { Status, Role } from "@prisma/client";

/**
 * Helper to check if a user is allowed to access the event chat.
 * Allowed:
 * - Admin
 * - Organization who created the event
 * - Volunteer who is CONFIRMED for the event
 */
async function canAccessChat(db: MessageModel.Db, userId: string, role: string, eventId: string) {
    if (role === Role.ADMIN) return true;
    
    // Check if the event belongs to this organization
    const event = await EventModel.findEventRaw(db, eventId);
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

    if (role === Role.ORGANIZATION && event.userId === userId) return true;

    // Check if user is a confirmed volunteer for this event
    if (role === Role.VOLUNTEER) {
        const signup = await EventModel.findExistingApplication(db, userId, eventId);
        if (signup && signup.status === Status.CONFIRMED) {
            return true;
        }
    }

    return false;
}

export const messageController = createTRPCRouter({
    // Fetch all messages for an event
    getEventChat: protectedProcedure
        .input(z.object({ eventId: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                const isAllowed = await canAccessChat(ctx.db, ctx.session.user.id, ctx.session.user.role ?? "", input.eventId);
                if (!isAllowed) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this chat." });
                }
                return await MessageModel.getMessagesByEventId(ctx.db, input.eventId);
            } catch (err) {
                if (err instanceof TRPCError) throw err;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load chat." });
            }
        }),

    // Send a new message to an event chat
    sendMessage: protectedProcedure
        .input(z.object({
            eventId: z.string(),
            text: z.string().min(1, "Message cannot be empty").max(1000)
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const isAllowed = await canAccessChat(ctx.db, ctx.session.user.id, ctx.session.user.role ?? "", input.eventId);
                if (!isAllowed) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to send messages here." });
                }
                const newMessage = await MessageModel.createMessage(ctx.db, {
                    opportunityId: input.eventId,
                    senderId: ctx.session.user.id,
                    text: input.text
                });
                return { success: true, message: newMessage };
            } catch (err) {
                if (err instanceof TRPCError) throw err;
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send message." });
            }
        })
});
