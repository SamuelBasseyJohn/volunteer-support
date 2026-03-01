"use server"
import { signIn } from "~/server/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  prevState: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      redirect: false,
      email: formData.get("email") as string,
      password: formData.get("password") as string
    })
    return { success: true }
  } catch (err) {
    // Re-throw Next.js internals like NEXT_REDIRECT so the framework handles them
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    console.error("Login error:", err)
    return { error: "Something went wrong. Please try again." }
  }
}