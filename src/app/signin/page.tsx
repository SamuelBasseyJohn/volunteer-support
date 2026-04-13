"use client"
import Link from "next/link";
import { useEffect, useActionState } from "react";
import { loginAction } from "../_utils/login";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignIn() {
  const router = useRouter()
  const [formState, formAction] = useActionState(loginAction, null);
  const { update } = useSession()

  useEffect(() => {
    if (formState?.success) {
      update().then(updated => {
        const role = updated?.user?.role
        if (role === "ADMIN") router.push("/admin")
        else if (role === "ORGANIZATION") router.push("/org")
        else router.push("/dashboard")
      }).catch(() => router.push("/dashboard"))
    }
  }, [formState, router, update])


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-800 to-blue-400">
      <form action={formAction} className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm mx-4">
        <h2 className="text-xl font-semibold text-center mb-4">Sign In Here</h2>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="email">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="janedoe@gmail.com"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">
          Sign In
        </button>

        <p className="text-center text-gray-700 font-bold text-sm mt-4">
          New to this platform? <Link href="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
        </p>

        {/* Display error message if login fails */}
        {formState?.error && <p className="text-center text-red-500 font-semibold text-sm mt-1">
          {formState.error}
        </p>}
      </form>
    </div>
  );
}
