import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge } from "../lib/store";
import { fnName } from "../data/helpers";
import { money, peopleCards, responsiveness } from "../lib/compute";
import { companyRows, firstDoors } from "../lib/match";
import { Avatar, CompanyLogo, Icon, TiePill, tieClass, VisaLabel } from "../components/ui";
import { NetSvg } from "../components/NetSvg";
import { RespondTag } from "../components/PersonCard";

/** A1: the first screen after set-up. Three named warm contacts at companies hiring for a target role, one click from a draft. */
export default function ForYou() {
  const { db, user, profile, mySaved } = useBridge();
  const [params, setParams] = useSearchParams();
  const rows = useMemo(() => companyRows(db, profile), [db, profile]);
  const doors = useMemo(() => firstDoors(rows, profile), [rows, profile]);
  const strongGroups = useMemo(
    () =>
      db.companies
        .map((c) => ({ c, cards: peopleCards(c.id, profile, db).filter((p) => p.tie.label === "Strong").slice(0, 3) }))
        .filter((g) => g.cards.length)
        .sort((a, b) => b.cards.length - a.cards.length || a.c.name.localeCompare(b.c.name)),
    [db, profile]
  );
  const strongCount = strongGroups.reduce((s, g) => s + g.cards.length, 0);
  const savedIds = new Set(mySaved.map((s) => s.companyId));
  const targets = (profile?.targetFunctions ?? []).map((f) => fnName(f).toLowerCase());

  const openPerson = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("person", id);
    setParams(next);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">For you</div>
          <h1>{user?.firstName ? `${user.firstName}, here are your first 3 doors` : "Your first 3 doors"}</h1>
          <p>
            Companies hiring for {targets.length ? targets.join(" or ") : "your target roles"}, each with the warmest CBS person to contact first. Draft a message in one click and send it yourself.
          </p>
        </div>
        <Link to="/companies" className="btn ghost">
          Browse all {db.companies.length} companies
        </Link>
      </div>

      {doors.length === 0 ? (
        <div className="empty">
          No warm paths match your set-up yet. <Link to="/companies">Browse all companies</Link> or <Link to="/setup">add clubs and past employers</Link> to find more ties.
        </div>
      ) : (
        <div className="doors">
          {doors.map(({ row, person, role }, i) => {
            const first = person.person.name.split(" ")[0];
            const reasons = person.tie.reasons.filter((r) => r.relevant).slice(0, 2);
            const resp = responsiveness(person.person.id, db.interactions);
            return (
              <article key={row.c.id} className="card door">
                <div className="door-n mono">Door {i + 1}</div>
                <header>
                  <CompanyLogo name={row.c.name} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/companies/${row.c.id}`} className="door-co">
                      {row.c.name}
                    </Link>
                    <div className="small muted">
                      {row.c.stage} · {money(row.c.totalRaised)} raised{row.c.lastValuation ? ` · valued ${money(row.c.lastValuation)}` : ""}
                    </div>
                  </div>
                </header>
                {role ? (
                  <div className="door-role">
                    <span className="small muted">Hiring</span>
                    <b>{role.titleAsPosted}</b>
                    <span className="small">
                      {role.jobType}
                      {profile?.needsVisa && (
                        <>
                          {" · "}
                          <VisaLabel v={role.visaStated} />
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="door-role">
                    <span className="small muted">Hiring areas</span>
                    <b>{row.hired.map(fnName).join(", ")}</b>
                    <span className="small muted">No posted role in your functions yet. Many startups hire before they post.</span>
                  </div>
                )}
                <div className="door-person">
                  <Avatar name={person.person.name} tone={tieClass(person.tie)} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{person.person.name}</b>
                      <TiePill tie={person.tie} />
                      <RespondTag r={resp} />
                    </div>
                    <div className="small" style={{ color: "var(--ink-2)" }}>
                      {person.position.title}
                    </div>
                    <ul className="why">
                      {reasons.map((r, j) => (
                        <li key={j}>{r.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button className="btn accent" onClick={() => openPerson(person.person.id)}>
                  {Icon.send()} Draft a message to {first}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <section className="panel" style={{ marginTop: 22 }} aria-labelledby="h-strong">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <div>
            <h2 id="h-strong" style={{ fontSize: 20 }}>
              Your strong ties
            </h2>
            <p className="small muted" style={{ marginTop: 4 }}>
              {strongCount
                ? `${strongCount} strong ${strongCount === 1 ? "tie" : "ties"} across ${strongGroups.length} ${strongGroups.length === 1 ? "company" : "companies"}. Select a person to draft a message.`
                : "No strong ties yet. Adding clubs and past employers in your set-up finds more."}
            </p>
          </div>
          <Link to="/map" className="btn ghost sm">
            Open the full map
          </Link>
        </div>
        {strongGroups.length > 0 && (
          <div className="mini-map">
            <NetSvg groups={strongGroups.slice(0, 10)} savedIds={savedIds} onPerson={openPerson} compact />
          </div>
        )}
      </section>
    </>
  );
}
