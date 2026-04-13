/**
 * MODEL LAYER — Message Model
 *
 * Pure database query functions for the Message entity.
 * Used for the event group chat feature.
 */

import { type PrismaClient } from "@prisma/client";

export type Db = PrismaClient;

export type CreateMessageInput = {
    opportunityId: string;
    senderId: string;
    text: string;
};

/** Fetch messages for a specific event with sender details */
export async function getMessagesByEventId(db: Db, opportunityId: string) {
    return db.message.findMany({
        where: { opportunityId },
        orderBy: { createdAt: "asc" },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                }
            }
        }
    });
}

/** Create a new chat message */
export async function createMessage(db: Db, input: CreateMessageInput) {
    return db.message.create({
        data: {
            opportunityId: input.opportunityId,
            senderId: input.senderId,
            text: input.text,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                }
            }
        }
    });
}
