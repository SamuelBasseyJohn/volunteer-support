"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { api } from "~/trpc/react"
import { useMemo } from "react"
import { Status } from "@prisma/client"

const EventManagement = ({ id }: { id: string }) => {
    const router = useRouter()

    const { data: event, isLoading, isFetched, refetch } = api.event.getEvent.useQuery({ id })

    const accept = api.event.acceptApplication.useMutation({
        onSuccess: () => void refetch(),
        onError: err => alert(err.message)
    })
    const reject = api.event.rejectApplication.useMutation({
        onSuccess: () => void refetch(),
        onError: err => alert(err.message)
    })
    const confirmAttendance = api.event.confirmAttendance.useMutation({
        onSuccess: () => void refetch(),
        onError: err => alert(err.message)
    })

    const confirmed = useMemo(() =>
        event ? event.signups.filter(s => s.status === Status.CONFIRMED).length : 0,
        [event]
    )

    return (
        <div className="flex-1 space-y-6 rounded-lg bg-gradient-to-b from-blue-800 to-blue-400 text-white p-6 shadow-lg min-h-screen">
            {isFetched && (
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex justify-center gap-3 text-center">
                            <button onClick={() => router.back()}
                                className="flex items-center rounded-full bg-white p-2 shadow-md hover:shadow-lg">
                                <ArrowLeft className="h-6 w-6 text-gray-800" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Manage Event</h1>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto mt-4">
                        <h2 className="my-3 text-center text-3xl font-extrabold text-gray-800">{event?.title}</h2>
                        <div className="flex flex-wrap gap-4 justify-center my-2 text-gray-700 text-lg">
                            <span><strong>Accepted:</strong> {confirmed}/{event?.max_participants}</span>
                            {event?.location && <span>📍 {event.location}</span>}
                            {event?.category && <span>🏷 {event.category}</span>}
                        </div>
                        {event?.description && (
                            <p className="text-center text-gray-800 my-2">{event.description}</p>
                        )}
                    </div>

                    <div className="max-w-4xl mx-auto mt-6">
                        <h3 className="my-3 text-xl text-center font-bold text-gray-900">Volunteer Applications</h3>
                        {event?.signups.length === 0 ? (
                            <p className="text-center text-blue-100">No applications yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {event?.signups.map(signup => (
                                    <li key={signup.id} className="flex flex-col gap-3 rounded-xl bg-white/20 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <span className="font-semibold text-white">{signup.user.name}</span>
                                            <span className="ml-2 text-sm text-blue-100">{signup.user.email}</span>
                                            {signup.user.skills && signup.user.skills.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {signup.user.skills.map(skill => (
                                                        <span key={skill} className="rounded-full bg-white/30 px-2 py-0.5 text-xs text-white">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {signup.status === Status.PENDING && (
                                                <>
                                                    <button onClick={() => accept.mutate({ applicationId: signup.id })}
                                                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition">
                                                        Accept
                                                    </button>
                                                    <button onClick={() => reject.mutate({ applicationId: signup.id })}
                                                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 transition">
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {signup.status !== Status.PENDING && (
                                                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${signup.status === "CONFIRMED" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                                    }`}>
                                                    {signup.status}
                                                </span>
                                            )}
                                            {signup.status === Status.CONFIRMED && !signup.attendanceConfirmed && (
                                                <button onClick={() => confirmAttendance.mutate({ signupId: signup.id })}
                                                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700 transition">
                                                    Confirm Attendance
                                                </button>
                                            )}
                                            {signup.attendanceConfirmed && (
                                                <span className="rounded-full bg-purple-200 px-3 py-1 text-sm font-semibold text-purple-800">
                                                    ✅ Attended
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            {isLoading && <p className="text-center my-5 text-white text-xl font-semibold">Loading Event...</p>}
        </div>
    )
}

export default EventManagement