"use client";
/**
 * VIEW LAYER — HomePage Component
 *
 * Landing page for the application.
 * - Authenticated volunteers see the hero with latest events.
 * - Organisation users are redirected to /org.
 * - Unauthenticated visitors see the marketing landing page with CTAs.
 */
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LatestEvents } from "~/views/components/LatestEvents";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: "🤝",
    title: "Find Opportunities",
    desc: "Browse hundreds of volunteer events filtered by skill, location, and date.",
  },
  {
    icon: "🏆",
    title: "Track Your Impact",
    desc: "See your accepted events and application status in your personal dashboard.",
  },
  {
    icon: "🏢",
    title: "For Organisations",
    desc: "Post opportunities, review applicants, and confirm attendance all in one place.",
  },
];

const HomePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role === "ORGANIZATION") router.replace("/org");
  }, [session, router]);

  if (status === "loading" || session?.user?.role === "ORGANIZATION") return null;

  if (session) {
    // Authenticated: hero + latest events
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] bg-gradient-to-b from-blue-800 to-blue-400 text-white px-6">
        <h1 className="text-5xl font-bold text-center mb-3">Volunteer Support</h1>
        <p className="text-xl text-blue-100 text-center mb-8">
          Allow us to find the right volunteers for you!
        </p>
        <section className="w-full">
          <LatestEvents />
        </section>
      </div>
    );
  }

  // Unauthenticated: marketing landing page
  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-blue-900 via-blue-700 to-blue-400 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm border border-white/20">
          ✨ Making volunteering easier for everyone
        </div>
        <h1 className="text-6xl font-extrabold leading-tight tracking-tight mb-5 max-w-3xl">
          Connect{" "}
          <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
            Volunteers
          </span>{" "}
          with the People who need them
        </h1>
        <p className="max-w-xl text-lg text-blue-100 mb-10">
          Whether you want to give your time or find skilled volunteers for your
          organisation, Volunteer Support is the platform that brings you together.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="group relative overflow-hidden rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <span className="relative z-10">Get Started — Sign Up</span>
            <span className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-white opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <Link
            href="/signin"
            className="rounded-xl border-2 border-white/60 bg-white/10 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white hover:bg-white/20"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white/10 border border-white/20 p-6 backdrop-blur-sm transition hover:bg-white/15 hover:scale-[1.02] duration-200"
            >
              <span className="text-4xl">{f.icon}</span>
              <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-blue-100 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="border-t border-white/20 bg-white/5 px-6 py-12 text-center">
        <h2 className="text-3xl font-bold mb-2">Ready to make a difference?</h2>
        <p className="text-blue-100 mb-7">
          Join thousands of volunteers and organisations already on the platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup?role=VOLUNTEER"
            className="rounded-xl bg-white px-7 py-3 font-semibold text-blue-700 shadow hover:scale-105 transition"
          >
            Join as Volunteer
          </Link>
          <Link
            href="/signup?role=ORGANIZATION"
            className="rounded-xl border-2 border-white/60 bg-transparent px-7 py-3 font-semibold text-white hover:scale-105 hover:bg-white/10 transition"
          >
            Register Organisation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
