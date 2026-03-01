"use client"
import Link from "next/link"
import type { FormEvent } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "~/trpc/react"
import { signIn } from "next-auth/react"

const ROLES = [
  { value: "VOLUNTEER", label: "Volunteer", desc: "I want to find and apply for volunteer opportunities" },
  { value: "ORGANIZATION", label: "Organisation", desc: "I want to post volunteer opportunities" },
]

export default function SignUp() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [role, setRole] = useState<"VOLUNTEER" | "ORGANIZATION">("VOLUNTEER")
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (name: string, email: string, password: string) => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Name is required"
    if (!email.includes("@")) errs.email = "Valid email is required"
    if (password.length < 8) errs.password = "Password must be at least 8 characters"
    return errs
  }

  const signup = api.user.createUser.useMutation({
    onSuccess: async () => {
      if (credentials) {
        await signIn("credentials", { redirect: false, email: credentials.email, password: credentials.password })
      }
    },
    onError: async (err) => setError(err.message)
  })

  useEffect(() => {
    if (signup.isSuccess) {
      const dest = role === "ORGANIZATION" ? "/org" : "/dashboard"
      router.push(dest)
    }
  }, [signup.isSuccess, router, role])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get("name") as string ?? ""
    const email = fd.get("email") as string ?? ""
    const password = fd.get("password") as string ?? ""
    const errs = validate(name, email, password)
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setCredentials({ email, password })
    signup.mutate({ name, email, password, role })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-800 to-blue-400 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
        <h2 className="mb-1 text-center text-2xl font-bold text-gray-800">Create an Account</h2>
        <p className="mb-5 text-center text-sm text-gray-500">Join the volunteer platform</p>

        {/* Role selector */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {ROLES.map(r => (
            <button key={r.value} type="button" onClick={() => setRole(r.value as "VOLUNTEER" | "ORGANIZATION")}
              className={`rounded-xl border-2 p-3 text-left transition ${role === r.value ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-200"}`}>
              <p className="font-semibold text-gray-800 text-sm">{r.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Fields */}
        {[
          { id: "name", label: "Full Name", type: "text", placeholder: "Jane Doe" },
          { id: "email", label: "Email Address", type: "email", placeholder: "jane@example.com" },
          { id: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
        ].map(f => (
          <div key={f.id} className="mb-4">
            <label htmlFor={f.id} className="mb-1 block text-sm font-medium text-gray-700">{f.label}</label>
            <input
              id={f.id} name={f.id} type={f.type} placeholder={f.placeholder}
              className={`w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors[f.id] ? "border-red-400" : ""}`}
            />
            {fieldErrors[f.id] && <p className="mt-1 text-xs text-red-500">{fieldErrors[f.id]}</p>}
          </div>
        ))}

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-600 border border-red-200">{error}</p>}

        <button
          type="submit" disabled={signup.isPending}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {signup.isPending ? "Creating account..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-blue-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
