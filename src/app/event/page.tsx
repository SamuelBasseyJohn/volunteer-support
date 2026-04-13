'use client'
import { EventList } from "~/views/components/List"
import { api } from "~/trpc/react"
import { useState } from "react"
import Link from "next/link"

interface Event {
    status: string,
    id: string,
    title: string,
    location: string,
    date: string
}

const Events = () => {
    const [events, setEvents] = useState<Event[]>([])
    const getEvents = api.event.getMyEvents.useQuery()
    const parseDate = (date: Date) => {
        return new Date(date).toISOString().split("T")[0]; // Returns YYYY-MM-DD
    };
    return(
        <div className="flex-1 flex flex-col space-y-6 rounded-lg bg-gradient-to-b from-blue-800 to-blue-400 h-full p-6 shadow-lg">
            <Link href="./createEvent" className="w-full max-w-[200px] self-end rounded-lg bg-white py-3 font-medium text-blue-600 text-center transition hover:bg-blue-500 hover:text-white">
                Create Event
            </Link>
            <h1 className="text-center text-4xl text-white font-semibold">My Events</h1>

            <div className="flex-1 mx-auto my-4 p-4 max-w-5xl w-full h-screen bg-white rounded-md">
                {
                    getEvents.isLoading && <p className="m-3 text-xl text-center font-semibold">Loading Events...</p>
                }
                {
                    getEvents.isFetched && 
                    getEvents.data?.map(event => 
                        <EventList 
                        key={event.id}
                        eventId={event.id}
                        title={event.title} 
                        date={parseDate(new Date(event.date)) ?? ""}
                        location={event.location ?? "Unknown Location"} 
                        status={event.status}
                        />
                    )
                }
            </div>
        </div>
    )
}

export default Events