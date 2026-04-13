"use client";
/**
 * VIEW LAYER — NavBar Component
 *
 * Top navigation bar. Shows role-appropriate links for authenticated
 * users and a brand name for unauthenticated visitors.
 */
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 bg-[#F5F3F3] px-6 py-4">
      {/* Brand / Welcome */}
      <Link
        href="/"
        className="text-lg font-semibold text-gray-800 transition hover:text-[#2093D6]"
      >
        {!session
          ? "Volunteer Support"
          : `Welcome, ${session.user.name ?? session.user.email}`}
      </Link>

      {/* Authenticated nav links only */}
      {session && (
        <div className="flex flex-wrap items-center gap-5">
          {role === "VOLUNTEER" && (
            <>
              <Link href="/" className="text-black transition hover:text-[#2093D6]">Home</Link>
              <Link href="/allEvents" className="text-black transition hover:text-[#2093D6]">Browse Events</Link>
              <Link href="/dashboard" className="text-black transition hover:text-[#2093D6]">My Applications</Link>
              <Link href="/acceptedEvents" className="text-black transition hover:text-[#2093D6]">Accepted Events</Link>
              <Link href="/profile" className="text-black transition hover:text-[#2093D6]">My Profile</Link>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <Link href="/" className="text-black transition hover:text-[#2093D6]">Home</Link>
              <Link href="/allEvents" className="text-black transition hover:text-[#2093D6]">All Events</Link>
              <Link href="/admin" className="text-black transition hover:text-[#2093D6]">Admin Panel</Link>
              <Link href="/createEvent" className="text-black transition hover:text-[#2093D6]">Create Event</Link>
              <Link href="/profile" className="text-black transition hover:text-[#2093D6]">Profile</Link>
            </>
          )}

          {role === "ORGANIZATION" && (
            <>
              <Link href="/org" className="text-black transition hover:text-[#2093D6]">Dashboard</Link>
              <Link href="/createEvent" className="text-black transition hover:text-[#2093D6]">Post Opportunity</Link>
              <Link href="/profile" className="text-black transition hover:text-[#2093D6]">Profile</Link>
            </>
          )}

          <button
            onClick={() => signOut({ redirectTo: "/" })}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
