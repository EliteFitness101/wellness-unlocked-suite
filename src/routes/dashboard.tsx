import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Flame,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, themeLabels, type ThemeSkin } from "@/lib/theme";
import { Panel, Pill, Ring, SectionTitle, Stat } from "@/components/luxe/ui";
import {
  dailyTargets,
  defaultHabits,
  generateGrocery,
  generateMealPlan,
  generateWorkoutPlan,
  magazine,
  places,
  tabs,
  type Diet,
  type Goal,
  type SubscriberTab,
} from "@/lib/luxe-data";
import magazineArt from "@/assets/magazine.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Member Dashboard — AURA" },
      {
        name: "description",
        content:
          "Your AURA lifestyle assistant: daily targets, habits, meal and training plans, grocery list, recipes, rewards and community.",
      },
      { property: "og:title", content: "Member Dashboard — AURA" },
      { property: "og:description", content: "Daily targets, plans, habits and rewards in one place." },
    ],
  }),
  component: Dashboard,
});

type HabitRow = { id: string; title: string; xp_reward: number };
type GroceryRow = { id: string; name: string; category: string; checked: boolean };
type PostRow = { id: string; body: string; is_anonymous: boolean; created_at: string; user_id: string };

function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<SubscriberTab>("Today");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.theme) setTheme(profile.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  const chooseTheme = async (t: ThemeSkin) => {
    setTheme(t);
    if (user) {
      await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
      void refreshProfile();
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="eyebrow">Preparing your studio…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-8">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="eyebrow">Member studio</p>
          <h1 className="text-2xl">{profile?.display_name ?? "Member"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="gold">{profile?.xp ?? 0} XP</Pill>
          <Pill>
            <Flame className="mr-1 h-3.5 w-3.5" />
            {profile?.streak ?? 0} day streak
          </Pill>
          {isAdmin ? (
            <Link
              to="/admin"
              className="rounded-full border border-border px-3 py-1.5 text-xs tracking-wide"
            >
              <LayoutDashboard className="mr-1 inline h-3.5 w-3.5" /> Admin
            </Link>
          ) : null}
          <button
            onClick={async () => {
              await signOut();
              void navigate({ to: "/" });
            }}
            className="rounded-full border border-border p-2"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs tracking-[0.15em] uppercase transition-colors ${
              tab === t
                ? "luxe-surface text-accent-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-6 space-y-6 rise" key={tab}>
        {tab === "Today" && <TodayTab userId={user.id} onXp={refreshProfile} />}
        {tab === "Meals" && <MealsTab userId={user.id} />}
        {tab === "Training" && <TrainingTab userId={user.id} />}
        {tab === "Grocery" && <GroceryTab userId={user.id} />}
        {tab === "Recipes" && <RecipesTab userId={user.id} />}
        {tab === "Nearby" && <NearbyTab />}
        {tab === "Rewards" && <RewardsTab userId={user.id} code={profile?.referral_code ?? ""} xp={profile?.xp ?? 0} />}
        {tab === "Community" && <CommunityTab userId={user.id} isPublic={profile?.is_public ?? false} />}
        {tab === "Magazine" && <MagazineTab />}
      </div>

      <Panel className="mt-8">
        <SectionTitle eyebrow="Personalisation" title="Studio theme" />
        <div className="flex flex-wrap gap-2">
          {(["feminine", "masculine", "neutral"] as ThemeSkin[]).map((t) => (
            <button
              key={t}
              onClick={() => chooseTheme(t)}
              className={`rounded-full px-4 py-2 text-xs tracking-wide ${
                theme === t ? "luxe-surface text-accent-foreground" : "border border-border"
              }`}
            >
              {themeLabels[t]}
            </button>
          ))}
        </div>
      </Panel>
    </main>
  );
}

function TodayTab({ userId, onXp }: { userId: string; onXp: () => void }) {
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void (async () => {
      let { data } = await supabase.from("habits").select("id,title,xp_reward").eq("user_id", userId);
      if (!data || data.length === 0) {
        await supabase.from("habits").insert(
          defaultHabits.map((h) => ({
            user_id: userId,
            title: h.title,
            icon: h.icon,
            xp_reward: h.xp,
          })),
        );
        ({ data } = await supabase.from("habits").select("id,title,xp_reward").eq("user_id", userId));
      }
      setHabits(data ?? []);
      const { data: logs } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", userId)
        .eq("log_date", today);
      setDone(Object.fromEntries((logs ?? []).map((l) => [l.habit_id, true])));
    })();
  }, [userId, today]);

  const complete = async (h: HabitRow) => {
    if (done[h.id]) return;
    setDone((d) => ({ ...d, [h.id]: true }));
    await supabase.from("habit_logs").insert({ user_id: userId, habit_id: h.id, log_date: today });
    const { data: p } = await supabase.from("profiles").select("xp,streak").eq("id", userId).maybeSingle();
    await supabase
      .from("profiles")
      .update({ xp: (p?.xp ?? 0) + h.xp_reward, streak: Math.max(p?.streak ?? 0, 1) })
      .eq("id", userId);
    toast.success(`+${h.xp_reward} XP · ${h.title}`);
    onXp();
  };

  const completion = habits.length
    ? Math.round((Object.values(done).filter(Boolean).length / habits.length) * 100)
    : 0;

  return (
    <>
      <Panel glow>
        <SectionTitle eyebrow="Daily targets" title="Today at a glance" />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {dailyTargets.map((t) => (
            <Ring key={t.label} value={t.value} label={t.label} sub={t.target} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <SectionTitle eyebrow="Habits" title="Rituals" action={<Pill tone="gold">{completion}% done</Pill>} />
          <ul className="space-y-2">
            {habits.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-border px-4 py-3"
              >
                <span className="text-sm">{h.title}</span>
                <button
                  onClick={() => complete(h)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    done[h.id] ? "luxe-surface text-accent-foreground" : "border border-border"
                  }`}
                  aria-label={`Complete ${h.title}`}
                >
                  <Check className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Accountability" title="Your assistant" />
          <p className="text-sm text-muted-foreground">
            {completion >= 80
              ? "Exceptional day. Protein is on track — keep the evening wind-down and you hold the streak."
              : completion >= 40
                ? "Halfway. Book the training block now and the rest of the day follows."
                : "Start with hydration and the morning ritual — smallest step, biggest compounding."}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Plan regenerates at 05:00 local time
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> 3 grocery stops within 3 km
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}

function MealsTab({ userId }: { userId: string }) {
  const [goal, setGoal] = useState<Goal>("sculpt");
  const [diet, setDiet] = useState<Diet>("balanced");
  const [day, setDay] = useState(0);
  const plan = useMemo(() => generateMealPlan(goal, diet, day), [goal, diet, day]);

  const save = async () => {
    await supabase.from("plans").insert({
      user_id: userId,
      kind: "meal",
      title: plan.title,
      payload: JSON.parse(JSON.stringify(plan)),
    });
    toast.success("Meal plan saved");
  };

  const toGrocery = async () => {
    const items = generateGrocery(plan);
    await supabase
      .from("grocery_items")
      .insert(items.map((i) => ({ user_id: userId, name: i.name, category: i.category })));
    toast.success(`${items.length} items added to grocery list`);
  };

  return (
    <Panel glow>
      <SectionTitle
        eyebrow="Generated"
        title="Meal plan"
        action={<Pill tone="gold">{plan.kcal} kcal</Pill>}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["sculpt", "lean", "strength", "glow"] as Goal[]).map((g) => (
          <Chip key={g} active={goal === g} onClick={() => setGoal(g)} label={g} />
        ))}
        <span className="w-full" />
        {(["balanced", "plant", "high-protein", "low-carb"] as Diet[]).map((d) => (
          <Chip key={d} active={diet === d} onClick={() => setDiet(d)} label={d} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {plan.meals.map((m) => (
          <div key={m.slot} className="rounded-[var(--radius)] border border-border p-4">
            <p className="eyebrow">{m.slot}</p>
            <p className="mt-1 font-display text-xl capitalize">{m.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.kcal} kcal · {m.protein}g protein
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Action onClick={() => setDay((d) => d + 1)}>Regenerate day</Action>
        <Action onClick={save}>Save plan</Action>
        <Action onClick={toGrocery}>Send to grocery list</Action>
      </div>
    </Panel>
  );
}

function TrainingTab({ userId }: { userId: string }) {
  const [goal, setGoal] = useState<Goal>("sculpt");
  const [day, setDay] = useState(0);
  const plan = useMemo(() => generateWorkoutPlan(goal, day), [goal, day]);

  const save = async () => {
    await supabase.from("plans").insert({
      user_id: userId,
      kind: "workout",
      title: plan.title,
      payload: JSON.parse(JSON.stringify(plan)),
    });
    toast.success("Training plan saved");
  };

  return (
    <Panel glow>
      <SectionTitle eyebrow="Generated" title={plan.title} action={<Pill>{plan.minutes} min</Pill>} />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["sculpt", "lean", "strength", "glow"] as Goal[]).map((g) => (
          <Chip key={g} active={goal === g} onClick={() => setGoal(g)} label={g} />
        ))}
      </div>
      <ul className="space-y-2">
        {plan.blocks.map((b) => (
          <li
            key={b.name}
            className="flex items-center justify-between rounded-[var(--radius)] border border-border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.note}</p>
            </div>
            <span className="font-display text-lg">{b.sets}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2">
        <Action onClick={() => setDay((d) => d + 1)}>Next session</Action>
        <Action onClick={save}>Save plan</Action>
      </div>
    </Panel>
  );
}

function GroceryTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<GroceryRow[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("grocery_items")
      .select("id,name,category,checked")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("grocery_items").insert({ user_id: userId, name: name.trim() });
    setName("");
    void load();
  };

  const toggle = async (i: GroceryRow) => {
    await supabase.from("grocery_items").update({ checked: !i.checked }).eq("id", i.id);
    void load();
  };

  const remove = async (id: string) => {
    await supabase.from("grocery_items").delete().eq("id", id);
    void load();
  };

  return (
    <Panel glow>
      <SectionTitle eyebrow="Shopping" title="Grocery list" action={<Pill>{items.length} items</Pill>} />
      <div className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an item"
          className="flex-1 rounded-[var(--radius)] border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Action onClick={add}>
          <Plus className="h-4 w-4" />
        </Action>
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-[var(--radius)] border border-border px-4 py-3"
          >
            <button onClick={() => toggle(i)} className="flex items-center gap-3 text-left">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  i.checked ? "luxe-surface text-accent-foreground" : "border border-border"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className={`text-sm capitalize ${i.checked ? "line-through opacity-60" : ""}`}>
                {i.name}
              </span>
            </button>
            <div className="flex items-center gap-3">
              <Pill>{i.category}</Pill>
              <button onClick={() => remove(i.id)} aria-label="Remove">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Empty — generate a meal plan and send it here in one tap.
          </p>
        ) : null}
      </ul>
    </Panel>
  );
}

function RecipesTab({ userId }: { userId: string }) {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [saved, setSaved] = useState<Array<{ id: string; title: string }>>([]);

  const load = async () => {
    const { data } = await supabase
      .from("recipes")
      .select("id,title")
      .order("created_at", { ascending: false })
      .limit(12);
    setSaved(data ?? []);
  };
  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!title.trim()) return;
    await supabase.from("recipes").insert({
      user_id: userId,
      title: title.trim(),
      ingredients: ingredients.split("\n").filter(Boolean),
      steps: steps.split("\n").filter(Boolean),
    });
    setTitle("");
    setIngredients("");
    setSteps("");
    toast.success("Recipe saved");
    void load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel glow>
        <SectionTitle eyebrow="Create" title="Recipe builder" />
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe name"
            className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            placeholder={"Ingredients, one per line"}
            className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={4}
            placeholder={"Method, one step per line"}
            className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Action onClick={save}>Save recipe</Action>
        </div>
      </Panel>
      <Panel>
        <SectionTitle eyebrow="Library" title="Recipes" />
        <ul className="space-y-2">
          {saved.map((r) => (
            <li key={r.id} className="rounded-[var(--radius)] border border-border px-4 py-3 text-sm">
              {r.title}
            </li>
          ))}
          {saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          ) : null}
        </ul>
      </Panel>
    </div>
  );
}

function NearbyTab() {
  const [filter, setFilter] = useState("All");
  const kinds = ["All", "Grocery", "Gym", "Accessories", "Wellness"];
  const list = places.filter((p) => filter === "All" || p.kind === filter);
  return (
    <Panel glow>
      <SectionTitle eyebrow="Routing" title="Nearest to you" />
      <div className="mb-4 flex flex-wrap gap-2">
        {kinds.map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)} label={k} />
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.name} className="rounded-[var(--radius)] border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-xl">{p.name}</p>
              <Pill>{p.distance}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
            <a
              className="mt-3 inline-flex items-center gap-1 text-xs underline underline-offset-4"
              href={`https://www.google.com/maps/search/${encodeURIComponent(p.name)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin className="h-3.5 w-3.5" /> Route me
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function RewardsTab({ userId, code, xp }: { userId: string; code: string; xp: number }) {
  const [referrals, setReferrals] = useState<Array<{ id: string; referred_email: string | null; status: string }>>(
    [],
  );
  const [email, setEmail] = useState("");
  const tiers = [
    { name: "Rose", at: 0 },
    { name: "Orchid", at: 500 },
    { name: "Gold", at: 1500 },
    { name: "Platinum", at: 4000 },
  ];
  const next = tiers.find((t) => t.at > xp) ?? tiers[tiers.length - 1]!;

  const load = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("id,referred_email,status")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });
    setReferrals(data ?? []);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const invite = async () => {
    if (!email.trim()) return;
    await supabase.from("referrals").insert({ referrer_id: userId, referred_email: email.trim() });
    setEmail("");
    toast.success("Invitation recorded");
    void load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel glow>
        <SectionTitle eyebrow="Rewards" title="XP & tiers" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total XP" value={String(xp)} accent />
          <Stat label="Next tier" value={next.name} hint={`${Math.max(next.at - xp, 0)} XP to go`} />
        </div>
        <div className="mt-5 space-y-2">
          {tiers.map((t) => (
            <div key={t.name} className="flex items-center justify-between text-sm">
              <span>{t.name}</span>
              <span className={xp >= t.at ? "gold-text font-medium" : "text-muted-foreground"}>
                {t.at} XP
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <SectionTitle eyebrow="Referrals" title="Invite & earn" />
        <div className="rounded-[var(--radius)] border border-border p-4">
          <p className="eyebrow">Your code</p>
          <p className="mt-1 font-display text-2xl tracking-[0.2em]">{code || "—"}</p>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${code}`);
              toast.success("Referral link copied");
            }}
            className="mt-3 inline-flex items-center gap-2 text-xs underline underline-offset-4"
          >
            <Share2 className="h-3.5 w-3.5" /> Copy invite link
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite by email"
            className="flex-1 rounded-[var(--radius)] border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Action onClick={invite}>Invite</Action>
        </div>
        <ul className="mt-4 space-y-2">
          {referrals.map((r) => (
            <li key={r.id} className="flex justify-between text-sm">
              <span>{r.referred_email}</span>
              <Pill>{r.status}</Pill>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function CommunityTab({ userId, isPublic }: { userId: string; isPublic: boolean }) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(!isPublic);

  const load = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("id,body,is_anonymous,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts(data ?? []);
  };
  useEffect(() => {
    void load();
  }, []);

  const post = async () => {
    if (!body.trim()) return;
    await supabase
      .from("community_posts")
      .insert({ user_id: userId, body: body.trim(), is_anonymous: anon });
    setBody("");
    void load();
  };

  return (
    <Panel glow>
      <SectionTitle eyebrow="Global members" title="Community" />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Share a win, a question, or a check-in"
        className="w-full rounded-[var(--radius)] border border-input bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          Post privately as a member
        </label>
        <Action onClick={post}>Share</Action>
      </div>
      <ul className="mt-5 space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-[var(--radius)] border border-border p-4">
            <p className="eyebrow">
              {p.is_anonymous ? "AURA member" : p.user_id === userId ? "You" : "Member"} ·{" "}
              {new Date(p.created_at).toLocaleDateString()}
            </p>
            <p className="mt-2 text-sm">{p.body}</p>
          </li>
        ))}
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to open the conversation.</p>
        ) : null}
      </ul>
    </Panel>
  );
}

function MagazineTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <figure className="overflow-hidden rounded-[calc(var(--radius)+14px)]">
        <img src={magazineArt} alt="AURA magazine artwork" loading="lazy" width={1024} height={768} />
      </figure>
      <div className="space-y-3">
        {magazine.map((m) => (
          <Panel key={m.title}>
            <p className="eyebrow">
              {m.tag} · {m.read}
            </p>
            <h3 className="mt-2 text-2xl leading-snug">{m.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{m.excerpt}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs capitalize tracking-wide ${
        active ? "luxe-surface text-accent-foreground" : "border border-border text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors hover:bg-secondary"
    >
      {children}
    </button>
  );
}
