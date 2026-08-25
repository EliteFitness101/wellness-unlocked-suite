export type Meal = { slot: string; name: string; kcal: number; protein: number; items: string[] };
export type MealPlan = { title: string; kcal: number; meals: Meal[] };
export type Exercise = { name: string; sets: string; note: string };
export type WorkoutPlan = { title: string; focus: string; minutes: number; blocks: Exercise[] };

export type Goal = "sculpt" | "lean" | "strength" | "glow";
export type Diet = "balanced" | "plant" | "high-protein" | "low-carb";

const proteinByDiet: Record<Diet, string[]> = {
  balanced: ["wild salmon", "free-range eggs", "greek yoghurt", "chicken breast"],
  plant: ["tempeh", "lentils", "tofu", "edamame"],
  "high-protein": ["sirloin", "cod fillet", "whey isolate", "cottage cheese"],
  "low-carb": ["mackerel", "ribeye strips", "halloumi", "turkey mince"],
};

const carbByDiet: Record<Diet, string[]> = {
  balanced: ["jasmine rice", "sourdough", "sweet potato", "quinoa"],
  plant: ["wild rice", "buckwheat", "roast squash", "rye"],
  "high-protein": ["basmati", "oats", "potato", "couscous"],
  "low-carb": ["cauliflower rice", "courgette ribbons", "celeriac", "greens"],
};

const produce = ["rocket", "asparagus", "blueberries", "avocado", "kale", "figs", "pomegranate"];

const kcalTargets: Record<Goal, number> = { sculpt: 1850, lean: 1650, strength: 2400, glow: 1950 };

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length] as T;
}

export function generateMealPlan(goal: Goal, diet: Diet, day: number): MealPlan {
  const kcal = kcalTargets[goal];
  const p = proteinByDiet[diet];
  const c = carbByDiet[diet];
  const slots: Array<[string, number]> = [
    ["Sunrise", 0.24],
    ["Midday", 0.32],
    ["Golden hour", 0.14],
    ["Evening", 0.3],
  ];
  return {
    title: `${goal[0]!.toUpperCase()}${goal.slice(1)} · ${diet} day ${day + 1}`,
    kcal,
    meals: slots.map(([slot, share], i) => ({
      slot,
      name:
        i === 2
          ? `${pick(produce, day + i)} & ${pick(p, day + i + 3)} bites`
          : `${pick(p, day + i)} with ${pick(c, day + i * 2)}`,
      kcal: Math.round(kcal * share),
      protein: Math.round((kcal * share * 0.32) / 4),
      items: [pick(p, day + i), pick(c, day + i + 1), pick(produce, day + i + 2)],
    })),
  };
}

const splits: Record<Goal, Array<[string, Exercise[]]>> = {
  sculpt: [
    [
      "Glute & core sculpt",
      [
        { name: "Hip thrust", sets: "4 × 12", note: "3s eccentric" },
        { name: "Cable kickback", sets: "3 × 15", note: "squeeze at top" },
        { name: "Bulgarian split squat", sets: "3 × 10", note: "each side" },
        { name: "Hollow hold", sets: "4 × 40s", note: "ribs down" },
      ],
    ],
  ],
  lean: [
    [
      "Metabolic conditioning",
      [
        { name: "Incline walk", sets: "18 min", note: "zone 2" },
        { name: "Kettlebell swing", sets: "5 × 20", note: "hinge hard" },
        { name: "Rower intervals", sets: "8 × 250m", note: "60s rest" },
        { name: "Plank pull-through", sets: "3 × 20", note: "slow" },
      ],
    ],
  ],
  strength: [
    [
      "Heavy lower",
      [
        { name: "Back squat", sets: "5 × 5", note: "RPE 8" },
        { name: "Romanian deadlift", sets: "4 × 8", note: "brace" },
        { name: "Weighted step-up", sets: "3 × 8", note: "each side" },
        { name: "Farmer carry", sets: "4 × 40m", note: "tall spine" },
      ],
    ],
  ],
  glow: [
    [
      "Mobility & pilates flow",
      [
        { name: "Sun flow", sets: "6 min", note: "breath led" },
        { name: "Reformer-style bridge", sets: "3 × 15", note: "band" },
        { name: "Side-lying series", sets: "3 × 12", note: "each side" },
        { name: "Guided breathwork", sets: "8 min", note: "4-7-8" },
      ],
    ],
  ],
};

export function generateWorkoutPlan(goal: Goal, day: number): WorkoutPlan {
  const [focus, blocks] = splits[goal][0]!;
  return {
    title: `Day ${day + 1} · ${focus}`,
    focus,
    minutes: 38 + (day % 4) * 6,
    blocks,
  };
}

export function generateGrocery(plan: MealPlan) {
  const map = new Map<string, string>();
  plan.meals.forEach((m) =>
    m.items.forEach((i) =>
      map.set(i, produce.includes(i) ? "Produce" : i.length % 2 === 0 ? "Protein" : "Pantry"),
    ),
  );
  return [...map.entries()].map(([name, category]) => ({ name, category }));
}

export const dailyTargets = [
  { label: "Move", value: 62, target: "8,000 steps", unit: "%" },
  { label: "Protein", value: 78, target: "128 g", unit: "%" },
  { label: "Hydration", value: 45, target: "2.6 L", unit: "%" },
  { label: "Sleep", value: 88, target: "7h 45m", unit: "%" },
];

export const defaultHabits = [
  { title: "Morning ritual", icon: "sunrise", xp: 15 },
  { title: "Training session", icon: "dumbbell", xp: 30 },
  { title: "Hydration goal", icon: "droplet", xp: 10 },
  { title: "10k steps", icon: "footprints", xp: 20 },
  { title: "Evening wind-down", icon: "moon", xp: 15 },
];

export const magazine = [
  {
    tag: "The Edit",
    title: "Soft power: strength training without the burnout",
    read: "6 min",
    excerpt: "Why low-volume, high-intent lifting is reshaping how women build shape and stamina.",
  },
  {
    tag: "Nutrition",
    title: "The protein-first plate, styled beautifully",
    read: "4 min",
    excerpt: "A framework for meals that hit macros while still feeling like a restaurant plate.",
  },
  {
    tag: "Recovery",
    title: "Cold, heat and the ritual of resetting",
    read: "5 min",
    excerpt: "Contrast therapy protocols that actually fit into a working week.",
  },
];

export const places = [
  { name: "Verdura Market", kind: "Grocery", distance: "0.6 km", note: "Organic produce · open till 22:00" },
  { name: "Iron & Ivory Gym", kind: "Gym", distance: "1.2 km", note: "24h · premium free weights" },
  { name: "Atelier Activewear", kind: "Accessories", distance: "1.9 km", note: "Fitting studio on site" },
  { name: "Nordwell Supplements", kind: "Wellness", distance: "2.4 km", note: "Third-party tested stock" },
  { name: "Casa Verde Deli", kind: "Grocery", distance: "2.8 km", note: "Meal-prep counter" },
  { name: "Reset Recovery Spa", kind: "Wellness", distance: "3.1 km", note: "Contrast suites · sauna" },
];

export const tabs = [
  "Today",
  "Meals",
  "Training",
  "Grocery",
  "Recipes",
  "Nearby",
  "Rewards",
  "Community",
  "Magazine",
] as const;

export type SubscriberTab = (typeof tabs)[number];

/** Canonical revenue allocation — enforced in the database (revenue_ledger). */
export const AMBASSADOR_SHARE = 0.4;
export const AGENCY_SHARE = 0.6;
export const AGENCY_SHARE_LABEL = "Agency Logistics & System Integrity";
