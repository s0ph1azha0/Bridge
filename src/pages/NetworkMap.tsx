import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge } from "../lib/store";
import { fmtMonth, initials, peopleCards, type PersonCardData } from "../lib/compute";
import { TiePill } from "../components/ui";

const LABEL_ORDER = { Strong: 3, Warm: 2, Light: 1, None: 0 } as const;

/** Requirement 6: the student at the center, the companies they connect to, and the warm intros they can reach for each. */
export default function NetworkMap() {
  const { db, profile, mySaved } = useBridge();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<"all" | "pipeline">(mySaved.length ? "pipeline" : "all");
  const [minStrength, setMin] = useState<1 | 2 | 3>(1);
  const [sel, setSel] = useState<string | null>(null);

  const savedIds = new Set(mySaved.map((s) => s.companyId));
  const groups = useMemo(() => {
    return db.companies
      .filter((c) => scope === "all" || savedIds.has(c.id))
      .map((c) => ({ c, cards: peopleCards(c.id, profile, db).filter((p) => p.tie.strength >= minStrength).slice(0, 4) }))
      .sort((a, b) => (b.cards[0]?.tie.strength ?? 0) - (a.cards[0]?.tie.strength ?? 0) || b.cards.length - a.cards.length || a.c.name.localeCompare(b.c.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, profile, scope, minStrength, mySaved]);

  const openPerson = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("person", id);
    setParams(next);
  };

  const all = groups.flatMap((g) => g.cards.map((p) => ({ ...p, company: g.c })));
  const counts = { Strong: all.filter((p) => p.tie.label === "Strong").length, Warm: all.filter((p) => p.tie.label === "Warm").length, Light: all.filter((p) => p.tie.label === "Light").length };
  const top = [...all].sort((a, b) => b.tie.strength - a.tie.strength || a.msgs7 - b.msgs7).slice(0, 5);
  const selected = groups.find((g) => g.c.id === sel);

  // Layout: companies on the outer ring; their people fanned toward the center on two
  // alternating radii so neighbors never overlap, even with every company shown.
  const N = Math.max(groups.length, 1);
  const cx = 500, cy = 430, rA = 190, rB = 245, r2 = 330;
  const spread = Math.min(0.16, (2 * Math.PI) / N / 4.4);
  const pos = new Map<string, { x: number; y: number }>();
  let k = 0;
  groups.forEach((g, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
    g.cards.forEach((p, j) => {
      const pa = a + (j - (g.cards.length - 1) / 2) * spread;
      const r = k++ % 2 === 0 ? rA : rB;
      pos.set(g.c.id + p.person.id, { x: cx + r * Math.cos(pa), y: cy + r * Math.sin(pa) });
    });
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Network map</h1>
          <p>You're in the center. The inner ring is the CBS people you can reach, colored by how strong your tie is. The outer ring is the companies they can open.</p>
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
              Your pipeline is empty. Save companies from the <Link to="/companies">directory</Link>, or switch to All companies.
            </div>
          ) : (
            <svg className="net" viewBox="0 0 1000 860" role="group" aria-label="Network map of your CBS paths into NYC startups" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
              <circle className="ring" cx={cx} cy={cy} r={(rA + rB) / 2} />
              <circle className="ring" cx={cx} cy={cy} r={r2} />
              {groups.map((g, i) => {
                const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
                const sx = cx + r2 * Math.cos(a), sy = cy + r2 * Math.sin(a);
                const dim = sel && sel !== g.c.id ? " dim" : "";
                return (
                  <g key={g.c.id}>
                    {g.cards.map((p) => {
                      const { x: px, y: py } = pos.get(g.c.id + p.person.id)!;
                      const cls = p.tie.label.toLowerCase();
                      return (
                        <g key={p.person.id}>
                          <line className={cls + dim} x1={cx} y1={cy} x2={px} y2={py} />
                          <line className={"ps" + dim} x1={px} y1={py} x2={sx} y2={sy} />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              {groups.map((g, i) => {
                const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
                const co = Math.cos(a), si = Math.sin(a);
                const sx = cx + r2 * co, sy = cy + r2 * si;
                const dim = sel && sel !== g.c.id ? " dim" : "";
                const anchor = co > 0.3 ? "start" : co < -0.3 ? "end" : "middle";
                const nudge = anchor !== "middle" && Math.abs(si) > 0.7 ? (anchor === "start" ? 16 : -16) : 0;
                const lx = cx + (r2 + 32) * co + nudge, ly = cy + (r2 + 32) * si + (anchor === "middle" ? (si < 0 ? -12 : 10) : 0);
                return (
                  <g key={g.c.id}>
                    {g.cards.map((p) => {
                      const { x: px, y: py } = pos.get(g.c.id + p.person.id)!;
                      return (
                        <g
                          key={p.person.id}
                          className={`n p ${p.tie.label.toLowerCase()}${dim}`}
                          tabIndex={0}
                          role="button"
                          aria-label={`${p.person.name}, ${p.position.title} at ${g.c.name}, ${p.tie.label} tie`}
                          onClick={() => openPerson(p.person.id)}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openPerson(p.person.id))}
                        >
                          <title>{`${p.person.name}, ${p.position.title}. ${p.tie.label} tie.`}</title>
                          <circle cx={px} cy={py} r={13} />
                          <text x={px} y={py + 3.8}>
                            {initials(p.person.name)}
                          </text>
                        </g>
                      );
                    })}
                    <g
                      className={`n s${savedIds.has(g.c.id) ? " saved" : ""}${sel === g.c.id ? " on" : ""}${dim}`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${g.c.name}, ${g.cards.length} paths`}
                      onClick={() => setSel(sel === g.c.id ? null : g.c.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(sel === g.c.id ? null : g.c.id))}
                    >
                      <circle cx={sx} cy={sy} r={22} style={g.cards.length ? undefined : { fill: "var(--surface)", stroke: "var(--line-2)", strokeDasharray: "4 4" }} />
                      <text className="ini" x={sx} y={sy + 4} style={g.cards.length ? undefined : { fill: "var(--muted)" }}>
                        {g.c.name.slice(0, 2).toUpperCase()}
                      </text>
                      <text className="lbl" textAnchor={anchor} x={lx} y={ly}>
                        {g.c.name}
                      </text>
                      <text className="sub" textAnchor={anchor} x={lx} y={ly + 16}>
                        {g.c.stage} · {g.cards.length ? `${g.cards.length} ${g.cards.length === 1 ? "path" : "paths"}` : "no path yet"}
                      </text>
                    </g>
                  </g>
                );
              })}
              <g className="you">
                <circle cx={cx} cy={cy} r={36} />
                <text x={cx} y={cy + 5}>
                  You
                </text>
              </g>
            </svg>
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
                <p className="small muted">No CBS path at this strength. Try "All ties", or join the company's interest list.</p>
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
                {all.length} {all.length === 1 ? "person" : "people"} into {groups.filter((g) => g.cards.length).length} companies
              </h2>
              <div className="tags">
                <span className="pill strong">{counts.Strong} strong</span>
                <span className="pill warm">{counts.Warm} warm</span>
                <span className="pill light">{counts.Light} light</span>
              </div>
              <div>
                <div className="sec-title">Your strongest paths</div>
                <PathList items={top} onOpen={openPerson} showCompany />
              </div>
              <p className="small muted">Select a company to see its paths. Select a person to draft a message.</p>
            </>
          )}
          <div className="legend" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div>
              <i className="l3" />
              Strong: CBS alum who shares an employer or club with you, or a speaker from your past employer
            </div>
            <div>
              <i className="l2" />
              Warm: CBS alum, or a speaker at a club you're in
            </div>
            <div>
              <i className="l1" />
              Light: campus or club speaker
            </div>
            <div>
              <i className="cs" />
              In your pipeline
            </div>
            <div>
              <i className="cn" />
              Not saved yet
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function PathList({ items, onOpen, showCompany }: { items: (PersonCardData & { company?: { name: string } })[]; onOpen: (id: string) => void; showCompany?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[...items]
        .sort((a, b) => LABEL_ORDER[b.tie.label] - LABEL_ORDER[a.tie.label])
        .map((p) => (
          <button key={p.person.id} className="card" style={{ textAlign: "left", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }} onClick={() => onOpen(p.person.id)}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <b>{p.person.name}</b>
              <TiePill tie={p.tie} />
            </span>
            <span className="small" style={{ color: "var(--ink-2)" }}>
              {p.position.title}
              {showCompany && p.company ? `, ${p.company.name}` : ""}
            </span>
            {p.tie.reasons[0] && <span className="small muted">{p.tie.reasons[0].text}</span>}
          </button>
        ))}
    </div>
  );
}
