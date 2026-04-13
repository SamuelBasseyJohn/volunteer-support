"use client";
/**
 * VIEW LAYER — LatestEvents Component
 *
 * Fetches and displays the 3 most recently created open events.
 * Used on the authenticated home page.
 */
import { api } from "~/trpc/react";
import type { Event } from "~/views/components/EventList";
import EventList from "~/views/components/EventList";

export const LatestEvents = () => {
  const events = api.event.getLatest.useQuery();
  return events.isFetched ? (
    <EventList eventData={events?.data ?? []} />
  ) : (
    <p className="text-center">No available upcoming event!</p>
  );
};
