"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type App = {
  id: string;
  slug: string;
  name: string | null;
  description?: string | null;
};

export default function Home() {
  const router = useRouter();
  const [apps, setApps] = useState<App[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // getSession() waits for the client to finish initializing, which includes
    // exchanging the ?code= from the magic-link redirect for a session.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      // RLS limits rows to apps the user's org can access.
      const { data, error } = await supabase
        .from("apps")
        .select("*");

      if (error) setError(error.message);
      else
        setApps(
          (data as App[]).sort((a, b) =>
            (a.name ?? a.slug).localeCompare(b.name ?? b.slug),
          ),
        );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    await createClient().auth.signOut();
  }

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Your apps
          </h1>
          <button
            onClick={signOut}
            className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign out
          </button>
        </header>

        {error && <p className="text-red-600">{error}</p>}

        {!error && apps === null && (
          <p className="text-zinc-500">Loading…</p>
        )}

        {apps?.length === 0 && (
          <p className="text-zinc-500">
            Your organization doesn’t have access to any apps yet.
          </p>
        )}

        {apps && apps.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/apps/${app.slug}`}
                  className="block h-full rounded-xl border border-black/[.08] bg-white p-6 transition-colors hover:border-black/[.3] dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/[.4]"
                >
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                    {app.name ?? app.slug}
                  </h2>
                  {app.description && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {app.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
