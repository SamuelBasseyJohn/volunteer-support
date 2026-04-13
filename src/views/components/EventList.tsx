"use client";
/**
 * VIEW LAYER — EventList Component
 *
 * Displays a list of events with expandable details and
 * apply/cancel functionality for volunteer users.
 */
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineKeyboardArrowUp } from "react-icons/md";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  date?: Date;
  applied?: boolean;
}

interface EventListProps {
  eventData: Event[];
}

const EventList: React.FC<EventListProps> = ({ eventData }) => {
  const [events, setEvents] = useState<Event[]>(eventData);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const trpcUtils = api.useUtils();

  const apply = api.event.applyToEvent.useMutation({
    onSuccess: async () => {
      console.log("Application successful");
      await trpcUtils.event.invalidate();
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const cancel = api.event.cancelApplication.useMutation({
    onSuccess: async () => {
      console.log("Application cancelled successfully");
      await trpcUtils.event.invalidate();
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const handleApply = (id: string) => {
    const event = eventData.find((val) => val.id === id);
    if (event?.applied) {
      cancel.mutate({ id });
    } else {
      apply.mutate({ id });
    }
  };

  const toggleDropdown = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const parseDate = (date: Date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  useEffect(() => {
    setEvents(eventData);
  }, [eventData]);

  return (
    <div className="mx-auto mb-10 mt-10 w-full max-w-7xl space-y-4 border-2 border-blue-500 p-6">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex gap-3 text-lg font-semibold text-blue-700">
              {event.title}
              <button
                className="text-gray-500 transition hover:text-gray-700"
                onClick={() => toggleDropdown(event.id)}
              >
                {expanded[event.id] ? (
                  <MdOutlineKeyboardArrowUp />
                ) : (
                  <MdKeyboardArrowDown />
                )}
              </button>
            </h3>
            <div className="flex">
              {event.applied != undefined && (
                <button
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                    event.applied
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  onClick={() => handleApply(event.id)}
                >
                  {event.applied ? "Cancel" : "Apply"}
                </button>
              )}
            </div>
          </div>
          {expanded[event.id] && (
            <div className="mt-3 rounded-lg bg-gray-100 p-3">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {event.description}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Location:</strong> {event.location}
              </p>
              {event.date && (
                <p className="text-sm text-gray-700">
                  <strong>Date:</strong> {parseDate(event.date)}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventList;
export type { Event };
