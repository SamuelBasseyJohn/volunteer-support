"use client"
import React, { useState } from 'react'
import EventList from '~/views/components/EventList'
import { api } from '~/trpc/react'

const CATEGORIES = ["All", "Medical", "Logistics", "Education", "Environment", "Technology", "Community", "Other"]

const AllEventsPage: React.FC = () => {
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const events = api.event.getAllEvents.useQuery({
        search: search || undefined,
        category: category || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    })

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-800 to-blue-400 text-white p-6">
            <h1 className="text-4xl font-bold mb-6">All Events</h1>

            {/* Search & Filters */}
            <div className="w-full max-w-4xl mb-6 space-y-3">
                <input
                    type="text"
                    placeholder="🔍  Search by title, location or description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder-blue-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white"
                />
                <div className="flex flex-wrap gap-3">
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value === "All" ? "" : e.target.value)}
                        className="rounded-xl bg-white/20 px-4 py-2 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c === "All" ? "" : c} className="text-gray-800">{c}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-blue-100">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="rounded-xl bg-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-blue-100">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="rounded-xl bg-white/20 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white" />
                    </div>
                    {(search || category || dateFrom || dateTo) && (
                        <button
                            onClick={() => { setSearch(""); setCategory(""); setDateFrom(""); setDateTo("") }}
                            className="rounded-xl bg-white/30 px-4 py-2 text-sm hover:bg-white/40 transition"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {events.isLoading && <p className="text-blue-100">Loading events...</p>}
            {events.isFetched && (events.data?.length ?? 0) === 0 && (
                <p className="mt-10 text-lg text-blue-100">No events match your search.</p>
            )}
            {events.isFetched && (events.data?.length ?? 0) > 0 && (
                <EventList eventData={events.data ?? []} />
            )}
        </div>
    )
}

export default AllEventsPage
