/*
 * Data model for Project Bridge, following BRD Section 6 ("Detailed Data").
 * Fourteen tables: User, Profile, Company, Role, Person, Position, Affiliation,
 * Club_Helper, Function_Helper, Employer_Helper, Saved, Interaction,
 * Interest_List and Flag. Computed values (Tie Strength, CMC Totals, role
 * status, momentum) live in src/lib/compute.ts.
 */

export type ISODate = string; // "2026-11-23"
export type ISOTime = string; // full ISO timestamp

/* ---------- Helper (dropdown) tables ---------- */
export interface FunctionHelper {
  id: string;
  name: string;
}
export interface ClubHelper {
  id: string;
  name: string;
}
export interface EmployerHelper {
  id: string;
  name: string;
  aliases: string[]; // other spellings that map to the same employer
}

/* ---------- People who use Bridge ---------- */
export type UserRole = "Student" | "Product team" | "CMC viewer";
export interface User {
  id: string;
  email: string; // Columbia address only
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: ISOTime;
}

export interface Profile {
  id: string;
  userId: string;
  program: string; // "MBA", "EMBA", "MS"
  classYear: string; // "2027"
  targetFunctions: string[]; // Function_Helper ids
  needsVisa: boolean;
  clubs: string[]; // Club_Helper ids
  pastEmployers: string[]; // Employer_Helper ids
  background: string; // used only to draft messages; never shown to employers
}

/* ---------- Collected from public sources ---------- */
export type Stage = "Seed" | "Series A" | "Series B" | "Series C" | "Series D+";
export interface Company {
  id: string;
  name: string;
  oneLiner: string;
  sector: string;
  hq: string;
  headcountBand: string;
  stage: Stage;
  lastRoundName: string;
  totalRaised: number; // USD millions
  lastRoundSize: number; // USD millions
  priorRoundSize: number | null; // USD millions, null if unknown
  lastRoundDate: ISODate;
  investors: string;
  hiringAreas: string[]; // Function_Helper ids
  careersUrl: string;
  sourceUrl: string; // funding source (Crunchbase)
  lastVerified: ISODate;
}

export type JobType = "Full-time" | "Internship" | "Part-time";
export type VisaStated = "Yes" | "No" | "Not stated";
export interface Role {
  id: string;
  companyId: string;
  titleAsPosted: string;
  functionId: string; // mapped from title + description, so a role is found whatever it is called
  jobType: JobType;
  visaStated: VisaStated;
  payStated: string; // "" when the posting states no pay
  postingUrl: string;
  firstSeen: ISODate;
  lastVerified: ISODate;
  closed: boolean;
}

export interface Person {
  id: string;
  name: string;
  linkedinUrl: string; // public profile link only
  cbsClassYear: string; // "MBA '19"; "" if not an alum
  pastEmployers: string[]; // Employer_Helper ids
  sourceUrl: string;
  lastVerified: ISODate;
  optedOut: boolean;
}

export interface Position {
  id: string;
  personId: string;
  companyId: string;
  title: string;
  current: boolean;
  sourceUrl: string;
  lastVerified: ISODate;
}

export type AffiliationType = "Campus speaker" | "Club event speaker";
export interface Affiliation {
  id: string;
  personId: string;
  type: AffiliationType;
  clubId: string | null; // null for a campus speaker
  eventName: string;
  eventDate: ISODate;
  sourceUrl: string;
}

/* ---------- Created by students ---------- */
export const PIPELINE_STAGES = ["Saved", "Reached out", "In conversation", "Coffee chat", "Applied"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export interface Saved {
  id: string;
  userId: string;
  companyId: string;
  stage: PipelineStage;
  dateSaved: ISOTime;
  stageChanged: ISOTime;
}

export const INTERACTION_TYPES = ["Message sent", "Reply", "Coffee chat", "Follow-up"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];
export interface Interaction {
  id: string;
  userId: string;
  personId: string;
  companyId: string; // stored, since the person may change jobs
  type: InteractionType;
  capturedVia: "Mark as sent button" | "Logged manually";
  date: ISOTime;
  followUpDue: ISODate | null;
  note: string;
}

export interface InterestEntry {
  id: string;
  userId: string;
  companyId: string;
  resumeName: string; // file uploaded when joining; the only student data that can reach an employer
  resumeSize: number;
  consentToShare: boolean;
  joined: ISOTime;
  removed: ISOTime | null;
}

export type FlagTarget = "Company" | "Role" | "Person";
export type FlagStatus = "Open" | "Fixed" | "Rejected";
export interface Flag {
  id: string;
  userId: string;
  targetType: FlagTarget;
  targetId: string;
  field: string; // "Removal request" marks a listed person asking to be removed
  note: string;
  status: FlagStatus;
  created: ISOTime;
  resolved: ISODate | null;
}
