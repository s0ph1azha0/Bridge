import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge } from "../lib/store";
import { fmtMonth, peopleCards, TIE_RULE, type PersonCardData } from "../lib/compute";
import { TiePill } from "../components/ui";
import { NetSvg, TieLegend } from "../components/NetSvg";

const LABEL_ORDER = { Strong: 3, Warm: 2, Light: 1, None: 0 } as const;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Requirement 6: the student at the center, the companies they connect to, and the warm intros they can reach for each. */
export default function NetworkMap() {
  const { db, profile, mySaved } = useBridge();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<"all" | "pipeline">(params.get("scope") === "all" || !mySaved.length ? "all" : "pipeline");
  const [minStrength, setMin] = useState<1 | 2 | 3>(params.get("min") === "3" ? 3 : 1);
  const [sel, setSel] = useState<string | null>(null);

  const savedIds = useMemo(() => new Set(mySaved.map((s) => s.companyId)), [mySaved]);
  const groups = useMemo(
    () =>
      db.companies
        .filter((c) => scope === "all" || savedIds.has(c.id))
        .map((c) => ({ c, cards: peopleCards(c.id, profile, db).filter((p) => p.tie.strength >= minStrength).slice(0, 4) }))
        .filter((g) => minStrength === 1 || g.cards.length)
        .sort((a, b) => (b.cards[0]?.tie.strength ?? 0) - (a.cards[0]?.tie.strength ?? 0) || b.cards.length - a.cards.length || a.c.name.localeCompare(b.c.name)),
    [db, profile, scope, minStrength, savedIds]
  );

  const openPerson = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("person", id);
    setParams(next);
  };

  const all = groups.flatMap((g) => g.cards.map((p) => ({ ...p, company: g.c })));
  const counts = { Strong: all.filter((p) => p.tie.label === "Strong").length, Warm: all.filter((p) => p.tie.label === "Warm").length, Light: all.filter((p) => p.tie.label === "Light").length };
  const top = [...all].sort((a, b) => b.tie.strength - a.tie.strength || a.msgs7 - b.msgs7).slice(0, 5);
  const selected = groups.find((g) => g.c.id === sel);
  const reached = groups.filter((g) => g.cards.length).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Network map</h1>
          <p>You're in the center. The inner ring is the CBS people you can reach, colored by tie strength. The outer ring is the companies they can open.</p>
        </div>
      </div>

      <div className="toolbar" style={{ gap: 14 }}>
        <div className="seg" role="group" aria-label="Which companies">
          <button aria-pressed={scope === "pipeline"} onClick={() => setScope("pipeline")}>
            My pipeline ({mySaved.length})
          </button>
          <button aria-pressed={scope === "all"} onClick={() => setScope("all")}>
            All companies
          </button>
        </div>
        <div className="seg" role="group" aria-label="Tie strength">
          <button aria-pressed={minStrength === 1} onClick={() => setMin(1)}>
            All ties
          </button>
          <button aria-pressed={minStrength === 2} onClick={() => setMin(2)}>
            Warm and strong
          </button>
          <button aria-pressed={minStrength === 3} onClick={() => setMin(3)}>
            Strong only
          </button>
        </div>
      </div>

      <div className="netgrid">
        <div className="netbox">
          {groups.length === 0 ? (
            <div className="empty" style={{ margin: 20 }}>
              {scope === "pipeline" ? (
                <>
                  Your pipeline is empty. Save companies from the <Link to="/companies">directory</Link>, or switch to All companies.
                </>
              ) : (
                "No ties at this strength yet. Try All ties."
              )}
            </div>
          ) : (
            <NetSvg groups={groups} savedIds={savedIds} selected={sel} onCompany={(id) => setSel(sel === id ? null : id)} onPerson={openPerson} />
          )}
        </div>

        <aside className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {selected ? (
            <>
              <div>
                <div className="eyebrow">{selected.c.sector}</div>
                <h2 style={{ fontSize: 22, marginTop: 4 }}>{selected.c.name}</h2>
                <p className="small" style={{ color: "var(--ink-2)", marginTop: 4 }}>
                  {selected.c.oneLiner}
                </p>
                <div className="facts" style={{ marginTop: 6 }}>
                  <span>{selected.c.stage}</span>
                  <span>Last round {fmtMonth(selected.c.lastRoundDate)}</span>
                </div>
              </div>
              {selected.cards.length ? (
                <PathList items={selected.cards} onOpen={openPerson} />
              ) : (
                <p className="small muted">No CBS path at this strength. Try All ties, or join the company's interest list.</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link to={`/companies/${selected.c.id}`} className="btn sm">
                  Open company page
                </Link>
                <button className="btn ghost sm" onClick={() => setSel(null)}>
                  Show the whole map
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20 }}>
                {plural(all.length, "person", "people")} into {plural(reached, "company", "companies")}
              </h2>
              <div className="tags">
                <span className="pill strong">{counts.Strong} strong</span>
                <span className="pill warm">{counts.Warm} warm</span>
                <span className="pill light">{counts.Light} light</span>
              </div>
              {top.length > 0 && (
                <div>
                  <div className="sec-title">Your strongest paths</div>
                  <PathList items={top} onOpen={openPerson} showCompany />
                </div>
              )}
              <p className="small muted">Select a company to see its paths. Select a person to draft a message.</p>
            </>
          )}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="small muted">{TIE_RULE.summary}</p>
            <TieLegend />
          </div>
        </aside>
      </div>
    </>
  );
}

export function PathList({ items, onOpen, showCompany }: { items: (PersonCardData & { company?: { name: string } })[]; onOpen: (id: string) => void; showCompany?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[...items]
        .sort((a, b) => LABEL_ORDER[b.tie.label] - LABEL_ORDER[a.tie.label])
        .map((p) => {
          const reason = p.tie.reasons.find((r) => r.relevant) ?? p.tie.reasons[0];
          return (
            <button key={p.person.id} className="card" style={{ textAlign: "left", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }} onClick={() => onOpen(p.person.id)}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <b>{p.person.name}</b>
                <TiePill tie={p.tie} />
              </span>
              <span className="small" style={{ color: "var(--ink-2)" }}>
                {p.position.title}
                {showCompany && p.company ? `, ${p.company.name}` : ""}
              </span>
              {reason && <span className="small muted">{reason.text}</span>}
            </button>
          );
        })}
    </div>
  );
}
