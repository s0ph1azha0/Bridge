/*
 * Message drafter (BRD Screen 2B). Builds a first draft from the student's set-up,
 * the person's CBS tie and public company facts. The student edits it, copies it,
 * sends it from their own email or LinkedIn and marks it as sent. Bridge never sends.
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
const month = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", d.getFullYear() === new Date().getFullYear() ? { month: "long" } : { month: "long", year: "numeric" });
};

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

function backgroundLine(profile: Profile, employerName: (id: string) => string) {
  const bg = profile.background.trim().replace(/\s+/g, " ");
  if (bg) {
    let first = (bg.match(/^.+?[.!?](\s|$)/)?.[0] ?? bg).trim();
    if (first.length > 220) first = first.slice(0, 217).replace(/\s+\S*$/, "") + "…";
    if (!/[.!?…]$/.test(first)) first += ".";
    return `A bit about me: ${first}`;
  }
  if (profile.pastEmployers.length) return `Before CBS, I worked at ${joinList(profile.pastEmployers.map(employerName))}.`;
  return "";
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
  variant: number;
}

export const DRAFT_VARIANTS = ["Coffee chat", "Ask about a role", "Offer a scoped project"] as const;

export function draftMessage(d: DraftInput): string {
  const { user, profile, person, company, tie, roles, employerName } = d;
  const first = person.name.split(" ")[0];
  const me = user.firstName || "[your name]";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ") || "[your name]";
  const targetRole = roles.find((r) => profile.targetFunctions.includes(r.functionId));
  const fnId = targetRole?.functionId ?? profile.targetFunctions.find((f) => company.hiringAreas.includes(f)) ?? profile.targetFunctions[0] ?? "strategy-ops";
  const fn = phrase(fnId);

  // Why I'm writing to you, from the strongest CBS tie.
  const hooks: string[] = [];
  if (tie.sharedClubs.length) {
    const c = tie.sharedClubs[0];
    hooks.push(`I'm in the ${clubShort(c.clubId)} and saw that you spoke at the ${c.event} in ${month(c.date)}.`);
  }
  if (tie.sharedEmployers.length) {
    const e = employerName(tie.sharedEmployers[0]);
    hooks.push(person.cbsClassYear && !tie.sharedClubs.length ? `We both spent time at ${e}, and I saw you're a CBS alum as well (${person.cbsClassYear}).` : `We both spent time at ${e}, so I hoped you'd be open to sharing how you made the move.`);
  } else if (person.cbsClassYear && !tie.sharedClubs.length) {
    hooks.push(`I found you through the CBS alumni network (${person.cbsClassYear}).`);
  }
  if (!hooks.length && tie.otherEvents.length) {
    const ev = tie.otherEvents[0];
    hooks.push(`I saw that you spoke at the ${ev.event} in ${month(ev.date)}.`);
  }

  const recent = monthsSinceRound(company) <= 6;
  const companyHook = recent
    ? `Congratulations on ${company.name}'s ${money(company.lastRoundSize)} ${company.lastRoundName} in ${month(company.lastRoundDate)}.`
    : `I've been following ${company.name} since its ${company.lastRoundName}.`;
  const bg = backgroundLine(profile, employerName);

  if (d.variant === 1 && targetRole) {
    return [
      `Hi ${first},`,
      "",
      `I'm ${me}, ${studentLine(profile)}. ${hooks[0] ?? ""}`.trim(),
      "",
      `I'm interested in the ${targetRole.titleAsPosted} role on ${company.name}'s careers page. ${bg}`.trim(),
      "",
      `Before I apply, would you have 10 minutes to share what the team needs most from this hire? Any perspective would help.`,
      "",
      `Thank you,`,
      full,
    ].join("\n");
  }

  if (d.variant === 2) {
    return [
      `Hi ${first},`,
      "",
      `I'm ${me}, ${studentLine(profile)}. ${hooks.join(" ")}`.trim(),
      "",
      `${companyHook} ${bg}`.trim(),
      "",
      `I'm exploring ${fn} work at companies at ${company.name}'s stage. If there's a scoped project the team hasn't had time for, I'd be glad to take it on part-time this spring. Would you be open to a 15-minute call to see if something fits?`,
      "",
      `Best,`,
      full,
    ].join("\n");
  }

  const interest = targetRole
    ? `I noticed the ${targetRole.titleAsPosted} role, and I'm exploring ${fn} roles at companies at your stage.`
    : `I'm exploring ${fn} roles at high-growth companies like ${company.name}.`;
  return [
    `Hi ${first},`,
    "",
    `I'm ${me}, ${studentLine(profile)}. ${hooks.join(" ")}`.trim(),
    "",
    `${companyHook} ${interest}`,
    bg ? `\n${bg}` : "",
    "",
    `Would you have 15 minutes in the next couple of weeks? I'd love to hear how you think about ${fn} at ${company.name} and what makes someone successful on your team.`,
    "",
    `Thank you,`,
    full,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
