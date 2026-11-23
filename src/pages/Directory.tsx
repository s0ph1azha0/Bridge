import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { FUNCTIONS, fnName } from "../data/helpers";
import type { JobType, Stage, VisaStated } from "../data/types";
import { FUNDING_BANDS, UNICORN, fmtMonth, money, stepUp } from "../lib/compute";
import { SORTS, companyRows, sortForPriority, sortRows } from "../lib/match";
import { CompanyLogo, Dialog, Icon, TiePill, VisaLabel } from "../components/ui";

const STAGES: Stage[] = ["Seed", "Series A", "Series B", "Series C", "Series D+"];
const TYPES: JobType[] = ["Full-time", "Internship", "Part-time"];
const VISAS: { v: VisaStated; label: string }[] = [
  { v: "Yes", label: "Stated yes" },
  { v: "No", label: "Stated no" },
  { v: "Not stated", label: "Not stated" },
];

/** Screen 2: find companies worth pursuing. Set-up answers apply by default (P1, P3). */
export default function Directory() {
  const { db, profile, savedFor, toggleSave } = useBridge();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const targets = profile?.targetFunctions ?? [];
  const visaDefault: string[] = profile?.needsVisa ? ["Yes", "Not stated"] : [];

  // A missing param means "use my set-up"; "any" means the student cleared it.
  const listParam = (k: string, dflt: string[]) => {
    const v = params.get(k);
    return v === null ? dflt : v === "any" ? [] : v.split(",");
  };
  const fns = listParam("fn", targets);
  const visas = listParam("visa", visaDefault);
  const stages = listParam("stage", []);
  const types = listParam("type", []);
  const fund = params.get("fund") ?? "";
  const unicorn = params.get("unicorn") === "1";
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? sortForPriority(profile?.priority);

  const set = (entries: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(entries).forEach(([k, v]) => (v === null || v === "" ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };
  const toggle = (k: string, list: string[], id: string) => {
    const nextList = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    set({ [k]: nextList.length ? nextList.join(",") : "any" });
  };

  const all = useMemo(() => companyRows(db, profile), [db, profile]);
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const minRaised = FUNDING_BANDS.find((b) => b.id === fund)?.min ?? 0;
    return sortRows(
      all
        .filter((x) => !fns.length || fns.some((f) => x.hired.includes(f)))
        .filter((x) => !stages.length || stages.includes(x.c.stage))
        .filter((x) => !types.length || types.some((t) => x.types.includes(t)))
        .filter((x) => !visas.length || visas.includes(x.visa))
        .filter((x) => x.c.totalRaised >= minRaised)
        .filter((x) => !unicorn || (x.c.lastValuation ?? 0) >= UNICORN)
        .filter((x) => !ql || [x.c.name, x.c.oneLiner, x.c.sector, x.c.hq, ...x.live.map((r) => r.titleAsPosted), ...x.hired.map(fnName)].join(" ").toLowerCase().includes(ql)),
      sort
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, fns.join(), stages.join(), types.join(), visas.join(), fund, unicorn, q, sort]);

  const usingTargets = params.get("fn") === null && targets.length > 0;
  const usingVisa = params.get("visa") === null && !!profile?.needsVisa;
  const nFilters = fns.length + stages.length + types.length + visas.length + (fund ? 1 : 0) + (unicorn ? 1 : 0);
  const clearAll = () => set({ fn: "any", visa: "any", stage: null, type: null, fund: null, unicorn: null, q: null });

  const filters = (
    <>
      <div className="grp">
        <div className="sec-title" style={{ margin: 0 }}>
          Function hired
        </div>
        <div className="chips">
          {FUNCTIONS.map((f) => (
            <button key={f.id} className="chip" aria-pressed={fns.includes(f.id)} onClick={() => toggle("fn", fns, f.id)}>
              {f.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <div className="sec-title" style={{ margin: 0 }}>
          Total raised
        </div>
        <div className="chips">
          {FUNDING_BANDS.map((b) => (
            <button key={b.id} className="chip" aria-pressed={fund === b.id} onClick={() => set({ fund: fund === b.id ? null : b.id })}>
              {b.label}
            </button>
          ))}
          <button className="chip" aria-pressed={unicorn} onClick={() => set({ unicorn: unicorn ? null : "1" })}>
            Valued $1B+
          </button>
        </div>
      </div>
      <div className="grp">
        <div className="sec-title" style={{ margin: 0 }}>
          Visa sponsorship
        </div>
        <div className="chips">
          {VISAS.map(({ v, label }) => (
            <button key={v} className="chip" aria-pressed={visas.includes(v)} onClick={() => toggle("visa", visas, v)}>
              {label}
            </button>
          ))}
        </div>
        <span className="small muted">As stated on live postings only.</span>
      </div>
      <div className="grp">
        <div className="sec-title" style={{ margin: 0 }}>
          Job type
        </div>
        <div className="chips">
          {TYPES.map((t) => (
            <button key={t} className="chip" aria-pressed={types.includes(t)} onClick={() => toggle("type", types, t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <div className="sec-title" style={{ margin: 0 }}>
          Round
        </div>
        <div className="chips">
          {STAGES.map((s) => (
            <button key={s} className="chip" aria-pressed={stages.includes(s)} onClick={() => toggle("stage", stages, s)}>
              {s}
            </button>
          ))}
        </div>
        <span className="small muted">Round names can mislead: some seed rounds value a company at $1B+. Total raised is the better signal.</span>
      </div>
      {nFilters > 0 && (
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </>
  );

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
          {filters}
        </aside>

        <section>
          <div className="toolbar">
            <input className="input" type="search" placeholder="Search companies, sectors or posted titles" value={q} onChange={(e) => set({ q: e.target.value })} aria-label="Search companies" />
            <button className="btn ghost filters-btn" onClick={() => setSheet(true)}>
              Filters{nFilters ? ` (${nFilters})` : ""}
            </button>
            <label className="sortlbl">
              <span className="small muted">Sort</span>
              <select className="select" value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort companies">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(usingTargets || usingVisa) && (
            <div className="applied">
              <span>
                Matched to your set-up:{" "}
                {usingTargets && (
                  <>
                    hiring for <b>{targets.map(fnName).join(" or ")}</b>
                  </>
                )}
                {usingTargets && usingVisa && ", "}
                {usingVisa && <>hiding companies whose roles state no visa sponsorship</>}.
              </span>
              <button className="linkbtn small" onClick={() => set({ fn: "any", visa: "any" })}>
                Show all companies
              </button>
            </div>
          )}

          <div className="toolbar">
            <span className="count">
              {rows.length} {rows.length === 1 ? "company" : "companies"}
            </span>
          </div>

          <div className="colist">
            {rows.length === 0 && (
              <div className="empty">
                No companies match these filters.{" "}
                <button className="linkbtn" onClick={clearAll}>
                  Clear all filters
                </button>
              </div>
            )}
            {rows.map(({ c, ties, best, hired, visa, live, targetRoles }) => {
              const saved = !!savedFor(c.id);
              const step = stepUp(c);
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
                        {c.lastRoundName} · {fmtMonth(c.lastRoundDate)}
                      </span>
                    </div>
                    <p className="one">{c.oneLiner}</p>
                    <div className="money">
                      <span>
                        <b>{money(c.totalRaised)}</b> raised
                      </span>
                      <span>
                        {c.lastValuation ? (
                          <>
                            <b>{money(c.lastValuation)}</b> valuation
                          </>
                        ) : (
                          "Valuation undisclosed"
                        )}
                      </span>
                      {step !== null && step >= 1.5 && <span>{step.toFixed(1)}× step-up</span>}
                      {c.headcountGrowth6m !== null && c.headcountGrowth6m >= 20 && <span>+{c.headcountGrowth6m}% team in 6 months</span>}
                    </div>
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
                        {targetRoles.length
                          ? `${targetRoles.length} ${targetRoles.length === 1 ? "role" : "roles"} in your functions`
                          : live.length
                            ? `${live.length} open business ${live.length === 1 ? "role" : "roles"}`
                            : "No business roles posted"}
                      </span>
                      {best ? <TiePill tie={best.tie} suffix=" for you" /> : <span className="pill none">No warm path yet</span>}
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

      {sheet && (
        <Dialog title="Filters" onClose={() => setSheet(false)}>
          <div className="filters sheet-filters">{filters}</div>
          <button className="btn accent" onClick={() => setSheet(false)}>
            Show {rows.length} {rows.length === 1 ? "company" : "companies"}
          </button>
        </Dialog>
      )}
    </>
  );
}
