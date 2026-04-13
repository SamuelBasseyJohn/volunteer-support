"use client"
import React from 'react';
import EventList from '~/views/components/EventList';
import { api } from '~/trpc/react';

const AcceptedEventsPage: React.FC = () => {
    const events = api.event.getAcceptedEvents.useQuery()
    return (
        <div className="p-6 bg-gradient-to-b from-blue-800 to-blue-400 text-white min-h-screen">
            <h1 className="text-3xl text-center font-bold mb-4">Accepted Events</h1>
            {events.isFetched && (events.data?.length ?? 0) > 0 && <EventList eventData={events?.data ?? []} />}
            {events.isFetched && (events.data?.length ?? 0) == 0 && <p className='text-center'>You have not been accepted to any event</p>}
        </div>

    );
};

export default AcceptedEventsPage;
