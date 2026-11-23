/*
 * Computed values from BRD Section 6. Nothing here uses AI and nothing ranks students.
 *  - Role status: Live if verified in the last 14 days, Unverified if not, Closed once gone.
 *  - Company roll-ups: job types and visa stated, from live roles only.
 *  - Momentum facts: months since last round, step-up vs prior round. Facts only, no score.
 *  - CBS Ties: people with a current position who are CBS alumni or campus speakers
 *    (the same count for every student).
 *  - Tie Strength: CBS link (alum 2, speaker 1) + shared ground (shared past employer 2,
 *    spoke at a club the student is in 1). Strong 3–4, Warm 2, Light 1; 0 is hidden.
 *    Equal scores are ordered by fewer messages in the last 7 days.
 */
import type {
  Affiliation,
  Company,
  Interaction,
  Person,
  Position,
  Profile,
  Role,
  VisaStated,
} from "../data/types";
import { clubShort, EMPLOYERS } from "../data/helpers";

export const DAY = 86_400_000;
export const UNVERIFIED_AFTER_DAYS = 14;
export const CONTACT_LOAD_NUDGE = 5;

export const daysSince = (iso: string, now = new Date()) =>
  Math.floor((now.getTime() - new Date(iso.length === 10 ? iso + "T12:00:00" : iso).getTime()) / DAY);

/* ---------- Roles ---------- */
export type RoleStatus = "Live" | "Unverified" | "Closed";
export function roleStatus(r: Role, now = new Date()): RoleStatus {
  if (r.closed) return "Closed";
  return daysSince(r.lastVerified, now) <= UNVERIFIED_AFTER_DAYS ? "Live" : "Unverified";
}

/* ---------- Company roll-ups ---------- */
export function liveRoles(companyId: string, roles: Role[]) {
  return roles.filter((r) => r.companyId === companyId && roleStatus(r) === "Live");
}
export function openRoles(companyId: string, roles: Role[]) {
  return roles.filter((r) => r.companyId === companyId && roleStatus(r) !== "Closed");
}
export function jobTypes(companyId: string, roles: Role[]) {
  return [...new Set(liveRoles(companyId, roles).map((r) => r.jobType))];
}
export function visaRollup(companyId: string, roles: Role[]): VisaStated {
  const live = liveRoles(companyId, roles);
  if (live.some((r) => r.visaStated === "Yes")) return "Yes";
  if (live.some((r) => r.visaStated === "No")) return "No";
  return "Not stated";
}
export function functionsHired(c: Company, roles: Role[]) {
  return [...new Set([...c.hiringAreas, ...liveRoles(c.id, roles).map((r) => r.functionId)])];
}

/* ---------- Funding (Q1, Q2) ---------- */
export const FUNDING_BANDS = [
  { id: "50", label: "$50M+ raised", min: 50 },
  { id: "150", label: "$150M+ raised", min: 150 },
  { id: "500", label: "$500M+ raised", min: 500 },
] as const;
export const UNICORN = 1000; // valuation in USD millions

/** New business roles first seen in the last 30 days (Q3). */
export function newRoles30d(companyId: string, roles: Role[], now = new Date()) {
  return roles.filter((r) => r.companyId === companyId && !r.closed && daysSince(r.firstSeen, now) <= 30).length;
}

/* ---------- Momentum ---------- */
export function monthsSinceRound(c: Company, now = new Date()) {
  const d = new Date(c.lastRoundDate + "T12:00:00");
  let m = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) m -= 1;
  return Math.max(0, m);
}
export function stepUp(c: Company): number | null {
  if (!c.priorRoundSize) return null;
  return c.lastRoundSize / c.priorRoundSize;
}

/* ---------- People ---------- */
export interface Db {
  people: Person[];
  positions: Position[];
  affiliations: Affiliation[];
  interactions: Interaction[];
}

export function currentPosition(personId: string, positions: Position[]) {
  return positions.find((p) => p.personId === personId && p.current);
}
export function peopleAt(companyId: string, db: Db) {
  return db.positions
    .filter((p) => p.companyId === companyId && p.current)
    .map((pos) => ({ person: db.people.find((x) => x.id === pos.personId)!, position: pos }))
    .filter((x) => x.person && !x.person.optedOut);
}
export const isAlum = (p: Person) => !!p.cbsClassYear;
export const affsOf = (personId: string, affs: Affiliation[]) => affs.filter((a) => a.personId === personId);

/** People with a current position here who are CBS alumni or campus/club speakers. Same for every student. */
export function cbsTieCount(companyId: string, db: Db) {
  return peopleAt(companyId, db).filter(({ person }) => isAlum(person) || affsOf(person.id, db.affiliations).length > 0).length;
}

/**
 * "Likely to respond" and "Busy this week" tags (L1). Tags only, never a percentage.
 * Likely: at least 5 logged messages, at least 30% answered, and a reply in the last 30 days.
 * Busy: 5+ CBS messages this week; it replaces "Likely" so responsive people aren't overloaded.
 */
export const LIKELY_MIN_MESSAGES = 5;
export function responsiveness(personId: string, interactions: Interaction[], now = new Date()) {
  const mine = interactions.filter((i) => i.personId === personId);
  const sent = mine.filter((i) => i.type === "Message sent").length;
  const replies = mine.filter((i) => i.type === "Reply");
  const lastReply = replies.map((i) => i.date).sort().pop();
  const busy = messagesLast7(personId, interactions, now) >= CONTACT_LOAD_NUDGE;
  const likely = !busy && sent >= LIKELY_MIN_MESSAGES && replies.length / sent >= 0.3 && !!lastReply && now.getTime() - new Date(lastReply).getTime() <= 30 * DAY;
  return { busy, likely, sent };
}

export function messagesLast7(personId: string, interactions: Interaction[], now = new Date()) {
  return interactions.filter((i) => i.personId === personId && i.type === "Message sent" && now.getTime() - new Date(i.date).getTime() < 7 * DAY).length;
}

/** The single definition of tie strength, shown in the same words wherever ties appear (X1, X2). */
export const TIE_RULE = {
  summary:
    "Tie strength adds two things: how the person connects to CBS (alum 2 points, campus or club speaker 1) and what you share (a past employer 2, a club they spoke at that you're in 1).",
  levels: [
    { label: "Strong", points: "3–4 points", example: "a CBS alum from your past employer or one who spoke at your club, or a speaker from your past employer" },
    { label: "Warm", points: "2 points", example: "a CBS alum, or a speaker at a club you're in" },
    { label: "Light", points: "1 point", example: "a campus or club speaker with nothing else in common" },
  ],
  order: "People are ordered by tie strength. At equal strength, the person fewer CBS students messaged this week comes first.",
} as const;

export type TieKind = "club" | "employer" | "alum" | "speaker";
export interface TieReason {
  kind: TieKind;
  text: string;
  /** false for context that doesn't relate to the student (e.g. an alum's talk at a club you're not in) */
  relevant: boolean;
}
const article = (w: string) => (/^[AEIOU]/i.test(w) ? "an" : "a");
export interface Tie {
  cbsLink: 0 | 1 | 2;
  sharedGround: 0 | 1 | 2;
  strength: number;
  label: "Strong" | "Warm" | "Light" | "None";
  reasons: TieReason[];
  primary: TieKind | null;
  sharedEmployers: string[];
  sharedClubs: { clubId: string; event: string; date: string }[];
  otherEvents: { event: string; date: string }[];
  sameProgram: boolean;
}

const KIND_ORDER: TieKind[] = ["club", "employer", "alum", "speaker"];
const employerName = (id: string) => EMPLOYERS.find((e) => e.id === id)?.name ?? id;
const monthYear = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });

export function tieFor(person: Person, profile: Profile | null, affiliations: Affiliation[], employerNames?: (id: string) => string): Tie {
  const affs = affsOf(person.id, affiliations);
  const alum = isAlum(person);
  const cbsLink: 0 | 1 | 2 = alum ? 2 : affs.length ? 1 : 0;
  const nameOf = employerNames ?? employerName;
  const sharedEmployers = profile ? person.pastEmployers.filter((e) => profile.pastEmployers.includes(e)) : [];
  const sharedClubs = profile
    ? affs.filter((a) => a.type === "Club event speaker" && a.clubId && profile.clubs.includes(a.clubId)).map((a) => ({ clubId: a.clubId!, event: a.eventName, date: a.eventDate }))
    : [];
  const sharedGround: 0 | 1 | 2 = sharedEmployers.length ? 2 : sharedClubs.length ? 1 : 0;
  const strength = cbsLink + sharedGround;
  const label = strength >= 3 ? "Strong" : strength === 2 ? "Warm" : strength === 1 ? "Light" : "None";
  const program = person.cbsClassYear.split(" ")[0];
  const sameProgram = !!(profile && alum && program && profile.program === program);

  const reasons: TieReason[] = [];
  const first = person.name.split(" ")[0];
  sharedClubs.forEach((c) => reasons.push({ kind: "club", relevant: true, text: `Spoke at the ${clubShort(c.clubId)}, which you're in (${c.event}, ${monthYear(c.date)})` }));
  if (sharedEmployers.length) reasons.push({ kind: "employer", relevant: true, text: `You both worked at ${sharedEmployers.map(nameOf).join(" and ")}` });
  if (alum) reasons.push({ kind: "alum", relevant: true, text: `CBS ${person.cbsClassYear} alum${sameProgram ? ", same program as you" : ""}` });
  affs
    .filter((a) => !(a.type === "Club event speaker" && a.clubId && profile?.clubs.includes(a.clubId)))
    .forEach((a) => {
      const club = a.clubId ? clubShort(a.clubId) : "";
      reasons.push({
        kind: "speaker",
        // A talk is the CBS link for a non-alum; for an alum it is only context (X8).
        relevant: !alum,
        text: a.type === "Campus speaker" ? `Spoke at CBS: ${a.eventName} (${monthYear(a.eventDate)})` : `${first} spoke at ${article(club)} ${club} event (${monthYear(a.eventDate)})`,
      });
    });
  const primary = KIND_ORDER.find((k) => reasons.some((r) => r.kind === k)) ?? null;
  const otherEvents = affs
    .filter((a) => !(a.type === "Club event speaker" && a.clubId && profile?.clubs.includes(a.clubId)))
    .map((a) => ({ event: a.eventName, date: a.eventDate }));
  return { cbsLink, sharedGround, strength, label, reasons, primary, sharedEmployers, sharedClubs, otherEvents, sameProgram };
}

export interface PersonCardData {
  person: Person;
  position: Position;
  tie: Tie;
  msgs7: number;
}

/** People cards for one company, ordered by tie strength, then shared club > shared employer > alum > speaker, then fewer messages this week. */
export function peopleCards(companyId: string, profile: Profile | null, db: Db, employerNames?: (id: string) => string): PersonCardData[] {
  return peopleAt(companyId, db)
    .map(({ person, position }) => ({ person, position, tie: tieFor(person, profile, db.affiliations, employerNames), msgs7: messagesLast7(person.id, db.interactions) }))
    .filter((x) => x.tie.strength > 0)
    .sort(
      (a, b) =>
        b.tie.strength - a.tie.strength ||
        KIND_ORDER.indexOf(a.tie.primary ?? "speaker") - KIND_ORDER.indexOf(b.tie.primary ?? "speaker") ||
        a.msgs7 - b.msgs7 ||
        a.person.name.localeCompare(b.person.name)
    );
}

export function tieCountsByType(cards: PersonCardData[]) {
  return {
    club: cards.filter((c) => c.tie.sharedClubs.length).length,
    employer: cards.filter((c) => c.tie.sharedEmployers.length).length,
    alum: cards.filter((c) => isAlum(c.person)).length,
    speaker: cards.filter((c) => c.tie.reasons.some((r) => r.kind === "speaker" || r.kind === "club")).length,
  };
}

/* ---------- Formatting helpers ---------- */
export const money = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)}B` : `$${Math.round(m)}M`);
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("en-US", opts);
export const fmtMonth = (iso: string) => fmtDate(iso, { month: "short", year: "numeric" });
export const initials = (n: string) =>
  n
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const addDaysISO = (n: number, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function relDays(iso: string) {
  const n = daysSince(iso);
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  if (n < 30) return `${n} days ago`;
  const m = Math.round(n / 30);
  return m === 1 ? "1 month ago" : `${m} months ago`;
}
/** "This week" for metrics: the last 7 days, the same window as each contact's message counter. */
export function thisWeekRange(now = new Date()) {
  const end = new Date(now.getTime() + 60_000);
  const start = new Date(now.getTime() - 7 * DAY);
  return { start, end };
}
