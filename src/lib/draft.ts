/*
 * Message drafter (BRD Screen 2B). Builds a first draft from the student's set-up,
 * the person's CBS tie and public company facts. The student edits it, copies it,
 * sends it from their own email or LinkedIn and marks it as sent. Bridge never sends.
 *
 * Rules (from the v1 review, X3): only claim what the student told us or what is public.
 * No "I've been following you" lines, no repeating the same employer twice, and every
 * company line cites a specific fact (a recent round, a posted role, or team growth).
 * This prototype uses templates; the MVP can swap in an LLM behind the same inputs.
 */
import type { Company, Person, Profile, Role, User } from "../data/types";
import { clubShort, fnName } from "../data/helpers";
import { monthsSinceRound, money, type Tie } from "./compute";

const FN_PHRASE: Record<string, string> = {
  product: "product",
  "strategy-ops": "strategy and operations",
  growth: "growth",
  "chief-of-staff": "chief of staff",
  gtm: "go-to-market",
  bizdev: "business development",
};
const phrase = (id: string) => FN_PHRASE[id] ?? fnName(id).toLowerCase();
const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const month = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", d.getFullYear() === new Date().getFullYear() ? { month: "long" } : { month: "long", year: "numeric" });
};
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function studentLine(profile: Profile) {
  const now = new Date();
  const academicEnd = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const yr = Number(profile.classYear);
  if (profile.program === "MBA") {
    if (yr === academicEnd) return "a second-year MBA student at Columbia Business School";
    if (yr === academicEnd + 1) return "a first-year MBA student at Columbia Business School";
    return `an MBA student (Class of ${profile.classYear}) at Columbia Business School`;
  }
  if (profile.program === "EMBA") return "an Executive MBA student at Columbia Business School";
  if (profile.program === "MS") return "a master's student at Columbia Business School";
  return "a student at Columbia Business School";
}

export interface DraftInput {
  user: User;
  profile: Profile;
  person: Person;
  title: string;
  company: Company;
  tie: Tie;
  roles: Role[]; // live roles at the company
  employerName: (id: string) => string;
  employerAliases?: (id: string) => string[];
  variant: number;
}

export const DRAFT_VARIANTS = ["Coffee chat", "Ask about a role", "Offer a scoped project"] as const;

export function draftMessage(d: DraftInput): string {
  const { user, profile, person, company, tie, roles, employerName } = d;
  const aliases = d.employerAliases ?? ((id: string) => [employerName(id)]);
  const first = person.name.split(" ")[0];
  const me = user.firstName || "[your name]";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ") || "[your name]";
  const targetRole = roles.find((r) => profile.targetFunctions.includes(r.functionId) && !(profile.needsVisa && r.visaStated === "No"));
  const fnId = targetRole?.functionId ?? profile.targetFunctions.find((f) => company.hiringAreas.includes(f)) ?? profile.targetFunctions[0] ?? "strategy-ops";
  const fn = phrase(fnId);
  const field = lowerFirst(company.sector);

  // 1. Why I'm writing to you, from the strongest CBS tie.
  const hooks: string[] = [];
  const shared = tie.sharedEmployers[0];
  if (tie.sharedClubs.length) {
    const c = tie.sharedClubs[0];
    hooks.push(`I'm in the ${clubShort(c.clubId)} and saw that you spoke at the ${c.event} in ${month(c.date)}.`);
  }
  if (shared) {
    hooks.push(person.cbsClassYear && !tie.sharedClubs.length ? `We both worked at ${employerName(shared)}, and you're a CBS alum as well (${person.cbsClassYear}).` : `We both worked at ${employerName(shared)}.`);
  } else if (person.cbsClassYear && !tie.sharedClubs.length) {
    hooks.push(`I found you through the CBS alumni network (${person.cbsClassYear}).`);
  }
  if (!hooks.length && tie.otherEvents.length) {
    const ev = tie.otherEvents[0];
    hooks.push(`I saw that you spoke at the ${ev.event} in ${month(ev.date)}.`);
  }

  // 2. One specific, public company fact. Never claim familiarity the student didn't state.
  const recent = monthsSinceRound(company) <= 6;
  const growth = company.headcountGrowth6m ?? 0;
  const companyFact = recent
    ? `Congratulations on ${company.name}'s ${money(company.lastRoundSize)} ${company.lastRoundName} in ${month(company.lastRoundDate)}.`
    : growth >= 15
      ? `I saw that ${company.name} has grown its team by about ${growth}% over the last six months.`
      : "";

  // 3. Background, without repeating an employer the hook already names.
  const sharedNames = tie.sharedEmployers.flatMap((id) => [employerName(id), ...aliases(id)]);
  const mentionsShared = (t: string) => sharedNames.some((n) => n.length >= 2 && new RegExp(`(^|[^A-Za-z])${escapeRe(n)}([^A-Za-z]|$)`, "i").test(t));
  let bg = "";
  const raw = profile.background.trim().replace(/\s+/g, " ");
  if (raw) {
    let s = (raw.match(/^.+?[.!?](\s|$)/)?.[0] ?? raw).trim();
    if (s.length > 220) s = s.slice(0, 217).replace(/\s+\S*$/, "") + "…";
    if (!/[.!?…]$/.test(s)) s += ".";
    if (!mentionsShared(s)) bg = `A bit about me: ${s}`;
  } else {
    const others = profile.pastEmployers.filter((e) => !tie.sharedEmployers.includes(e));
    if (others.length) bg = `${shared ? "I also worked" : "Before CBS, I worked"} at ${joinList(others.map(employerName))}.`;
  }

  const intro = `I'm ${me}, ${studentLine(profile)}. ${hooks.join(" ")}`.trim();
  const para = (...xs: string[]) => xs.filter(Boolean).join(" ");
  const out = (...blocks: string[]) => blocks.filter(Boolean).join("\n\n");

  if (d.variant === 1 && targetRole) {
    return out(
      `Hi ${first},`,
      intro,
      para(`I'm interested in the ${targetRole.titleAsPosted} role on ${company.name}'s careers page.`, bg),
      `Before I apply, would you have 10 minutes to share what the team needs most from this hire? Any perspective would help.`,
      `Thank you,\n${full}`
    );
  }

  if (d.variant === 2) {
    return out(
      `Hi ${first},`,
      intro,
      para(companyFact, bg),
      `I'm exploring ${fn} work in ${field}. If there's a scoped project the team hasn't had time for, I'd be glad to take it on part-time this spring. Would you be open to a 15-minute call to see if something fits?`,
      `Best,\n${full}`
    );
  }

  const interest = targetRole ? `I noticed the ${targetRole.titleAsPosted} role, and I'm exploring ${fn} roles in ${field}.` : `I'm exploring ${fn} roles in ${field}.`;
  return out(
    `Hi ${first},`,
    intro,
    para(companyFact, interest),
    bg,
    `Would you have 15 minutes in the next couple of weeks? I'd love to hear how you think about ${fn} at ${company.name} and what makes someone successful on your team.`,
    `Thank you,\n${full}`
  );
}
