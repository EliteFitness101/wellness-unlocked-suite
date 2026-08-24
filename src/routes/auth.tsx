import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Panel } from "@/components/luxe/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Member Access — AURA" },
      { name: "description", content: "Sign in or create your AURA membership account." },
      { property: "og:title", content: "Member Access — AURA" },
      { property: "og:description", content: "Sign in or create your AURA membership account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Membership created. Welcome to AURA.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link to="/" className="mb-8 text-center font-display text-2xl tracking-[0.3em]">
        AURA
      </Link>
      <Panel glow>
        <h1 className="text-3xl">{mode === "signin" ? "Member access" : "Create membership"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Your plans, habits and rewards are waiting."
            : "Set up your private lifestyle assistant in seconds."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          ) : null}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={busy}
            className="luxe-surface w-full rounded-full py-3 text-sm font-medium tracking-wide text-accent-foreground disabled:opacity-60"
          >
            {busy ? "One moment…" : mode === "signin" ? "Enter AURA" : "Create membership"}
          </button>
        </form>

        <button
          onClick={google}
          className="mt-3 w-full rounded-full border border-border py-3 text-sm transition-colors hover:bg-secondary"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-xs text-muted-foreground underline underline-offset-4"
        >
          {mode === "signin" ? "No membership yet? Create one" : "Already a member? Sign in"}
        </button>
      </Panel>
    </main>
  );
}
