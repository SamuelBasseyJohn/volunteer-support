"use client";
/**
 * VIEW LAYER — VolunteerChatView Component
 *
 * Provides a dedicated page for volunteers to view the chat 
 * of an event they are confirmed for.
 */

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "~/trpc/react";
import EventChat from "~/views/components/EventChat";

const VolunteerChatView = ({ id }: { id: string }) => {
  const router = useRouter();

  const { data: event, isLoading, isError } = api.event.getEvent.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-800 to-blue-400 text-white">
        <p className="text-xl font-semibold">Loading Chat...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-800 to-blue-400 text-white">
        <p className="text-xl font-semibold">Oops! We couldn't load this event chat.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-blue-800 to-blue-400 text-white shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4 mb-6">
            <button
            onClick={() => router.back()}
            className="flex items-center rounded-full bg-white p-2 shadow-md hover:shadow-lg"
            >
            <ArrowLeft className="h-6 w-6 text-gray-800" />
            </button>
            <h1 className="text-2xl font-bold">Group Chat: {event.title}</h1>
        </div>

        <div className="max-w-4xl mx-auto">
            <EventChat eventId={event.id} />
        </div>
    </div>
  );
};

export default VolunteerChatView;
