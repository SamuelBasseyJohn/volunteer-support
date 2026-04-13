"use client"
import { useSession } from "next-auth/react"
import { api } from "~/trpc/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    CONFIRMED: "bg-green-100 text-green-800 border border-green-300",
    REJECTED: "bg-red-100 text-red-800 border border-red-300",
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { data: applications, isLoading } = api.event.getMyApplications.useQuery(
        undefined,
        { enabled: !!session }
    )

    useEffect(() => {
        if (status === "unauthenticated") router.push("/signin")
    }, [status, router])

    const parseDate = (d: Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 px-4 py-10 text-white">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-2 text-4xl font-bold">My Dashboard</h1>
                <p className="mb-8 text-blue-200">Track the status of your volunteer applications</p>

                {isLoading && <p className="text-center text-blue-200">Loading applications...</p>}

                {!isLoading && applications?.length === 0 && (
                    <div className="rounded-2xl bg-white/10 p-10 text-center">
                        <p className="mb-4 text-xl">You haven&apos;t applied to any events yet.</p>
                        <Link href="/allEvents" className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50 transition">
                            Browse Events
                        </Link>
                    </div>
                )}

                <div className="space-y-4">
                    {applications?.map(app => (
                        <div key={app.signupId} className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/20">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">{app.title}</h2>
                                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-blue-200">
                                        {app.location && <span>📍 {app.location}</span>}
                                        {app.category && <span>🏷 {app.category}</span>}
                                        {app.date && <span>📅 {parseDate(app.date)}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-start gap-2 sm:items-end">
                                    <span className={`rounded-full px-4 py-1 text-sm font-semibold ${statusColors[app.status] ?? ""}`}>
                                        {app.status}
                                    </span>
                                    {app.attendanceConfirmed && (
                                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 border border-purple-300">
                                            ✅ Attendance Confirmed
                                        </span>
                                    )}
                                    {app.status === "CONFIRMED" && (
                                        <Link href={`/event/${app.opportunityId}/chat`} className="mt-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                                            Go to Chat
                                        </Link>
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
