import { useSearchParams } from "react-router-dom";
import type { PersonCardData } from "../lib/compute";
import { CONTACT_LOAD_NUDGE, affsOf, fmtDate, responsiveness } from "../lib/compute";
import { useBridge } from "../lib/store";
import { Avatar, ExtLink, Icon, TiePill, tieClass } from "./ui";

export function affiliationLabel(cbsClassYear: string, affs: ReturnType<typeof affsOf>) {
  const parts: string[] = [];
  if (cbsClassYear) parts.push(`CBS ${cbsClassYear}`);
  if (affs.some((a) => a.type === "Campus speaker")) parts.push("Campus speaker");
  if (affs.some((a) => a.type === "Club event speaker")) parts.push("Club event speaker");
  return parts.join(" · ");
}

export function LoadLine({ n, first }: { n: number; first: string }) {
  return (
    <span className={`load${n >= CONTACT_LOAD_NUDGE ? " hot" : ""}`} title="CBS students who marked a message to this person as sent in the last 7 days">
      {n} CBS {n === 1 ? "student" : "students"} messaged {first} this week
    </span>
  );
}

/** L1: "Likely to respond" or "Busy this week". A tag only, never a percentage, and only after 5+ logged messages. */
export function RespondTag({ r }: { r: ReturnType<typeof responsiveness> }) {
  if (r.busy)
    return (
      <span className="pill warm" title="5 or more CBS students messaged this person in the last 7 days">
        Busy this week
      </span>
    );
  if (r.likely)
    return (
      <span className="pill good" title="CBS students have logged replies from this person recently">
        Likely to respond
      </span>
    );
  return null;
}

/** Requirement 5: name, title, CBS affiliation, why they relate to me, LinkedIn link, and how many CBS students messaged them in the last 7 days. */
export default function PersonCard({ data }: { data: PersonCardData }) {
  const { db, myInteractions } = useBridge();
  const [params, setParams] = useSearchParams();
  const { person, position, tie, msgs7 } = data;
  const first = person.name.split(" ")[0];
  const mine = myInteractions.filter((i) => i.personId === person.id).sort((a, b) => b.date.localeCompare(a.date));
  const open = () => {
    const next = new URLSearchParams(params);
    next.set("person", person.id);
    setParams(next);
  };

  return (
    <article className="card person">
      <Avatar name={person.name} tone={tieClass(tie)} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="linkbtn nm" style={{ color: "var(--ink)", textDecoration: "none" }} onClick={open}>
            {person.name}
          </button>
          <TiePill tie={tie} />
          <RespondTag r={responsiveness(person.id, db.interactions)} />
        </div>
        <div className="ttl">{position.title}</div>
        <div className="small muted">{affiliationLabel(person.cbsClassYear, affsOf(person.id, db.affiliations))}</div>
        <ul className="why" aria-label={`Why ${first} relates to you`}>
          {tie.reasons
            .filter((r) => r.relevant)
            .slice(0, 3)
            .map((r, i) => (
              <li key={i}>{r.text}</li>
            ))}
        </ul>
        {tie.reasons.some((r) => !r.relevant) && (
          <div className="small muted" style={{ marginTop: 4 }}>
            Also: {tie.reasons.filter((r) => !r.relevant).map((r) => r.text.replace(new RegExp(`^${first} `), "")).join("; ")}
          </div>
        )}
        {mine.length > 0 && (
          <div className="small" style={{ marginTop: 6, color: "var(--good)", fontWeight: 600 }}>
            {Icon.check()} You: {mine[0].type.toLowerCase()} {fmtDate(mine[0].date, { month: "short", day: "numeric" })}
          </div>
        )}
      </div>
      <div className="side">
        <LoadLine n={msgs7} first={first} />
        <div style={{ display: "flex", gap: 6 }}>
          <ExtLink className="btn ghost sm" href={person.linkedinUrl} sampleNote="Sample person: there's no real LinkedIn profile to open.">
            {Icon.linkedin()}
            <span className="sr">{person.name} on LinkedIn</span>
          </ExtLink>
          <button className="btn sm" onClick={open}>
            {mine.length ? "Open" : "Draft message"}
          </button>
        </div>
      </div>
    </article>
  );
}
