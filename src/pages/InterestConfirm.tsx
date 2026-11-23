import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { fmtDate } from "../lib/compute";
import { CompanyLogo, Icon } from "../components/ui";
import InterestDialog from "../components/InterestDialog";

/** Screen 4: interest list confirmation. */
export default function InterestConfirm() {
  const { id } = useParams();
  const { db, myInterest, leaveInterest } = useBridge();
  const toast = useToast();
  const nav = useNavigate();
  const [rejoin, setRejoin] = useState(false);
  const c = db.companies.find((x) => x.id === id);
  if (!c) return <Navigate to="/companies" replace />;
  const entry = myInterest(c.id);
  const size = db.interest.filter((e) => e.companyId === c.id && !e.removed).length;

  return (
    <div style={{ maxWidth: 640, margin: "24px auto" }}>
      <div className="crumbs">
        <Link to="/companies">Companies</Link> / <Link to={`/companies/${c.id}`}>{c.name}</Link> / Interest list
      </div>
      <div className="panel" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        <CompanyLogo name={c.name} />
        {entry ? (
          <>
            <h1 style={{ fontSize: 30 }}>You're on the CBS interest list for {c.name}</h1>
            <p style={{ fontSize: 16.5 }}>Every student who joins is on the list. CBS does not screen or rank it.</p>
            <div className="callout" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>
                {Icon.check()} Resume: <b>{entry.resumeName}</b>
              </span>
              <span className="small muted">
                Joined {fmtDate(entry.joined)} · You agreed that CBS may share your resume with {c.name}. {size} {size === 1 ? "student is" : "students are"} on this list.
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to={`/companies/${c.id}`} className="btn">
                Back to {c.name}
              </Link>
              <button
                className="btn danger"
                onClick={() => {
                  leaveInterest(c.id);
                  toast(`Removed from the ${c.name} interest list`);
                }}
              >
                Remove me
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28 }}>You're not on the {c.name} interest list</h1>
            <p className="muted">If you removed yourself, your resume will not be shared. You can join again at any time.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn accent" onClick={() => setRejoin(true)}>
                Join the interest list
              </button>
              <button className="btn ghost" onClick={() => nav(`/companies/${c.id}`)}>
                Back to {c.name}
              </button>
            </div>
          </>
        )}
      </div>
      {rejoin && <InterestDialog companyId={c.id} onClose={() => setRejoin(false)} />}
    </div>
  );
}
