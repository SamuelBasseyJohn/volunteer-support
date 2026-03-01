"use client"
import { useSession } from "next-auth/react"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { data: events, isLoading, refetch } = api.event.getAllEventsAdmin.useQuery(
        undefined, { enabled: !!session }
    )
    const deleteEvent = api.event.deleteEvent.useMutation({ onSuccess: () => void refetch() })
    const [confirm, setConfirm] = useState<string | null>(null)

    useEffect(() => {
        if (status === "unauthenticated") router.push("/signin")
        if (session && session.user.role !== "ADMIN") router.push("/")
    }, [status, session, router])

    const parseDate = (d: Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 px-4 py-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
                        <p className="text-blue-200">Content oversight — all events</p>
                    </div>
                    <Link href="/createEvent" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-blue-700 hover:bg-blue-50 transition text-center">
                        + Create Event
                    </Link>
                </div>

                {isLoading && <p className="text-center text-blue-200">Loading events...</p>}

                {!isLoading && events?.length === 0 && (
                    <div className="rounded-2xl bg-white/10 p-10 text-center text-white">
                        No events yet. <Link href="/createEvent" className="underline">Create one</Link>.
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-blue-700 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
                                <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left hidden sm:table-cell">Signups</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events?.map((event, i) => (
                                <tr key={event.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="px-4 py-3 font-medium text-gray-800">{event.title}</td>
                                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{event.category ?? "—"}</td>
                                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{parseDate(event.date)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${event.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{event._count.signups}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={`/event/manage/${event.id}`} className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 transition">
                                                Manage
                                            </Link>
                                            {confirm === event.id ? (
                                                <>
                                                    <button onClick={() => { deleteEvent.mutate({ id: event.id }); setConfirm(null) }}
                                                        className="rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 transition">
                                                        Confirm
                                                    </button>
                                                    <button onClick={() => setConfirm(null)} className="rounded-md bg-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-400 transition">
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setConfirm(event.id)} className="rounded-md bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 transition">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
