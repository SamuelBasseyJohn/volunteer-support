"use client"
import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "~/trpc/react"
import { useSession } from "next-auth/react"

const CATEGORIES = ["Medical", "Logistics", "Education", "Environment", "Technology", "Community", "Other"]

const CreateEvent = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [formData, setFormData] = useState({ title: "", description: "", location: "", category: "", date: "", max_participants: 0 })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.title.trim()) e.title = "Title is required"
    if (!formData.date) e.date = "Date is required"
    if (formData.max_participants < 1) e.max_participants = "At least 1 volunteer required"
    return e
  }

  const create = api.event.createEvent.useMutation({
    onSuccess: () => {
      const dest = session?.user?.role === "ORGANIZATION" ? "/org" : "/admin"
      router.push(dest)
    },
    onError: err => setErrors({ form: err.message })
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === "max_participants") {
      setFormData({ ...formData, max_participants: Number(e.target.value) })
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    create.mutate(formData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-800 to-blue-400 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-xl">
        <h2 className="mb-1 text-2xl font-bold text-gray-800">Create an Event</h2>
        <p className="mb-5 text-sm text-gray-500">Fill in the details for your volunteer opportunity</p>

        {errors.form && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-center font-semibold text-red-600 border border-red-200">{errors.form}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input type="text" name="title" value={formData.title} onChange={handleChange}
              placeholder="Event Title" className={`w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-400" : ""}`} />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <textarea name="description" value={formData.description} onChange={handleChange}
            placeholder="Description (optional)" rows={3}
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500" />

          <input type="text" name="location" value={formData.location} onChange={handleChange}
            placeholder="Location (optional)" className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500" />

          <select name="category" value={formData.category} onChange={handleChange}
            className="w-full rounded-lg border p-3 text-gray-600 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select category (optional)</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Event Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange}
              className={`w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? "border-red-400" : ""}`} />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max Volunteers</label>
            <input type="number" name="max_participants" value={formData.max_participants} onChange={handleChange}
              placeholder="How many volunteers do you need?" min={1}
              className={`w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_participants ? "border-red-400" : ""}`} />
            {errors.max_participants && <p className="mt-1 text-xs text-red-500">{errors.max_participants}</p>}
          </div>


          <button type="submit" disabled={create.isPending}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {create.isPending ? "Creating..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateEvent