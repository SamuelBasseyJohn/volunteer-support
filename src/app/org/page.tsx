"use client"
import { useSession } from "next-auth/react"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function OrgPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { data: events, isLoading, refetch } = api.event.getMyEvents.useQuery(undefined, { enabled: !!session })
    const deleteEvent = api.event.deleteEvent.useMutation({ onSuccess: () => void refetch() })
    const [confirm, setConfirm] = useState<string | null>(null)

    useEffect(() => {
        if (status === "unauthenticated") router.push("/signin")
        if (session && session.user.role !== "ORGANIZATION") router.push("/")
    }, [status, session, router])

    const parseDate = (d: Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 px-4 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Organisation Dashboard</h1>
                        <p className="text-blue-200">Manage your volunteer opportunities</p>
                    </div>
                    <Link href="/createEvent" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-blue-700 hover:bg-blue-50 transition text-center">
                        + Post Opportunity
                    </Link>
                </div>

                {isLoading && <p className="text-center text-blue-200">Loading your events...</p>}

                {!isLoading && events?.length === 0 && (
                    <div className="rounded-2xl bg-white/10 p-10 text-center text-white">
                        <p className="mb-4 text-xl">You haven&apos;t posted any opportunities yet.</p>
                        <Link href="/createEvent" className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50 transition">
                            Post Your First Opportunity
                        </Link>
                    </div>
                )}

                <div className="space-y-4">
                    {events?.map(event => (
                        <div key={event.id} className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-semibold text-white">{event.title}</h2>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${event.status === "OPEN" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-blue-200">
                                        {event.location && <span>📍 {event.location}</span>}
                                        {event.category && <span>🏷 {event.category}</span>}
                                        {event.date && <span>📅 {parseDate(event.date)}</span>}
                                        <span>👥 {event._count.signups} applicant{event._count.signups !== 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Link href={`/event/manage/${event.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition">
                                        Review Applicants
                                    </Link>
                                    {confirm === event.id ? (
                                        <>
                                            <button onClick={() => { deleteEvent.mutate({ id: event.id }); setConfirm(null) }}
                                                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition">
                                                Confirm Delete
                                            </button>
                                            <button onClick={() => setConfirm(null)} className="rounded-lg bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/30 transition">
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setConfirm(event.id)} className="rounded-lg bg-red-500/30 px-4 py-2 text-sm text-red-200 hover:bg-red-500/50 transition">
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
