"use client";
/**
 * VIEW LAYER — List Component
 *
 * A single clickable event row used in the org/admin event list.
 * Clicking navigates to the manage-event page for that event.
 */
import { useRouter } from "next/navigation";

const EventList = ({
  title,
  date,
  location,
  status,
  eventId,
}: {
  title: string;
  date: string;
  location: string;
  status: string;
  eventId: string;
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/event/manage/${eventId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="my-3 p-2 bg-slate-100 rounded hover:cursor-pointer hover:bg-slate-200"
    >
      <div className="flex gap-2 items-center justify-between">
        <p className="font-semibold text-xl text-blue-700">{title}</p>
        <p
          className={`w-4 aspect-square rounded-full ${
            status === "OPEN" ? "bg-green-500" : "bg-red-500"
          }`}
        ></p>
      </div>
      <div className="flex gap-2 items-center justify-between">
        <p className="text-base">{location}</p>
        <p>{date}</p>
      </div>
    </div>
  );
};

export { EventList };
