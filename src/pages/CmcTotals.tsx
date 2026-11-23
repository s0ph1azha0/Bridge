import { useBridge } from "../lib/store";
import { cbsTieCount, daysSince, thisWeekRange } from "../lib/compute";

/** CMC Totals (after the MVP; shown in mockups). Read-only aggregates. No student names, and no filtering or ranking of students. */
export default function CmcTotals() {
  const { db } = useBridge();
  const { start, end } = thisWeekRange();
  const sentThisWeek = (companyId: string) =>
    db.interactions.filter((i) => i.companyId === companyId && i.type === "Message sent" && new Date(i.date) >= start && new Date(i.date) < end).length;
  const lastOutreach = (companyId: string) => {
    const ds = db.interactions.filter((i) => i.companyId === companyId).map((i) => i.date).sort();
    return ds.length ? daysSince(ds[ds.length - 1]) : null;
  };
  const rows = db.companies
    .map((c) => ({
      c,
      ties: cbsTieCount(c.id, db),
      savers: new Set(db.saved.filter((s) => s.companyId === c.id).map((s) => s.userId)).size,
      list: db.interest.filter((e) => e.companyId === c.id && !e.removed).length,
      week: sentThisWeek(c.id),
      last: lastOutreach(c.id),
    }))
    .sort((a, b) => a.c.name.localeCompare(b.c.name));
  const withTie = rows.filter((r) => r.ties > 0).length;
  const quiet = rows.filter((r) => r.last === null || r.last > 90);
  const maxWeek = Math.max(1, ...rows.map((r) => r.week));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">CMC viewer · after the MVP</div>
          <h1>CBS and NYC startups, in totals</h1>
          <p>Read-only aggregates from student activity. No student names, and the CMC never filters or ranks students.</p>
        </div>
      </div>
      <div className="tiles">
        <div className="tile">
          <div className="n">
            {withTie} <span style={{ fontSize: 18, color: "var(--muted)" }}>of {rows.length}</span>
          </div>
          <div className="l">companies with at least one CBS tie</div>
        </div>
        <div className="tile">
          <div className="n">{rows.reduce((s, r) => s + r.week, 0)}</div>
          <div className="l">messages students sent this week</div>
        </div>
        <div className="tile">
          <div className="n">{rows.reduce((s, r) => s + r.list, 0)}</div>
          <div className="l">interest-list sign-ups across companies</div>
        </div>
        <div className={`tile${quiet.length ? " alert" : ""}`}>
          <div className="n">{quiet.length}</div>
          <div className="l">companies with no outreach in 90 days</div>
        </div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
        <div className="panel">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>By company</h2>
          <div className="tablewrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Company</th>
                  <th className="num">CBS ties</th>
                  <th className="num">Students who saved</th>
                  <th className="num">Interest list</th>
                  <th className="num">Messages this week</th>
                  <th className="num">Last outreach</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.c.id}>
                    <td>
                      <b>{r.c.name}</b>
                      <div className="small muted">{r.c.stage}</div>
                    </td>
                    <td className="num">{r.ties}</td>
                    <td className="num">{r.savers}</td>
                    <td className="num">{r.list}</td>
                    <td className="num">{r.week}</td>
                    <td className="num" style={r.last === null || r.last > 90 ? { color: "var(--crit)" } : undefined}>
                      {r.last === null ? "Never" : `${r.last} d ago`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel">
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Messages sent this week</h2>
            <div className="bars">
              {[...rows]
                .filter((r) => r.week > 0)
                .sort((a, b) => b.week - a.week)
                .map((r) => (
                  <div className="barrow" key={r.c.id}>
                    <span>{r.c.name}</span>
                    <span>
                      <i style={{ width: `${Math.max(4, (r.week / maxWeek) * 100)}%` }} />
                    </span>
                    <span>{r.week}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="panel">
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>No outreach in 90 days</h2>
            {quiet.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {quiet.map((r) => (
                  <li key={r.c.id}>
                    <b>{r.c.name}</b> <span className="small muted">· {r.ties ? `${r.ties} CBS ties, none used` : "no CBS ties on record"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Every company has had outreach in the last 90 days.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
