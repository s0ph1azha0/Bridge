import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { CLUBS, FUNCTIONS, employersInText } from "../data/helpers";
import { BridgeMark, Icon } from "../components/ui";
import { peopleCards } from "../lib/compute";
import type { Priority, Profile } from "../data/types";

const PRIORITIES: { id: Priority; label: string; hint: string }[] = [
  { id: "warmth", label: "Warmest intro", hint: "People you share the most with" },
  { id: "fit", label: "Role fit", hint: "Open roles in your target functions" },
  { id: "funding", label: "Funding size", hint: "Most capital raised" },
  { id: "momentum", label: "Growth momentum", hint: "Biggest step-up and team growth" },
];

const PROGRAMS = [
  { id: "MBA", label: "MBA" },
  { id: "EMBA", label: "Executive MBA" },
  { id: "MS", label: "MS" },
];
const YEARS = ["2027", "2028", "2029"];

/** Screen 1: collect what the message drafter and tie matching need. Shown once, when no Profile exists. */
export default function Setup() {
  const { user, profile, saveProfile, db, addEmployer } = useBridge();
  const toast = useToast();
  const nav = useNavigate();
  const editing = !!profile;

  const [firstName, setFirst] = useState(user?.firstName ?? "");
  const [lastName, setLast] = useState(user?.lastName ?? "");
  const [program, setProgram] = useState(profile?.program ?? "MBA");
  const [classYear, setYear] = useState(profile?.classYear ?? "2027");
  const [fns, setFns] = useState<string[]>(profile?.targetFunctions ?? []);
  const [visa, setVisa] = useState<boolean | null>(profile ? profile.needsVisa : null);
  const [clubs, setClubs] = useState<string[]>(profile?.clubs ?? []);
  const [emps, setEmps] = useState<string[]>(profile?.pastEmployers ?? []);
  const [bg, setBg] = useState(profile?.background ?? "");
  const [priority, setPriority] = useState<Priority>(profile?.priority ?? "warmth");
  const [clubQ, setClubQ] = useState("");
  const [tried, setTried] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const employerName = (id: string) => db.employers.find((e) => e.id === id)?.name ?? id;
  const suggested = useMemo(() => employersInText(bg, db.employers).filter((id) => !emps.includes(id)), [bg, db.employers, emps]);
  const clubList = CLUBS.filter((c) => !clubQ || c.name.toLowerCase().includes(clubQ.toLowerCase()));

  const missing = [!firstName.trim() && "your first name", !fns.length && "at least one role", visa === null && "visa sponsorship"].filter(Boolean) as string[];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (missing.length) return;
    const next: Omit<Profile, "id" | "userId"> = { program, classYear, targetFunctions: fns, needsVisa: !!visa, clubs, pastEmployers: emps, background: bg.trim(), priority };
    saveProfile({ firstName: firstName.trim(), lastName: lastName.trim() }, next);
    // A2: point at the payoff, not the timer.
    const preview = { ...next, id: "preview", userId: user?.id ?? "" };
    const tops = db.companies.map((c) => peopleCards(c.id, preview, db)[0]).filter(Boolean);
    const strong = db.companies.flatMap((c) => peopleCards(c.id, preview, db)).filter((p) => p.tie.label === "Strong");
    const strongCos = new Set(strong.map((p) => p.position.companyId)).size;
    const warmCos = tops.filter((p) => p.tie.strength >= 2).length;
    const payoff = strong.length
      ? `You have ${strong.length} strong ${strong.length === 1 ? "tie" : "ties"} across ${strongCos} ${strongCos === 1 ? "company" : "companies"}.`
      : `You have a warm way into ${warmCos} ${warmCos === 1 ? "company" : "companies"}.`;
    toast(editing ? `Set-up saved. ${payoff}` : payoff);
    if (editing) nav(-1);
    else nav("/for-you");
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="bar">
        <div className="wrap">
          <span className="brand">
            <BridgeMark />
            <b>Project Bridge</b>
          </span>
          <span className="spacer" />
          {editing ? (
            <Link to="/companies" className="btn ghost sm">
              Cancel
            </Link>
          ) : (
            <span className="timer">About 2 minutes</span>
          )}
        </div>
      </div>
      <form className="setup" onSubmit={submit} noValidate>
        <div className="eyebrow">{editing ? "Your set-up" : "Set up once"}</div>
        <h1 style={{ marginTop: 6 }}>
          Welcome{firstName.trim() ? `, ${firstName.trim()}` : ""}. Tell us what you're looking for.
        </h1>

        <div className="steps">
          <div className="q">
            <span className="qlabel">Your name, program and class year</span>
            <div className="row">
              <label className="field">
                <span>First name</span>
                <input className="input" value={firstName} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" autoFocus={!editing} />
              </label>
              <label className="field">
                <span>Last name</span>
                <input className="input" value={lastName} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
              </label>
            </div>
            <div className="row">
              <label className="field">
                <span>Program</span>
                <select className="select" value={program} onChange={(e) => setProgram(e.target.value)}>
                  {PROGRAMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Class year</span>
                <select className="select" value={classYear} onChange={(e) => setYear(e.target.value)}>
                  {YEARS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="q" role="group" aria-labelledby="q-fn">
            <span className="qlabel" id="q-fn">
              What roles are you targeting?
            </span>
            <div className="chips">
              {FUNCTIONS.map((f) => (
                <button type="button" key={f.id} className="chip" aria-pressed={fns.includes(f.id)} onClick={() => toggle(fns, setFns, f.id)}>
                  {fns.includes(f.id) && Icon.check()}
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="q" role="group" aria-labelledby="q-visa">
            <span className="qlabel" id="q-visa">
              Do you need visa sponsorship?
            </span>
            <div>
              <div className="seg">
                <button type="button" aria-pressed={visa === true} onClick={() => setVisa(true)}>
                  Yes
                </button>
                <button type="button" aria-pressed={visa === false} onClick={() => setVisa(false)}>
                  No
                </button>
              </div>
            </div>
            <small className="muted">We only show what each posting states. We never guess a company's visa policy.</small>
          </div>

          <div className="q" role="group" aria-labelledby="q-clubs">
            <span className="qlabel" id="q-clubs">
              Which CBS clubs are you in?
            </span>
            <input className="input" placeholder="Filter clubs" value={clubQ} onChange={(e) => setClubQ(e.target.value)} aria-label="Filter clubs" style={{ maxWidth: 320 }} />
            <div className="chips">
              {clubList.map((c) => (
                <button type="button" key={c.id} className="chip" aria-pressed={clubs.includes(c.id)} onClick={() => toggle(clubs, setClubs, c.id)}>
                  {clubs.includes(c.id) && Icon.check()}
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="q">
            <span className="qlabel">Where have you worked?</span>
            <EmployerPicker
              selected={emps}
              onAdd={(name) => {
                const id = addEmployer(name);
                setEmps((s) => (s.includes(id) ? s : [...s, id]));
              }}
              onPick={(id) => setEmps((s) => (s.includes(id) ? s : [...s, id]))}
            />
            {emps.length > 0 && (
              <div className="chips">
                {emps.map((id) => (
                  <button type="button" key={id} className="chip" aria-pressed="true" onClick={() => setEmps(emps.filter((x) => x !== id))} aria-label={`Remove ${employerName(id)}`}>
                    {employerName(id)} <span className="x">✕</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="q">
            <label className="qlabel" htmlFor="bg">
              Paste your resume or a few lines about you
            </label>
            <textarea id="bg" className="textarea" value={bg} onChange={(e) => setBg(e.target.value)} placeholder="Three years at McKinsey in the Atlanta office, mostly pricing and go-to-market work for payments companies. Before that, an analyst at J.P. Morgan." />
            {suggested.length > 0 && (
              <div className="found">
                <span>Found in your text:</span>
                {suggested.map((id) => (
                  <button type="button" key={id} className="chip" onClick={() => setEmps((s) => [...s, id])}>
                    + {employerName(id)}
                  </button>
                ))}
              </div>
            )}
            <div className="privacy">
              {Icon.shield()}
              <span>Used only to write your messages. Never shared with employers.</span>
            </div>
          </div>

          <div className="q" role="group" aria-labelledby="q-pri">
            <span className="qlabel" id="q-pri">
              What matters most to you in a company?
            </span>
            <div className="chips">
              {PRIORITIES.map((p) => (
                <button type="button" key={p.id} className="chip" aria-pressed={priority === p.id} onClick={() => setPriority(p.id)} title={p.hint}>
                  {priority === p.id && Icon.check()}
                  {p.label}
                </button>
              ))}
            </div>
            <small className="muted">{PRIORITIES.find((p) => p.id === priority)!.hint}. This sets how companies are sorted; you can change it any time.</small>
          </div>

          {tried && missing.length > 0 && <div className="callout crit">Add {missing.join(", ")} to continue.</div>}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn accent" type="submit">
              {editing ? "Save set-up" : "Show me companies"}
            </button>
            {!editing && <span className="small muted">You can change any of this later.</span>}
          </div>
        </div>
      </form>
    </div>
  );
}

function EmployerPicker({ selected, onPick, onAdd }: { selected: string[]; onPick: (id: string) => void; onAdd: (name: string) => void }) {
  const { db } = useBridge();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const ql = q.trim().toLowerCase();
  const opts = ql
    ? db.employers.filter((e) => !selected.includes(e.id) && (e.name.toLowerCase().includes(ql) || e.aliases.some((a) => a.toLowerCase().includes(ql)))).slice(0, 8)
    : [];
  const exact = opts.some((e) => e.name.toLowerCase() === ql || e.aliases.some((a) => a.toLowerCase() === ql));
  const choose = (i: number) => {
    if (i < opts.length) onPick(opts[i].id);
    else if (q.trim()) onAdd(q.trim());
    setQ("");
    setHl(0);
  };
  return (
    <div className="combo">
      <input
        className="input"
        value={q}
        placeholder="Start typing: McKinsey, Goldman, Google…"
        aria-label="Add a past employer"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHl(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHl((h) => Math.min(h + 1, opts.length));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHl((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (q.trim()) choose(hl);
          }
        }}
      />
      {open && ql && (
        <div className="opts" role="listbox">
          {opts.map((e, i) => (
            <button type="button" key={e.id} className={i === hl ? "hl" : ""} onMouseDown={(ev) => ev.preventDefault()} onClick={() => choose(i)} role="option" aria-selected={i === hl}>
              {e.name}
              {e.aliases.length > 0 && <span className="small muted"> · also {e.aliases.slice(0, 2).join(", ")}</span>}
            </button>
          ))}
          {!exact && (
            <button type="button" className={hl === opts.length ? "hl" : ""} onMouseDown={(ev) => ev.preventDefault()} onClick={() => choose(opts.length)}>
              Add "{q.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
