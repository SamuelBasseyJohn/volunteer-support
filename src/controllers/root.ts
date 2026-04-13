/**
 * CONTROLLER LAYER — Root Router
 *
 * Aggregates all sub-controllers (routers) into the single app router
 * that is exposed as the tRPC API. Add any new controller here.
 */

import { userController } from "~/controllers/routers/user.controller";
import { eventController } from "~/controllers/routers/event.controller";
import { messageController } from "~/controllers/routers/message.controller";
import { createCallerFactory, createTRPCRouter } from "~/controllers/trpc";

/**
 * The primary router for the server.
 * All routers added in /controllers/routers should be registered here.
 */
export const appRouter = createTRPCRouter({
  user: userController,
  event: eventController,
  message: messageController,
});

/** Type definition of the full API — imported by the client. */
export type AppRouter = typeof appRouter;

/**
 * Server-side caller factory.
 * @example
 * const trpc = createCaller(createContext);
 * const events = await trpc.event.getAllEvents();
 */
export const createCaller = createCallerFactory(appRouter);
