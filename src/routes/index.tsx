import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Globe2, Sparkles } from "lucide-react";

import hero from "@/assets/hero-ambassador.jpg";
import meal from "@/assets/meal.jpg";
import gym from "@/assets/gym.jpg";
import { Panel, Pill, SectionTitle } from "@/components/luxe/ui";
import { magazine } from "@/lib/luxe-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AURA — Verified Global Ambassador & Personal Trainer" },
      {
        name: "description",
        content:
          "Join AURA: custom meal plans, training, daily targets, grocery lists, recipes and rewards from a verified global fitness ambassador.",
      },
      { property: "og:title", content: "AURA — Verified Global Ambassador & Personal Trainer" },
      {
        property: "og:description",
        content: "A luxury lifestyle membership: meals, training, habits, rewards and community.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  { title: "Custom meal plans", body: "Goal- and diet-aware plans regenerated daily with macros and grocery lists." },
  { title: "Training that adapts", body: "Sculpt, lean, strength or glow splits with session-by-session guidance." },
  { title: "Lifestyle assistant", body: "Habits, accountability checks and XP rewards in an installable app." },
];

function Landing() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl tracking-[0.3em]">AURA</span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-secondary"
        >
          Member access
        </Link>
      </header>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="rise">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Pill tone="gold">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified global ambassador
            </Pill>
            <Pill>
              <Globe2 className="mr-1 h-3.5 w-3.5" /> 41 countries
            </Pill>
          </div>
          <h1 className="text-5xl leading-[1.05] sm:text-6xl">
            The lifestyle studio of <span className="gold-text">Amara Vale</span> — personal trainer,
            fitness model, global ambassador.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            One membership for the whole ritual: generated meal and workout plans, daily targets,
            grocery routing, recipes, magazines and a private global community — all in a premium
            assistant that keeps working offline.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="luxe-surface rounded-full px-7 py-3 text-sm font-medium tracking-wide text-accent-foreground shimmer"
            >
              Begin membership
            </Link>
            <Link to="/dashboard" className="text-sm underline underline-offset-8">
              Preview the dashboard
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src={hero}
            alt="AURA editorial cover with silk drape, yoga mat and brass bottle"
            width={1280}
            height={1600}
            className="w-full rounded-[calc(var(--radius)+24px)] object-cover shadow-[var(--shadow-luxe)]"
          />
        </div>
      </section>

      <div className="gold-rule my-16" />

      <section>
        <SectionTitle eyebrow="The membership" title="Everything, curated" />
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map((p) => (
            <Panel key={p.title}>
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-xl">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-[calc(var(--radius)+14px)]">
          <img src={meal} alt="Luxury plated healthy meal" loading="lazy" width={1024} height={768} />
        </figure>
        <figure className="overflow-hidden rounded-[calc(var(--radius)+14px)]">
          <img src={gym} alt="Premium boutique training studio" loading="lazy" width={1024} height={768} />
        </figure>
      </section>

      <section className="mt-16">
        <SectionTitle eyebrow="AURA magazine" title="Latest issues" />
        <div className="grid gap-4 sm:grid-cols-3">
          {magazine.map((m) => (
            <Panel key={m.title}>
              <p className="eyebrow">{m.tag}</p>
              <h3 className="mt-3 text-xl leading-snug">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.excerpt}</p>
              <p className="mt-4 text-xs text-muted-foreground">{m.read}</p>
            </Panel>
          ))}
        </div>
      </section>

      <footer className="mt-20 text-xs text-muted-foreground">
        AURA · Global ambassador membership. Member data stays private by default.
      </footer>
    </main>
  );
}
