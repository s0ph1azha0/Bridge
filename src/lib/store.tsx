/*
 * App state. Collected data (companies, roles, people) and other students' sample
 * activity come from src/data/seed.ts. Everything a person does in the prototype is
 * saved in this browser (localStorage), so interviews can run without a backend.
 * The shape mirrors the BRD tables, so moving to Postgres later is a straight swap.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed } from "../data/seed";
import { EMPLOYERS, matchEmployer } from "../data/helpers";
import type {
  EmployerHelper,
  Flag,
  FlagStatus,
  FlagTarget,
  Interaction,
  InteractionType,
  InterestEntry,
  PipelineStage,
  Profile,
  Saved,
  User,
  UserRole,
} from "../data/types";
import { PIPELINE_STAGES } from "../data/types";

const KEY = "bridge-v2-state";

interface Local {
  version: 1;
  session: { userId: string } | null;
  pendingCode: { email: string; code: string; sentAt: string } | null;
  users: User[];
  profiles: Profile[];
  saved: Saved[];
  interactions: Interaction[];
  interest: InterestEntry[];
  flags: Flag[];
  flagStatus: Record<string, { status: FlagStatus; resolved: string | null }>; // overrides for sample flags
  optedOut: string[]; // person ids hidden after a removal request
  refreshedAt: string | null; // last simulated weekly refresh
  customEmployers: EmployerHelper[];
  events: { userId: string; type: "draft_opened" | "draft_copied"; personId: string; at: string }[]; // funnel metrics only
}

const empty = (): Local => ({
  version: 1, session: null, pendingCode: null, users: [], profiles: [], saved: [], interactions: [], interest: [], flags: [],
  flagStatus: {}, optedOut: [], refreshedAt: null, customEmployers: [], events: [],
});

function load(): Local {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const v = JSON.parse(raw);
    return v?.version === 1 ? { ...empty(), ...v } : empty();
  } catch {
    return empty();
  }
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();
const rank = (s: PipelineStage) => PIPELINE_STAGES.indexOf(s);

export const COLUMBIA_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*columbia\.edu$/i;

function useBridgeState() {
  const [local, setLocal] = useState<Local>(load);
  const seed = useMemo(buildSeed, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(local));
    } catch {
      /* storage full or blocked: the session still works in memory */
    }
  }, [local]);

  const update = useCallback((fn: (s: Local) => Local) => setLocal((s) => fn(s)), []);

  /* ---------- Merged tables ---------- */
  const db = useMemo(() => {
    const refresh = local.refreshedAt;
    const fresh = <T extends { lastVerified: string }>(x: T): T => (refresh && refresh > x.lastVerified ? { ...x, lastVerified: refresh } : x);
    const flags = [...seed.flags, ...local.flags].map((f) => (local.flagStatus[f.id] ? { ...f, ...local.flagStatus[f.id] } : f));
    return {
      companies: seed.companies.map(fresh),
      roles: seed.roles.map((r) => (r.closed ? r : fresh(r))),
      people: seed.people.map((p) => (local.optedOut.includes(p.id) ? { ...p, optedOut: true } : fresh(p))),
      positions: seed.positions.map(fresh),
      affiliations: seed.affiliations,
      users: [...seed.otherUsers, ...local.users],
      profiles: local.profiles,
      saved: [...seed.saved, ...local.saved],
      interactions: [...seed.interactions, ...local.interactions],
      interest: [...seed.interest, ...local.interest],
      flags,
      employers: [...EMPLOYERS, ...local.customEmployers],
    };
  }, [seed, local]);

  const user = local.session ? local.users.find((u) => u.id === local.session!.userId) ?? null : null;
  const profile = user ? local.profiles.find((p) => p.userId === user.id) ?? null : null;

  /* ---------- Sign in ---------- */
  const requestCode = useCallback(
    (email: string) => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      update((s) => ({ ...s, pendingCode: { email: email.trim().toLowerCase(), code, sentAt: now() } }));
      return code;
    },
    [update]
  );

  const verifyCode = useCallback(
    (code: string): boolean => {
      const pending = local.pendingCode;
      if (!pending || pending.code !== code.trim()) return false;
      update((s) => {
        let u = s.users.find((x) => x.email === pending.email);
        const users = [...s.users];
        if (!u) {
          u = { id: uid("u"), email: pending.email, firstName: "", lastName: "", role: "Student", createdAt: now() };
          users.push(u);
        }
        return { ...s, users, session: { userId: u.id }, pendingCode: null };
      });
      return true;
    },
    [local.pendingCode, update]
  );

  const signOut = useCallback(() => update((s) => ({ ...s, session: null, pendingCode: null })), [update]);
  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setLocal(empty());
  }, []);

  /* ---------- Set-up ---------- */
  const saveProfile = useCallback(
    (names: { firstName: string; lastName: string }, p: Omit<Profile, "id" | "userId">) => {
      if (!user) return;
      update((s) => {
        const existing = s.profiles.find((x) => x.userId === user.id);
        const profiles = existing
          ? s.profiles.map((x) => (x.userId === user.id ? { ...x, ...p } : x))
          : [...s.profiles, { ...p, id: uid("pr"), userId: user.id }];
        const users = s.users.map((u) => (u.id === user.id ? { ...u, ...names } : u));
        return { ...s, profiles, users };
      });
    },
    [user, update]
  );

  const addEmployer = useCallback(
    (name: string): string => {
      const hit = matchEmployer(name, db.employers);
      if (hit) return hit.id;
      const id = "x-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      update((s) => (s.customEmployers.some((e) => e.id === id) ? s : { ...s, customEmployers: [...s.customEmployers, { id, name: name.trim(), aliases: [] }] }));
      return id;
    },
    [db.employers, update]
  );

  const setRole = useCallback((role: UserRole) => user && update((s) => ({ ...s, users: s.users.map((u) => (u.id === user.id ? { ...u, role } : u)) })), [user, update]);

  /* ---------- Pipeline ---------- */
  const mySaved = useMemo(() => (user ? local.saved.filter((s) => s.userId === user.id) : []), [local.saved, user]);
  const savedFor = useCallback((companyId: string) => mySaved.find((s) => s.companyId === companyId) ?? null, [mySaved]);

  const toggleSave = useCallback(
    (companyId: string) => {
      if (!user) return;
      update((s) => {
        const has = s.saved.find((x) => x.userId === user.id && x.companyId === companyId);
        if (has) return { ...s, saved: s.saved.filter((x) => x !== has) };
        return { ...s, saved: [...s.saved, { id: uid("sv"), userId: user.id, companyId, stage: "Saved", dateSaved: now(), stageChanged: now() }] };
      });
    },
    [user, update]
  );

  const setStage = useCallback(
    (companyId: string, stage: PipelineStage) => {
      if (!user) return;
      update((s) => {
        const has = s.saved.find((x) => x.userId === user.id && x.companyId === companyId);
        if (!has) return { ...s, saved: [...s.saved, { id: uid("sv"), userId: user.id, companyId, stage, dateSaved: now(), stageChanged: now() }] };
        return { ...s, saved: s.saved.map((x) => (x === has ? { ...x, stage, stageChanged: now() } : x)) };
      });
    },
    [user, update]
  );

  /** Log an outreach step. Saves the company if needed and moves its stage forward, never back. */
  const logInteraction = useCallback(
    (i: { personId: string; companyId: string; type: InteractionType; via: Interaction["capturedVia"]; date?: string; followUpDue?: string | null; note?: string }) => {
      if (!user) return "";
      const id = uid("int");
      const target: PipelineStage = i.type === "Message sent" || i.type === "Follow-up" ? "Reached out" : i.type === "Reply" ? "In conversation" : "Coffee chat";
      update((s) => {
        const interaction: Interaction = {
          id, userId: user.id, personId: i.personId, companyId: i.companyId, type: i.type, capturedVia: i.via,
          date: i.date ? new Date(i.date + "T" + new Date().toTimeString().slice(0, 8)).toISOString() : now(), followUpDue: i.followUpDue ?? null, note: i.note ?? "",
        };
        const has = s.saved.find((x) => x.userId === user.id && x.companyId === i.companyId);
        const saved = has
          ? s.saved.map((x) => (x === has && rank(target) > rank(x.stage) && x.stage !== "Applied" ? { ...x, stage: target, stageChanged: now() } : x))
          : [...s.saved, { id: uid("sv"), userId: user.id, companyId: i.companyId, stage: target, dateSaved: now(), stageChanged: now() }];
        return { ...s, interactions: [...s.interactions, interaction], saved };
      });
      return id;
    },
    [user, update]
  );

  const updateInteraction = useCallback(
    (id: string, patch: Partial<Pick<Interaction, "followUpDue" | "note">>) => update((s) => ({ ...s, interactions: s.interactions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    [update]
  );
  const deleteInteraction = useCallback((id: string) => update((s) => ({ ...s, interactions: s.interactions.filter((x) => x.id !== id) })), [update]);

  /* ---------- Interest list ---------- */
  const myInterest = useCallback(
    (companyId: string) => (user ? local.interest.find((e) => e.userId === user.id && e.companyId === companyId && !e.removed) ?? null : null),
    [local.interest, user]
  );
  const joinInterest = useCallback(
    (companyId: string, resume: { name: string; size: number }) => {
      if (!user) return;
      update((s) => ({
        ...s,
        interest: [...s.interest, { id: uid("il"), userId: user.id, companyId, resumeName: resume.name, resumeSize: resume.size, consentToShare: true, joined: now(), removed: null }],
      }));
    },
    [user, update]
  );
  const leaveInterest = useCallback(
    (companyId: string) => {
      if (!user) return;
      update((s) => ({ ...s, interest: s.interest.map((e) => (e.userId === user.id && e.companyId === companyId && !e.removed ? { ...e, removed: now() } : e)) }));
    },
    [user, update]
  );

  /* ---------- Flags and removal requests ---------- */
  const addFlag = useCallback(
    (f: { targetType: FlagTarget; targetId: string; field: string; note: string }) => {
      update((s) => ({ ...s, flags: [...s.flags, { id: uid("fl"), userId: user?.id ?? "anonymous", ...f, status: "Open", created: now(), resolved: null }] }));
    },
    [user, update]
  );
  const setFlagStatus = useCallback(
    (id: string, status: FlagStatus) => {
      const resolved = status === "Open" ? null : new Date().toISOString().slice(0, 10);
      update((s) => {
        const mine = s.flags.some((f) => f.id === id);
        return mine ? { ...s, flags: s.flags.map((f) => (f.id === id ? { ...f, status, resolved } : f)) } : { ...s, flagStatus: { ...s.flagStatus, [id]: { status, resolved } } };
      });
    },
    [update]
  );
  const hidePerson = useCallback((personId: string) => update((s) => (s.optedOut.includes(personId) ? s : { ...s, optedOut: [...s.optedOut, personId] })), [update]);
  const unhidePerson = useCallback((personId: string) => update((s) => ({ ...s, optedOut: s.optedOut.filter((x) => x !== personId) })), [update]);

  /* ---------- Funnel events ---------- */
  const recordEvent = useCallback(
    (type: "draft_opened" | "draft_copied", personId: string) => {
      if (!user) return;
      update((s) =>
        s.events.some((e) => e.userId === user.id && e.type === type && e.personId === personId && e.at.slice(0, 10) === now().slice(0, 10))
          ? s
          : { ...s, events: [...s.events, { userId: user.id, type, personId, at: now() }] }
      );
    },
    [user, update]
  );

  /* ---------- Product team ---------- */
  const runRefresh = useCallback(() => update((s) => ({ ...s, refreshedAt: new Date().toISOString().slice(0, 10) })), [update]);

  return {
    db, seed, user, profile, pendingCode: local.pendingCode, refreshedAt: local.refreshedAt,
    requestCode, verifyCode, signOut, resetAll, saveProfile, addEmployer, setRole,
    mySaved, savedFor, toggleSave, setStage, logInteraction, updateInteraction, deleteInteraction,
    myInterest, joinInterest, leaveInterest, addFlag, setFlagStatus, hidePerson, unhidePerson, runRefresh, recordEvent, events: local.events, localUsers: local.users,
    myInteractions: user ? local.interactions.filter((i) => i.userId === user.id) : [],
  };
}

export type Bridge = ReturnType<typeof useBridgeState>;
const Ctx = createContext<Bridge | null>(null);

export function BridgeProvider({ children }: { children: ReactNode }) {
  const value = useBridgeState();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBridge() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBridge must be used inside BridgeProvider");
  return v;
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg, key]);
  const show = useCallback((m: string) => {
    setMsg(m);
    setKey((k) => k + 1);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={`toast${msg ? " on" : ""}`} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
