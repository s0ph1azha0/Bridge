import { useState } from "react";
import { Link } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { CONTACT_LOAD_NUDGE, UNVERIFIED_AFTER_DAYS, daysSince, fmtDate, liveRoles, messagesLast7, roleStatus, thisWeekRange } from "../lib/compute";
import type { Flag, FlagStatus } from "../data/types";

type Tab = "flags" | "interest" | "data" | "metrics";

/** "As the product team, we need to": run the weekly refresh, review flags and removal requests, export interest lists, and watch the MVP metrics. */
export default function TeamOps() {
  const [tab, setTab] = useState<Tab>("flags");
  const { db } = useBridge();
  const openFlags = db.flags.filter((f) => f.status === "Open").length;
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Product team only</div>
          <h1>Operations</h1>
          <p>The weekly work behind the MVP: data refresh, flag and removal review, interest-list exports, and the metrics we're testing.</p>
        </div>
      </div>
      <div className="banner">
        Prototype view. Numbers combine the fictional sample students with whatever was done in this browser. In the MVP, only accounts with the Product team role see this page.
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ["flags", `Flags and removals${openFlags ? ` (${openFlags})` : ""}`],
            ["interest", "Interest lists"],
            ["data", "Data freshness"],
            ["metrics", "MVP metrics"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "flags" && <Flags />}
      {tab === "interest" && <Interest />}
      {tab === "data" && <DataFreshness />}
      {tab === "metrics" && <Metrics />}
    </>
  );
}

function targetName(f: Flag, db: ReturnType<typeof useBridge>["db"]) {
  if (f.targetType === "Company") return { name: db.companies.find((c) => c.id === f.targetId)?.name ?? f.targetId, companyId: f.targetId };
  if (f.targetType === "Role") {
    const r = db.roles.find((x) => x.id === f.targetId);
    const c = db.companies.find((x) => x.id === r?.companyId);
    return { name: `${r?.titleAsPosted ?? f.targetId}, ${c?.name ?? ""}`, companyId: c?.id };
  }
  const p = db.people.find((x) => x.id === f.targetId);
  const pos = db.positions.find((x) => x.personId === f.targetId);
  return { name: p?.name ?? f.targetId, companyId: pos?.companyId };
}

function Flags() {
  const { db, setFlagStatus, hidePerson, unhidePerson } = useBridge();
  const toast = useToast();
  const [show, setShow] = useState<"Open" | "All">("Open");
  const flags = [...db.flags].filter((f) => show === "All" || f.status === "Open").sort((a, b) => b.created.localeCompare(a.created));
  const set = (f: Flag, s: FlagStatus) => {
    setFlagStatus(f.id, s);
    toast(`Marked ${s.toLowerCase()}`);
  };
  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <p className="small muted">Reviewed every week. Anyone listed who asks to be removed is hidden within 48 hours.</p>
        <div className="seg">
          <button aria-pressed={show === "Open"} onClick={() => setShow("Open")}>
            Open
          </button>
          <button aria-pressed={show === "All"} onClick={() => setShow("All")}>
            All
          </button>
        </div>
      </div>
      {flags.length === 0 ? (
        <div className="empty">No {show === "Open" ? "open " : ""}flags.</div>
      ) : (
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Received</th>
                <th>Card</th>
                <th>Detail</th>
                <th>Note</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => {
                const t = targetName(f, db);
                const removal = f.field === "Removal request";
                const hidden = removal && db.people.find((p) => p.id === f.targetId)?.optedOut;
                return (
                  <tr key={f.id}>
                    <td className="nowrap">
                      {fmtDate(f.created, { month: "short", day: "numeric" })}
                      {removal && f.status === "Open" && <div className="small" style={{ color: daysSince(f.created) >= 2 ? "var(--crit)" : "var(--warm)" }}>Due within 48 h</div>}
                    </td>
                    <td>
                      <span className="pill grey">{f.targetType}</span>{" "}
                      {t.companyId ? <Link to={`/companies/${t.companyId}`}>{t.name}</Link> : t.name}
                    </td>
                    <td>{removal ? <span className="pill crit">Removal request</span> : f.field}</td>
                    <td className="small" style={{ maxWidth: 320 }}>
                      {f.note || <span className="muted">–</span>}
                    </td>
                    <td>
                      <span className={`pill ${f.status === "Open" ? "warm" : f.status === "Fixed" ? "good" : "grey"}`}>{f.status}</span>
                      {f.resolved && <div className="small muted">{fmtDate(f.resolved, { month: "short", day: "numeric" })}</div>}
                    </td>
                    <td className="nowrap">
                      {removal ? (
                        hidden ? (
                          <button className="btn ghost sm" onClick={() => { unhidePerson(f.targetId); set(f, "Open"); }}>
                            Undo
                          </button>
                        ) : (
                          <button className="btn sm" onClick={() => { hidePerson(f.targetId); set(f, "Fixed"); }}>
                            Hide person
                          </button>
                        )
                      ) : f.status === "Open" ? (
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          <button className="btn sm" onClick={() => set(f, "Fixed")}>
                            Fixed
                          </button>
                          <button className="btn ghost sm" onClick={() => set(f, "Rejected")}>
                            Reject
                          </button>
                        </span>
                      ) : (
                        <button className="linkbtn small" onClick={() => set(f, "Open")}>
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function Interest() {
  const { db } = useBridge();
  const rows = db.companies
    .map((c) => ({ c, entries: db.interest.filter((e) => e.companyId === c.id && !e.removed) }))
    .sort((a, b) => b.entries.length - a.entries.length);
  const exportCsv = (companyId: string) => {
    const c = db.companies.find((x) => x.id === companyId)!;
    const entries = db.interest.filter((e) => e.companyId === companyId && !e.removed);
    const lines = [["First name", "Last name", "Email", "Program", "Class year", "Resume file", "Joined", "Consent to share"].join(",")];
    entries.forEach((e) => {
      const u = db.users.find((x) => x.id === e.userId);
      const p = db.profiles.find((x) => x.userId === e.userId);
      lines.push(
        [u?.firstName ?? "", u?.lastName ?? "", u?.email ?? "", p?.program ?? "MBA", p?.classYear ?? "", e.resumeName, e.joined.slice(0, 10), e.consentToShare ? "Yes" : "No"].map(csvCell).join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bridge-interest-list-${c.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="panel">
      <p className="small muted" style={{ marginBottom: 12 }}>
        Every student who joins is on the list, in the order they joined. No screening, no ranking, no cover letters. In the MVP, lists are collected but not sent; the first test is sending one unfiltered list to one willing company.
      </p>
      <div className="tablewrap">
        <table className="t">
          <thead>
            <tr>
              <th>Company</th>
              <th className="num">Students on list</th>
              <th>Latest join</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, entries }) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/companies/${c.id}`}>{c.name}</Link>
                </td>
                <td className="num">{entries.length}</td>
                <td className="small muted">{entries.length ? fmtDate([...entries].sort((a, b) => b.joined.localeCompare(a.joined))[0].joined, { month: "short", day: "numeric" }) : "–"}</td>
                <td>
                  <button className="btn ghost sm" disabled={!entries.length} onClick={() => exportCsv(c.id)}>
                    Export CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataFreshness() {
  const { db, runRefresh, refreshedAt } = useBridge();
  const toast = useToast();
  const unverified = db.roles.filter((r) => roleStatus(r) === "Unverified");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="panel" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ fontSize: 18 }}>Weekly AI data refresh</h2>
          <p className="small muted" style={{ marginTop: 4 }}>
            Re-collects companies, roles and people from careers pages, ATS job feeds, funding announcements, team pages and CBS event pages, and stamps each entry's Last Verified date. A role not re-verified for {UNVERIFIED_AFTER_DAYS} days shows as Unverified.
            {refreshedAt && ` Last run ${fmtDate(refreshedAt)}.`}
          </p>
        </div>
        <button
          className="btn"
          onClick={() => {
            runRefresh();
            toast("Refresh simulated: every open entry re-verified today");
          }}
        >
          Run refresh (simulated)
        </button>
      </div>

      {unverified.length > 0 && (
        <div className="callout warn">
          {unverified.length} {unverified.length === 1 ? "role is" : "roles are"} Unverified: {unverified.map((r) => `${r.titleAsPosted} (${db.companies.find((c) => c.id === r.companyId)?.name})`).join("; ")}.
        </div>
      )}

      <div className="panel">
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Company</th>
                <th>Company verified</th>
                <th className="num">Live roles</th>
                <th className="num">Unverified</th>
                <th className="num">Closed</th>
                <th className="num">Oldest live role check</th>
              </tr>
            </thead>
            <tbody>
              {db.companies.map((c) => {
                const rs = db.roles.filter((r) => r.companyId === c.id);
                const live = liveRoles(c.id, db.roles);
                const oldest = live.length ? Math.max(...live.map((r) => daysSince(r.lastVerified))) : null;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/companies/${c.id}`}>{c.name}</Link>
                    </td>
                    <td className="nowrap">{fmtDate(c.lastVerified, { month: "short", day: "numeric" })}</td>
                    <td className="num">{live.length}</td>
                    <td className="num">{rs.filter((r) => roleStatus(r) === "Unverified").length}</td>
                    <td className="num">{rs.filter((r) => roleStatus(r) === "Closed").length}</td>
                    <td className="num">{oldest === null ? "–" : `${oldest} d`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : "–";
}

function Metrics() {
  const { db, events, localUsers } = useBridge();
  const { start, end } = thisWeekRange();
  const inWeek = (iso: string) => new Date(iso) >= start && new Date(iso) < end;

  const compute = (userIds: Set<string>, sample: boolean) => {
    const ints = db.interactions.filter((i) => userIds.has(i.userId));
    const weekInts = ints.filter((i) => inWeek(i.date));
    const active = new Set(weekInts.map((i) => i.userId));
    const setupDone = [...userIds].filter((id) => db.profiles.some((p) => p.userId === id) || (sample && id.startsWith("u-s"))).length;
    const savedUsers = new Set(db.saved.filter((s) => userIds.has(s.userId)).map((s) => s.userId)).size;
    const draftUsers = new Set([...events.filter((e) => userIds.has(e.userId) && e.type === "draft_opened").map((e) => e.userId), ...(sample ? ints.filter((i) => i.userId.startsWith("u-s") && i.type === "Message sent").map((i) => i.userId) : [])]).size;
    const drafts = events.filter((e) => userIds.has(e.userId) && e.type === "draft_opened").length + (sample ? ints.filter((i) => i.userId.startsWith("u-s") && i.type === "Message sent").length : 0);
    const sent = ints.filter((i) => i.type === "Message sent").length;
    const replies = ints.filter((i) => i.type === "Reply" || i.type === "Coffee chat").length;
    const interestSignups = db.interest.filter((e) => userIds.has(e.userId) && !e.removed).length;
    return { users: userIds.size, active: active.size, perActive: active.size ? weekInts.length / active.size : 0, setupDone, savedUsers, draftUsers, drafts, sent, replies, interestSignups };
  };
  const mine = compute(new Set(localUsers.map((u) => u.id)), false);
  const all = compute(new Set(db.users.map((u) => u.id)), true);

  const loads = db.people
    .filter((p) => !p.optedOut)
    .map((p) => ({ p, n: messagesLast7(p.id, db.interactions) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const cardCount = db.companies.length + db.roles.filter((r) => !r.closed).length;
  const flaggedCards = new Set(db.flags.filter((f) => f.targetType !== "Person").map((f) => f.targetType + f.targetId)).size;
  const liveAges = db.roles.filter((r) => roleStatus(r) === "Live").map((r) => daysSince(r.lastVerified));

  const rows: [string, string, string][] = [
    ["Students who signed in with a CBS email", String(mine.users), String(all.users)],
    ["% who finished set-up", pct(mine.setupDone, mine.users), pct(all.setupDone, all.users)],
    ["% who saved at least one company", pct(mine.savedUsers, mine.users), pct(all.savedUsers, all.users)],
    ["% who drafted a message", pct(mine.draftUsers, mine.users), pct(all.draftUsers, all.users)],
    ["% of drafts marked as sent", pct(mine.sent, mine.drafts), pct(all.sent, all.drafts)],
    ["Replies and coffee chats per message sent", mine.sent ? (mine.replies / mine.sent).toFixed(2) : "–", all.sent ? (all.replies / all.sent).toFixed(2) : "–"],
    ["Interest-list sign-ups", String(mine.interestSignups), String(all.interestSignups)],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="tiles">
        <div className="tile">
          <div className="n">{all.active}</div>
          <div className="l">
            <b>North Star:</b> weekly active seekers (at least one outreach action this week)
          </div>
        </div>
        <div className="tile">
          <div className="n">{all.perActive.toFixed(1)}</div>
          <div className="l">outreach actions per active student this week</div>
        </div>
        <div className="tile">
          <div className="n">{mine.active}</div>
          <div className="l">active seekers in this browser</div>
        </div>
        <div className={`tile${loads[0]?.n >= CONTACT_LOAD_NUDGE ? " alert" : ""}`}>
          <div className="n">{loads[0]?.n ?? 0}</div>
          <div className="l">most messages any contact got this week{loads[0] ? ` (${loads[0].p.name})` : ""}</div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Funnel</h2>
          <table className="t">
            <thead>
              <tr>
                <th>Step</th>
                <th className="num">This browser</th>
                <th className="num">With sample</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([l, a, b]) => (
                <tr key={l}>
                  <td>{l}</td>
                  <td className="num">{a}</td>
                  <td className="num">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: 18 }}>Guardrails</h2>
          <div>
            <div className="sec-title">Messages per contact this week</div>
            <div className="bars">
              {loads.slice(0, 6).map(({ p, n }) => (
                <div className="barrow" key={p.id}>
                  <span>{p.name}</span>
                  <span>
                    <i style={{ width: `${Math.max(4, (n / Math.max(loads[0].n, CONTACT_LOAD_NUDGE)) * 100)}%`, background: n >= CONTACT_LOAD_NUDGE ? "var(--strong)" : undefined }} />
                  </span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 6 }}>
              At {CONTACT_LOAD_NUDGE}+ a week the person drawer nudges students toward the interest list. If a contact stays above {CONTACT_LOAD_NUDGE}, make the interest list the default route for that company.
            </p>
          </div>
          <div className="stat-row">
            <div className="stat">
              <div className="n">{pct(flaggedCards, cardCount)}</div>
              <div className="l">of company and role cards flagged as wrong</div>
            </div>
            <div className="stat">
              <div className="n">{liveAges.length ? Math.max(...liveAges) : 0} d</div>
              <div className="l">longest since a live role was verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
