import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { INTERACTION_TYPES, PIPELINE_STAGES, type InteractionType, type PipelineStage } from "../data/types";
import { addDaysISO, fmtDate, peopleAt, peopleCards, relDays, thisWeekRange, todayISO } from "../lib/compute";
import { CompanyLogo, Icon, TiePill } from "../components/ui";

/** Screen 3: track the search in one place. */
export default function Pipeline() {
  const { db, mySaved, myInteractions, logInteraction, updateInteraction } = useBridge();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const selId = params.get("company");
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("company", id);
    else next.delete("company");
    setParams(next, { replace: true });
  };
  const openPerson = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("person", id);
    setParams(next);
  };

  const { start, end } = thisWeekRange();
  const today = todayISO();
  const weekEnd = addDaysISO(6); // follow-ups due in the next 7 days, plus anything overdue
  const actionsThisWeek = myInteractions.filter((i) => new Date(i.date) >= start && new Date(i.date) < end).length;
  const replies = myInteractions.filter((i) => i.type === "Reply").length;
  const chats = myInteractions.filter((i) => i.type === "Coffee chat").length;
  const sent = myInteractions.filter((i) => i.type === "Message sent").length;

  // Open follow-ups: the latest interaction per person that carries a due date, due by the end of this week.
  const latestByPerson = new Map<string, (typeof myInteractions)[number]>();
  [...myInteractions].sort((a, b) => a.date.localeCompare(b.date)).forEach((i) => latestByPerson.set(i.personId, i));
  const openDue = myInteractions.filter((i) => i.followUpDue && latestByPerson.get(i.personId)?.id === i.id);
  const dueThisWeek = openDue.filter((i) => i.followUpDue! <= weekEnd).sort((a, b) => a.followUpDue!.localeCompare(b.followUpDue!));

  const company = (id: string) => db.companies.find((c) => c.id === id)!;
  const person = (id: string) => db.people.find((p) => p.id === id);
  const sel = mySaved.find((s) => s.companyId === selId);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My pipeline</h1>
          <p>Every company you're working, by stage. "Mark as sent" and logged replies move a company forward for you.</p>
        </div>
        <Link to="/companies" className="btn ghost">
          Find more companies
        </Link>
      </div>

      <div className="stat-row" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="n">{mySaved.length}</div>
          <div className="l">companies saved</div>
        </div>
        <div className="stat">
          <div className="n">{actionsThisWeek}</div>
          <div className="l">outreach actions, last 7 days</div>
        </div>
        <div className="stat">
          <div className="n">{sent}</div>
          <div className="l">messages sent</div>
        </div>
        <div className="stat">
          <div className="n">
            {replies} / {chats}
          </div>
          <div className="l">replies / coffee chats</div>
        </div>
      </div>

      {dueThisWeek.length > 0 && (
        <section className="panel" style={{ marginBottom: 18 }} aria-labelledby="h-due">
          <h2 id="h-due" style={{ fontSize: 18, marginBottom: 10 }}>
            Follow-ups due this week
          </h2>
          <div className="due">
            {dueThisWeek.map((i) => {
              const p = person(i.personId);
              const over = i.followUpDue! < today;
              return (
                <div key={i.id} className={`item${over ? " over" : ""}`}>
                  <span style={{ flex: 1, minWidth: 200 }}>
                    <b>{p?.name}</b> at {company(i.companyId).name} · {over ? "overdue since" : "due"} {fmtDate(i.followUpDue!, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <button className="btn sm" onClick={() => p && openPerson(p.id)}>
                    Open
                  </button>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      logInteraction({ personId: i.personId, companyId: i.companyId, type: "Follow-up", via: "Logged manually" });
                      updateInteraction(i.id, { followUpDue: null });
                      toast("Follow-up logged");
                    }}
                  >
                    {Icon.check()} I followed up
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {mySaved.length === 0 ? (
        <div className="empty">
          Nothing saved yet. Tap the heart on any company in the <Link to="/companies">directory</Link>, or mark a message as sent, and it lands here.
        </div>
      ) : (
        <div className="kanban" role="list">
          {PIPELINE_STAGES.map((stage) => {
            const items = mySaved.filter((s) => s.stage === stage);
            return (
              <section key={stage} className="col" aria-label={stage} role="listitem">
                <h3>
                  {stage} <span className="mono">{items.length}</span>
                </h3>
                {items.map((s) => {
                  const c = company(s.companyId);
                  const ints = myInteractions.filter((i) => i.companyId === c.id);
                  const last = [...ints].sort((a, b) => b.date.localeCompare(a.date))[0];
                  const due = dueThisWeek.find((i) => i.companyId === c.id);
                  return (
                    <button key={s.id} className="pcard" aria-pressed={selId === c.id} onClick={() => select(selId === c.id ? null : c.id)}>
                      <span className="nm">
                        <CompanyLogo name={c.name} size="sm" />
                        {c.name}
                      </span>
                      <span className="sm">{last ? `${last.type} ${relDays(last.date)}` : `Saved ${relDays(s.dateSaved)}`}</span>
                      <span className="sm">
                        {new Set(ints.map((i) => i.personId)).size} {new Set(ints.map((i) => i.personId)).size === 1 ? "person" : "people"} contacted
                      </span>
                      {due && <span className={`flag${due.followUpDue! < today ? " over" : ""}`}>Follow-up {due.followUpDue! < today ? "overdue" : "due " + fmtDate(due.followUpDue!, { weekday: "short" })}</span>}
                    </button>
                  );
                })}
                {items.length === 0 && <span className="small muted" style={{ padding: "4px 6px" }}>None yet</span>}
              </section>
            );
          })}
        </div>
      )}

      {sel && <CompanyDetail key={sel.companyId} companyId={sel.companyId} stage={sel.stage} onClose={() => select(null)} openPerson={openPerson} weekEnd={weekEnd} />}
    </>
  );
}

function CompanyDetail({ companyId, stage, onClose, openPerson, weekEnd }: { companyId: string; stage: PipelineStage; onClose: () => void; openPerson: (id: string) => void; weekEnd: string }) {
  const { db, profile, myInteractions, setStage, toggleSave, logInteraction, updateInteraction, deleteInteraction } = useBridge();
  const toast = useToast();
  const today = todayISO();
  const company = (id: string) => db.companies.find((c) => c.id === id)!;
  const person = (id: string) => db.people.find((p) => p.id === id);
  const c = company(companyId);
  const ints = myInteractions.filter((i) => i.companyId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const cards = peopleCards(c.id, profile, db);
  const contacted = new Set(ints.map((i) => i.personId));
  const peopleHere = peopleAt(c.id, db).map((x) => x.person);
  const [type, setType] = useState<InteractionType>("Message sent");
  const [pid, setPid] = useState(cards[0]?.person.id ?? peopleHere[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");

  return (
    <section className="panel pdetail" aria-labelledby="h-detail">
      <header style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
        <CompanyLogo name={c.name} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 id="h-detail" style={{ fontSize: 22 }}>
            {c.name}
          </h2>
          <div className="small muted">
            {c.stage} · {c.oneLiner}
          </div>
        </div>
        <label className="field" style={{ minWidth: 180 }}>
          <span className="small">Stage</span>
          <select className="select" value={stage} onChange={(e) => setStage(c.id, e.target.value as PipelineStage)}>
            {PIPELINE_STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div style={{ display: "flex", gap: 6, alignSelf: "flex-end" }}>
          <Link to={`/companies/${c.id}`} className="btn ghost sm">
            Company page
          </Link>
          <button
            className="btn ghost sm"
            onClick={() => {
              if (confirm(`Remove ${c.name} from your pipeline? Your logged interactions stay.`)) {
                toggleSave(c.id);
                onClose();
              }
            }}
          >
            Remove
          </button>
        </div>
      </header>

      <div className="grid2">
        <div>
          <div className="sec-title">People</div>
          {cards.length === 0 && <p className="small muted">No CBS people listed here yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...cards]
              .sort((a, b) => Number(contacted.has(b.person.id)) - Number(contacted.has(a.person.id)))
              .map((p) => {
                const last = ints.find((i) => i.personId === p.person.id);
                return (
                  <div key={p.person.id} className="card" style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <b>{p.person.name}</b> <span className="small muted">· {p.position.title}</span>
                      <div className="small" style={{ color: last ? "var(--good)" : "var(--muted)" }}>
                        {last ? `${last.type} ${relDays(last.date)}` : "Not contacted yet"}
                      </div>
                    </div>
                    <TiePill tie={p.tie} />
                    <button className="btn sm" onClick={() => openPerson(p.person.id)}>
                      {last ? "Open" : "Draft"}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        <div>
          <div className="sec-title">Log an interaction</div>
          <form
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!pid) return;
              logInteraction({ personId: pid, companyId: c.id, type, via: "Logged manually", date, followUpDue: due || null, note: note.trim() });
              setNote("");
              setDue("");
              toast(`${type} logged`);
            }}
          >
            <div className="row">
              <label className="field">
                <span className="small">What happened</span>
                <select className="select" value={type} onChange={(e) => setType(e.target.value as InteractionType)}>
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="small">With</span>
                <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>
                  {peopleHere.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="row">
              <label className="field">
                <span className="small">Date</span>
                <input type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="field">
                <span className="small">Follow-up due (optional)</span>
                <input type="date" className="input" value={due} min={today} onChange={(e) => setDue(e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span className="small">Note (optional)</span>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Suggested I talk to the Head of Ops" />
            </label>
            <button className="btn" type="submit" style={{ alignSelf: "flex-start" }} disabled={!pid}>
              Log it
            </button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="sec-title">Interaction log</div>
        {ints.length ? (
          <div className="tablewrap">
            <table className="log">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Person</th>
                  <th>Note</th>
                  <th>Follow-up due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ints.map((i) => (
                  <tr key={i.id} className={i.followUpDue && i.followUpDue <= weekEnd ? "dueweek" : ""}>
                    <td>
                      <b>{i.type}</b>
                      <div className="small muted">{i.capturedVia === "Mark as sent button" ? "Mark as sent" : "Logged"}</div>
                    </td>
                    <td className="nowrap">{fmtDate(i.date, { month: "short", day: "numeric" })}</td>
                    <td>{person(i.personId)?.name}</td>
                    <td className="small">{i.note || <span className="muted">–</span>}</td>
                    <td>
                      <input
                        type="date"
                        className="input"
                        style={{ width: 150, padding: "5px 8px" }}
                        value={i.followUpDue ?? ""}
                        onChange={(e) => updateInteraction(i.id, { followUpDue: e.target.value || null })}
                        aria-label="Follow-up due date"
                      />
                    </td>
                    <td>
                      <button className="iconbtn" aria-label="Delete this entry" onClick={() => deleteInteraction(i.id)}>
                        {Icon.x()}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small muted">No interactions yet.</p>
        )}
      </div>
    </section>
  );
}
