/*
 * Applying the student's set-up to companies: per-company roll-ups, the directory sorts,
 * and the "first 3 doors" shown after set-up. Rule-based; nothing here ranks students.
 */
import type { Company, Priority, Profile, Role } from "../data/types";
import {
  CONTACT_LOAD_NUDGE,
  cbsTieCount,
  functionsHired,
  jobTypes,
  liveRoles,
  newRoles30d,
  peopleCards,
  stepUp,
  visaRollup,
  type Db,
  type PersonCardData,
} from "./compute";

export interface CompanyRow {
  c: Company;
  ties: number;
  cards: PersonCardData[];
  best: PersonCardData | null; // warmest person, skipping anyone busy this week when possible
  hired: string[];
  types: string[];
  visa: ReturnType<typeof visaRollup>;
  live: Role[];
  targetRoles: Role[]; // live roles in the student's target functions
  newRoles: number;
}

export function companyRows(db: Db & { companies: Company[]; roles: Role[] }, profile: Profile | null): CompanyRow[] {
  const targets = profile?.targetFunctions ?? [];
  return db.companies.map((c) => {
    const cards = peopleCards(c.id, profile, db);
    const live = liveRoles(c.id, db.roles);
    const targetRoles = live
      .filter((r) => targets.includes(r.functionId))
      .sort((a, b) => Number(profile?.needsVisa && a.visaStated === "No") - Number(profile?.needsVisa && b.visaStated === "No"));
    const notBusy = cards.find((p) => p.msgs7 < CONTACT_LOAD_NUDGE && p.tie.strength === cards[0]?.tie.strength);
    return {
      c,
      ties: cbsTieCount(c.id, db),
      cards,
      best: notBusy ?? cards[0] ?? null,
      hired: functionsHired(c, db.roles),
      types: jobTypes(c.id, db.roles),
      visa: visaRollup(c.id, db.roles),
      live,
      targetRoles,
      newRoles: newRoles30d(c.id, db.roles),
    };
  });
}

export const SORTS: { id: string; label: string; priority?: Priority }[] = [
  { id: "warmth", label: "Warmest intro for you", priority: "warmth" },
  { id: "fit", label: "Best role fit", priority: "fit" },
  { id: "raised", label: "Most raised", priority: "funding" },
  { id: "stepup", label: "Biggest step-up", priority: "momentum" },
  { id: "ties", label: "Most CBS ties" },
  { id: "round", label: "Most recent round" },
];
export const sortForPriority = (p: Priority | undefined) => SORTS.find((s) => s.priority === (p ?? "warmth"))!.id;

export function sortRows(rows: CompanyRow[], sort: string) {
  const by: Record<string, (a: CompanyRow, b: CompanyRow) => number> = {
    warmth: (a, b) => (b.best?.tie.strength ?? 0) - (a.best?.tie.strength ?? 0) || b.targetRoles.length - a.targetRoles.length || b.ties - a.ties,
    fit: (a, b) => b.targetRoles.length - a.targetRoles.length || (b.best?.tie.strength ?? 0) - (a.best?.tie.strength ?? 0),
    raised: (a, b) => b.c.totalRaised - a.c.totalRaised,
    stepup: (a, b) => (stepUp(b.c) ?? 0) - (stepUp(a.c) ?? 0) || (b.c.headcountGrowth6m ?? 0) - (a.c.headcountGrowth6m ?? 0),
    ties: (a, b) => b.ties - a.ties || (b.best?.tie.strength ?? 0) - (a.best?.tie.strength ?? 0),
    round: (a, b) => b.c.lastRoundDate.localeCompare(a.c.lastRoundDate),
  };
  const cmp = by[sort] ?? by.warmth;
  return [...rows].sort((a, b) => cmp(a, b) || a.c.name.localeCompare(b.c.name));
}

export interface Door {
  row: CompanyRow;
  person: PersonCardData;
  role: Role | null;
}

/**
 * Your first 3 doors (A1): companies hiring for a target function, each with the warmest person
 * who isn't already getting 5+ CBS messages this week. If a student needs sponsorship, companies
 * whose target roles all state "no" are left out.
 */
export function firstDoors(rows: CompanyRow[], profile: Profile | null, n = 3): Door[] {
  const eligible = rows
    .filter((r) => r.best && !(profile?.needsVisa && r.targetRoles.length && r.targetRoles.every((x) => x.visaStated === "No")))
    .map((r) => ({ ...r, best: doorPerson(r) }));
  const score = (r: CompanyRow) => [
    r.targetRoles.length ? 1 : 0,
    r.best!.msgs7 < CONTACT_LOAD_NUDGE ? 1 : 0,
    r.best!.tie.strength,
    r.targetRoles.length,
    -r.best!.msgs7,
  ];
  const ranked = [...eligible].sort((a, b) => {
    const sa = score(a), sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sb[i] !== sa[i]) return sb[i] - sa[i];
    return b.c.lastRoundDate.localeCompare(a.c.lastRoundDate);
  });
  return ranked.slice(0, n).map((row) => ({ row, person: row.best!, role: row.targetRoles[0] ?? null }));
}

/** The person to suggest first: the warmest one not already at 5+ messages this week (spreads outreach, K5). */
function doorPerson(r: CompanyRow) {
  return r.cards.find((p) => p.msgs7 < CONTACT_LOAD_NUDGE && p.tie.strength >= 2) ?? r.best;
}
