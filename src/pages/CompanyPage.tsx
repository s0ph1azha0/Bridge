import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { fnName } from "../data/helpers";
import { PIPELINE_STAGES, type PipelineStage, type Role } from "../data/types";
import {
  cbsTieCount,
  fmtDate,
  fmtMonth,
  functionsHired,
  monthsSinceRound,
  money,
  newRoles30d,
  peopleCards,
  TIE_RULE,
  roleStatus,
  stepUp,
  tieCountsByType,
} from "../lib/compute";
import { CompanyLogo, ExtLink, Icon, Source, VisaLabel } from "../components/ui";
import PersonCard from "../components/PersonCard";
import FlagDialog from "../components/FlagDialog";
import InterestDialog from "../components/InterestDialog";

/** Words that, if missing from a posted title, mean the AI mapping is doing real work. */
const FN_WORDS: Record<string, RegExp> = {
  product: /product/i,
  "strategy-ops": /strateg|operat|bizops|biz ops/i,
  growth: /growth/i,
  "chief-of-staff": /chief of staff/i,
  gtm: /go-to-market|gtm|sales|revenue|account/i,
  bizdev: /partner|business development|bd|alliance/i,
};

/** Screen 2A: the company page. */
export default function CompanyPage() {
  const { id } = useParams();
  const { db, profile, savedFor, toggleSave, setStage, myInterest, myInteractions } = useBridge();
  const toast = useToast();
  const [flag, setFlag] = useState<null | { type: "Company" | "Role"; id: string }>(null);
  const [joining, setJoining] = useState(false);

  const c = db.companies.find((x) => x.id === id);
  if (!c) return <Navigate to="/companies" replace />;

  const saved = savedFor(c.id);
  const joined = myInterest(c.id);
  const cards = peopleCards(c.id, profile, db);
  const counts = tieCountsByType(cards);
  const allRoles = db.roles.filter((r) => r.companyId === c.id);
  // P3: a student who needs sponsorship sees "Stated no" roles last, still exactly as posted.
  const visaLast = (r: Role) => (profile?.needsVisa && r.visaStated === "No" ? 1 : 0);
  const roles = allRoles
    .filter((r) => roleStatus(r) !== "Closed")
    .sort((a, b) => visaLast(a) - visaLast(b) || (roleStatus(a) === "Live" ? 0 : 1) - (roleStatus(b) === "Live" ? 0 : 1));
  const newRoles = newRoles30d(c.id, db.roles);
  const closed = allRoles.filter((r) => roleStatus(r) === "Closed");
  const months = monthsSinceRound(c);
  const step = stepUp(c);
  const hired = functionsHired(c, db.roles);
  const targets = profile?.targetFunctions ?? [];
  const mine = myInteractions.filter((i) => i.companyId === c.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="crumbs">
        <Link to="/companies">Companies</Link> / {c.name}
      </div>

      <header className="cohead">
        <CompanyLogo name={c.name} />
        <div style={{ minWidth: 0 }}>
          <h1>{c.name}</h1>
          <p className="one">{c.oneLiner}</p>
          <div className="facts" style={{ marginTop: 8 }}>
            <span>{c.sector}</span>
            <span>{c.hq}, New York</span>
            <span>{c.headcountBand} people</span>
            <span>{cbsTieCount(c.id, db)} CBS ties</span>
          </div>
        </div>
        <div className="acts">
          <button
            className={`btn ${saved ? "ghost" : ""}`}
            onClick={() => {
              toggleSave(c.id);
              toast(saved ? `${c.name} removed from your pipeline` : `${c.name} saved to your pipeline`);
            }}
            aria-pressed={!!saved}
          >
            <span style={{ width: 18, height: 18, display: "inline-flex", color: saved ? "var(--strong)" : undefined }}>{Icon.heart(!!saved)}</span>
            {saved ? "Saved" : "Save to pipeline"}
          </button>
          <button className="btn ghost" onClick={() => setFlag({ type: "Company", id: c.id })}>
            {Icon.flag()} Flag something wrong
          </button>
          {joined ? (
            <Link to={`/companies/${c.id}/interest`} className="btn ghost mobile-only">
              {Icon.check()} On the interest list
            </Link>
          ) : (
            <button className="btn accent mobile-only" onClick={() => setJoining(true)}>
              I'm interested: add me to the CBS interest list
            </button>
          )}
        </div>
      </header>

      <div className="colayout">
        <div>
          {/* Overview and financial health (4a, 4f) */}
          <section aria-labelledby="h-overview">
            <h2 id="h-overview" className="sec-title">
              Overview
            </h2>
            <div className="stats">
              <div>
                <div className="k">Total raised</div>
                <div className="v">{money(c.totalRaised)}</div>
                <div className="s">All rounds</div>
              </div>
              <div>
                <div className="k">Last valuation</div>
                <div className="v">{c.lastValuation ? money(c.lastValuation) : "Undisclosed"}</div>
                <div className="s">At the {c.lastRoundName}</div>
              </div>
              <div>
                <div className="k">Last round</div>
                <div className="v">{money(c.lastRoundSize)}</div>
                <div className="s">
                  {c.lastRoundName}, {fmtMonth(c.lastRoundDate)}
                </div>
              </div>
              <div>
                <div className="k">Stage</div>
                <div className="v">{c.stage}</div>
                <div className="s">{c.headcountBand} people</div>
              </div>
            </div>
            <div className="small muted" style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span>Investors: {c.investors}</span>
              <Source href={c.sourceUrl} verified={c.lastVerified} label="Funding data: Crunchbase" />
            </div>
          </section>

          {/* Momentum (4b): facts only, no score */}
          <section aria-labelledby="h-mom">
            <h2 id="h-mom" className="sec-title">
              Momentum <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· facts only, no score</span>
            </h2>
            <div className="momentum">
              <div>
                <div className="v">{months === 0 ? "This month" : `${months} ${months === 1 ? "month" : "months"}`}</div>
                <div className="k">since the last round ({fmtMonth(c.lastRoundDate)})</div>
              </div>
              <div>
                <div className="v">{step ? `${step.toFixed(1)}×` : "Not known"}</div>
                <div className="k">{step ? `step-up from the prior round (${money(c.priorRoundSize!)} → ${money(c.lastRoundSize)})` : "step-up: no prior round on record"}</div>
              </div>
              <div>
                <div className="v">{c.headcountGrowth6m === null ? "Not known" : `${c.headcountGrowth6m > 0 ? "+" : ""}${c.headcountGrowth6m}%`}</div>
                <div className="k">headcount change over 6 months (now {c.headcountBand})</div>
              </div>
              <div>
                <div className="v">{newRoles}</div>
                <div className="k">new business {newRoles === 1 ? "role" : "roles"} posted in the last 30 days</div>
              </div>
            </div>
          </section>

          {/* What they're hiring for (4c, 4d) */}
          <section aria-labelledby="h-hiring">
            <h2 id="h-hiring" className="sec-title">
              What they're hiring for
            </h2>
            <div className="tags" style={{ marginBottom: 12 }}>
              {hired.map((f) => (
                <span key={f} className={`tag${targets.includes(f) ? " mine" : ""}`}>
                  {fnName(f)}
                </span>
              ))}
            </div>
            {roles.length ? (
              <div className="roles">
                {roles.map((r) => (
                  <RoleRow key={r.id} r={r} needsVisa={profile?.needsVisa} onFlag={() => setFlag({ type: "Role", id: r.id })} />
                ))}
              </div>
            ) : (
              <div className="empty">No business roles posted. Many startups hire before they post, so consider reaching out.</div>
            )}
            <div className="small muted" style={{ marginTop: 8 }}>
              Roles come from {c.name}'s own careers page.{" "}
              <ExtLink href={c.careersUrl} className="src" sampleNote="Sample company: in the MVP this opens its real careers page.">
                Careers page
              </ExtLink>
              {closed.length > 0 && ` · ${closed.length} ${closed.length === 1 ? "role" : "roles"} closed since first seen`}
            </div>
          </section>

          {/* Your CBS ties (4e) and people cards (4g) */}
          <section aria-labelledby="h-ties">
            <h2 id="h-ties" className="sec-title">
              Your CBS ties
            </h2>
            <div className="tiecounts" style={{ marginBottom: 14 }}>
              <div>
                <div className="n">{counts.club}</div>
                <div className="l">spoke at a club you're in</div>
              </div>
              <div>
                <div className="n">{counts.employer}</div>
                <div className="l">share a past employer with you</div>
              </div>
              <div>
                <div className="n">{counts.alum}</div>
                <div className="l">CBS alumni</div>
              </div>
              <div>
                <div className="n">{counts.speaker}</div>
                <div className="l">campus or club speakers</div>
              </div>
            </div>
            {cards.length ? (
              <div className="people">
                {cards.map((d) => (
                  <PersonCard key={d.person.id} data={d} />
                ))}
              </div>
            ) : (
              <div className="empty" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <b style={{ color: "var(--ink)" }}>No warm path yet</b>
                <span>We haven't found anyone at {c.name} with a CBS tie. Three ways in until we do:</span>
                <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                  <li>
                    {joined ? (
                      "You're on the CBS interest list, so CBS can share your resume with the team."
                    ) : (
                      <>
                        <button className="linkbtn" onClick={() => setJoining(true)}>
                          Join the CBS interest list
                        </button>{" "}
                        so CBS can share your resume with the team.
                      </>
                    )}
                  </li>
                  <li>
                    <ExtLink href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${c.name} Columbia Business School`)}`} sampleNote={`Sample company: in the MVP this opens a LinkedIn search for CBS alumni at ${c.name}.`}>
                      Search LinkedIn for CBS alumni at {c.name}
                    </ExtLink>
                    , then flag them so the next student has a path.
                  </li>
                  <li>Ask the CMC or the club closest to {c.sector.toLowerCase()} whether they know someone on the team.</li>
                </ol>
              </div>
            )}
            <p className="small muted" style={{ marginTop: 10 }}>
              {TIE_RULE.summary} {TIE_RULE.order} People are listed from public, CBS-linked sources only, and anyone can ask to be removed.
            </p>
          </section>
        </div>

        <aside className="sticky-side">
          {joined ? (
            <div className="interest joined">
              <h3>{Icon.check()} You're on the CBS interest list</h3>
              <p>Joined {fmtDate(joined.joined, { month: "short", day: "numeric" })} with {joined.resumeName}.</p>
              <Link to={`/companies/${c.id}/interest`} className="btn ghost sm" style={{ alignSelf: "flex-start" }}>
                View or remove
              </Link>
            </div>
          ) : (
            <div className="interest">
              <h3>Interested in {c.name}?</h3>
              <p>Join the CBS interest list. CBS can share it with {c.name} as one package. Any student can join, with no screening.</p>
              <button className="btn" onClick={() => setJoining(true)}>
                I'm interested: add me to the CBS interest list
              </button>
            </div>
          )}

          <div className="panel stagebox">
            <h2 style={{ fontSize: 17 }}>In your pipeline</h2>
            {saved ? (
              <>
                <label className="field">
                  <span className="small muted" style={{ fontWeight: 400 }}>
                    Stage
                  </span>
                  <select className="select" value={saved.stage} onChange={(e) => setStage(c.id, e.target.value as PipelineStage)}>
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                {mine.length > 0 ? (
                  <div className="history">
                    {mine.slice(0, 4).map((i) => (
                      <div key={i.id} className="h">
                        <time>{fmtDate(i.date, { month: "short", day: "numeric" })}</time>
                        {i.type} · {db.people.find((p) => p.id === i.personId)?.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small muted">No outreach logged yet. Draft a message to someone below.</p>
                )}
                <Link to={`/pipeline?company=${c.id}`} className="linkbtn small">
                  Open in my pipeline
                </Link>
              </>
            ) : (
              <>
                <p className="small muted">Save {c.name} to track every touchpoint, from first message to coffee chat.</p>
                <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => toggleSave(c.id)}>
                  {Icon.heart(false)} Save
                </button>
              </>
            )}
          </div>

          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontSize: 17 }}>Is something wrong?</h2>
            <p className="small muted">Company and role data are collected weekly with AI from public sources. Tell us if anything is off.</p>
            <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setFlag({ type: "Company", id: c.id })}>
              {Icon.flag()} Flag something wrong
            </button>
          </div>
        </aside>
      </div>

      {flag && <FlagDialog companyId={c.id} initial={flag} onClose={() => setFlag(null)} />}
      {joining && <InterestDialog companyId={c.id} onClose={() => setJoining(false)} />}
    </>
  );
}

function RoleRow({ r, onFlag, needsVisa }: { r: Role & { summary?: string }; onFlag: () => void; needsVisa?: boolean }) {
  const status = roleStatus(r);
  const mapped = !FN_WORDS[r.functionId]?.test(r.titleAsPosted);
  return (
    <div className={`role${status === "Unverified" ? " unverified" : ""}`}>
      <div style={{ minWidth: 0 }}>
        <h4>{r.titleAsPosted}</h4>
        <div className="map">
          {mapped ? `Posted as "${r.titleAsPosted}". Bridge reads it as ${fnName(r.functionId)}.` : fnName(r.functionId)}
        </div>
      </div>
      <div className="right">
        {status === "Live" ? <span className="pill good">Live</span> : <span className="pill grey" title="Not re-verified in the last 14 days">Unverified</span>}
      </div>
      {r.summary && <p className="sum">{r.summary}</p>}
      {needsVisa && r.visaStated === "No" && <p className="small" style={{ gridColumn: "1 / -1", color: "var(--crit)" }}>This posting states no visa sponsorship, and you said you need it.</p>}
      <div className="terms">
        <span>
          <b>{r.jobType}</b>
        </span>
        <span>{r.payStated ? `Pay: ${r.payStated}` : "Pay not stated"}</span>
        <VisaLabel v={r.visaStated} />
        <ExtLink href={r.postingUrl} sampleNote="Sample role: in the MVP this opens the posting on the company's own careers page.">
          View posting {Icon.ext()}
        </ExtLink>
        <span>Last verified {fmtDate(r.lastVerified, { month: "short", day: "numeric" })}</span>
        <button className="linkbtn small" style={{ color: "var(--muted)" }} onClick={onFlag}>
          Flag
        </button>
      </div>
    </div>
  );
}
