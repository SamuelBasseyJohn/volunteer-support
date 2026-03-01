"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const SKILLS = ["Medical", "Logistics", "Education", "Environment", "Technology", "Community", "Other"]

export default function ProfilePage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const { data: profile, isLoading } = api.user.getProfile.useQuery(undefined, { enabled: !!session })
    const updateProfile = api.user.updateProfile.useMutation({
        onSuccess: async () => {
            await update()
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
    })
    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState({ name: "", bio: "", phone: "", skills: [] as string[] })

    useEffect(() => {
        if (status === "unauthenticated") router.push("/signin")
    }, [status, router])

    useEffect(() => {
        if (profile) {
            setForm({
                name: profile.name ?? "",
                bio: profile.bio ?? "",
                phone: profile.phone ?? "",
                skills: profile.skills ?? [],
            })
        }
    }, [profile])

    const toggleSkill = (skill: string) => {
        setForm(f => ({
            ...f,
            skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateProfile.mutate(form)
    }

    if (isLoading) return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-900 to-blue-500">
            <p className="text-white text-xl">Loading profile...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-500 px-4 py-10">
            <div className="mx-auto max-w-xl">
                <h1 className="mb-6 text-4xl font-bold text-white">My Profile</h1>
                <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-7 shadow-xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input value={profile?.email ?? ""} disabled className="w-full rounded-lg border bg-gray-50 p-3 text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+44 7000 000000"
                            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            value={form.bio}
                            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            rows={3}
                            placeholder="Tell us a bit about yourself..."
                            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {profile?.role === "VOLUNTEER" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                            <div className="flex flex-wrap gap-2">
                                {SKILLS.map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => toggleSkill(skill)}
                                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition border ${form.skills.includes(skill)
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                            }`}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {saved && (
                        <p className="rounded-lg bg-green-50 px-4 py-2 text-center text-sm font-semibold text-green-700 border border-green-200">
                            ✅ Profile updated successfully!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
                    >
                        {updateProfile.isPending ? "Saving..." : "Save Profile"}
                    </button>
                </form>
            </div>
        </div>
    )
}
