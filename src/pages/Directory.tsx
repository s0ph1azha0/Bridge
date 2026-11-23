import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { FUNCTIONS, fnName } from "../data/helpers";
import type { JobType, Stage, VisaStated } from "../data/types";
import { cbsTieCount, fmtMonth, functionsHired, jobTypes, liveRoles, peopleCards, visaRollup } from "../lib/compute";
import { CompanyLogo, Icon, TiePill, VisaLabel } from "../components/ui";

const STAGES: Stage[] = ["Seed", "Series A", "Series B", "Series C", "Series D+"];
const TYPES: JobType[] = ["Full-time", "Internship", "Part-time"];
const VISAS: { v: VisaStated; label: string }[] = [
  { v: "Yes", label: "Stated yes" },
  { v: "No", label: "Stated no" },
  { v: "Not stated", label: "Not stated" },
];

/** Screen 2: find companies worth pursuing. */
export default function Directory() {
  const { db, profile, savedFor, toggleSave } = useBridge();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => (params.get(k) ? params.get(k)!.split(",") : []);
  const fns = get("fn"), stages = get("stage"), types = get("type"), visas = get("visa");
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "ties";

  const set = (k: string, v: string[] | string) => {
    const next = new URLSearchParams(params);
    const val = Array.isArray(v) ? v.join(",") : v;
    if (val) next.set(k, val);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const toggle = (k: string, list: string[], id: string) => set(k, list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const rows = useMemo(() => {
    const items = db.companies.map((c) => {
      const cards = peopleCards(c.id, profile, db);
      return {
        c,
        ties: cbsTieCount(c.id, db),
        best: cards[0]?.tie ?? null,
        hired: functionsHired(c, db.roles),
        types: jobTypes(c.id, db.roles),
        visa: visaRollup(c.id, db.roles),
        live: liveRoles(c.id, db.roles),
      };
    });
    const ql = q.trim().toLowerCase();
    return items
      .filter((x) => !fns.length || fns.some((f) => x.hired.includes(f)))
      .filter((x) => !stages.length || stages.includes(x.c.stage))
      .filter((x) => !types.length || types.some((t) => x.types.includes(t as JobType)))
      .filter((x) => !visas.length || visas.includes(x.visa))
      .filter(
        (x) =>
          !ql ||
          [x.c.name, x.c.oneLiner, x.c.sector, x.c.hq, ...x.live.map((r) => r.titleAsPosted), ...x.hired.map(fnName)].join(" ").toLowerCase().includes(ql)
      )
      .sort((a, b) => (sort === "round" ? b.c.lastRoundDate.localeCompare(a.c.lastRoundDate) : b.ties - a.ties || (b.best?.strength ?? 0) - (a.best?.strength ?? 0)) || a.c.name.localeCompare(b.c.name));
  }, [db, profile, fns, stages, types, visas, q, sort]);

  const targets = profile?.targetFunctions ?? [];
  const mineOn = targets.length > 0 && targets.every((t) => fns.includes(t)) && fns.length === targets.length;
  const anyFilter = fns.length + stages.length + types.length + visas.length > 0 || !!q;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>NYC startups</h1>
          <p>
            {db.companies.length} high-growth, venture-backed companies. Start from the company, so a role is never missed because of what it's called.
          </p>
        </div>
      </div>

      <div className="dir">
        <aside className="filters" aria-label="Filters">
          <div className="grp">
            <div className="sec-title" style={{ margin: 0 }}>Function hired</div>
            {targets.length > 0 && (
              <button className="linkbtn small" style={{ alignSelf: "flex-start" }} onClick={() => set("fn", mineOn ? [] : targets)}>
                {mineOn ? "Clear my target functions" : "Show my target functions"}
              </button>
            )}
            <div className="chips">
              {FUNCTIONS.map((f) => (
                <button key={f.id} className="chip" aria-pressed={fns.includes(f.id)} onClick={() => toggle("fn", fns, f.id)}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grp">
            <div className="sec-title" style={{ margin: 0 }}>Stage</div>
            <div className="chips">
              {STAGES.map((s) => (
                <button key={s} className="chip" aria-pressed={stages.includes(s)} onClick={() => toggle("stage", stages, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grp">
            <div className="sec-title" style={{ margin: 0 }}>Job type</div>
            <div className="chips">
              {TYPES.map((t) => (
                <button key={t} className="chip" aria-pressed={types.includes(t)} onClick={() => toggle("type", types, t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grp">
            <div className="sec-title" style={{ margin: 0 }}>Visa sponsorship</div>
            <div className="chips">
              {VISAS.map(({ v, label }) => (
                <button key={v} className="chip" aria-pressed={visas.includes(v)} onClick={() => toggle("visa", visas, v)}>
                  {label}
                </button>
              ))}
            </div>
            <span className="small muted">As stated on live postings only.</span>
          </div>
          {anyFilter && (
            <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setParams(new URLSearchParams(sort !== "ties" ? { sort } : {}), { replace: true })}>
              Clear all filters
            </button>
          )}
        </aside>

        <section>
          <div className="toolbar">
            <input className="input" type="search" placeholder="Search companies, sectors or posted titles" value={q} onChange={(e) => set("q", e.target.value)} aria-label="Search companies" />
            <label className="small muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              Sort
              <select className="select" style={{ width: "auto" }} value={sort} onChange={(e) => set("sort", e.target.value === "ties" ? "" : e.target.value)}>
                <option value="ties">Most CBS ties</option>
                <option value="round">Most recent round</option>
              </select>
            </label>
          </div>
          <div className="toolbar">
            <span className="count">
              {rows.length} {rows.length === 1 ? "company" : "companies"}
            </span>
          </div>

          <div className="colist">
            {rows.length === 0 && <div className="empty">No companies match these filters. Clear a filter to see more.</div>}
            {rows.map(({ c, ties, best, hired, visa, live }) => {
              const saved = !!savedFor(c.id);
              return (
                <article key={c.id} className="card co" style={{ position: "relative" }}>
                  <CompanyLogo name={c.name} />
                  <div style={{ minWidth: 0 }}>
                    <div className="top">
                      <h3>
                        <Link to={`/companies/${c.id}`} style={{ color: "inherit", textDecoration: "none" }} className="stretch">
                          {c.name}
                        </Link>
                      </h3>
                      <span className="small muted">
                        {c.stage} · last round {fmtMonth(c.lastRoundDate)}
                      </span>
                    </div>
                    <p className="one">{c.oneLiner}</p>
                    <div className="tags">
                      {hired.map((f) => (
                        <span key={f} className={`tag${targets.includes(f) ? " mine" : ""}`} title={targets.includes(f) ? "One of your target functions" : undefined}>
                          {fnName(f)}
                        </span>
                      ))}
                    </div>
                    <div className="meta">
                      <span className="ties">
                        {Icon.people()} {ties} CBS {ties === 1 ? "tie" : "ties"}
                      </span>
                      <VisaLabel v={visa} />
                      <span>
                        {live.length ? `${live.length} open business ${live.length === 1 ? "role" : "roles"}` : "No business roles posted"}
                      </span>
                      {best && <TiePill tie={best} suffix=" for you" />}
                    </div>
                  </div>
                  <div className="side">
                    <button
                      className={`heart${saved ? " on" : ""}`}
                      style={{ position: "relative", zIndex: 2 }}
                      aria-pressed={saved}
                      aria-label={saved ? `Remove ${c.name} from my pipeline` : `Save ${c.name} to my pipeline`}
                      title={saved ? "Saved to your pipeline" : "Save to your pipeline"}
                      onClick={() => {
                        toggleSave(c.id);
                        toast(saved ? `${c.name} removed from your pipeline` : `${c.name} saved to your pipeline`);
                      }}
                    >
                      {Icon.heart(saved)}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
