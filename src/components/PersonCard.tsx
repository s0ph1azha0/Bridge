import { useSearchParams } from "react-router-dom";
import type { PersonCardData } from "../lib/compute";
import { CONTACT_LOAD_NUDGE, affsOf, fmtDate } from "../lib/compute";
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
        </div>
        <div className="ttl">{position.title}</div>
        <div className="small muted">{affiliationLabel(person.cbsClassYear, affsOf(person.id, db.affiliations))}</div>
        <ul className="why" aria-label={`Why ${first} relates to you`}>
          {tie.reasons.slice(0, 3).map((r, i) => (
            <li key={i}>{r.text}</li>
          ))}
        </ul>
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
