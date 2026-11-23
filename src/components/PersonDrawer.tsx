import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBridge, useToast } from "../lib/store";
import { CONTACT_LOAD_NUDGE, addDaysISO, affsOf, currentPosition, fmtDate, liveRoles, messagesLast7, responsiveness, tieFor } from "../lib/compute";
import { DRAFT_VARIANTS, draftMessage } from "../lib/draft";
import type { InteractionType } from "../data/types";
import { Avatar, Drawer, ExtLink, Icon, TiePill, tieClass } from "./ui";
import { affiliationLabel, RespondTag } from "./PersonCard";
import InterestDialog from "./InterestDialog";

/** Screen 2B: person drawer and message drafter. Opened from anywhere with ?person=<id>. */
export default function PersonDrawer({ personId }: { personId: string }) {
  const { db, user, profile, logInteraction, updateInteraction, myInteractions, myInterest, addFlag, recordEvent } = useBridge();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const person = db.people.find((p) => p.id === personId && !p.optedOut);
  const position = person ? currentPosition(person.id, db.positions) : undefined;
  const company = position ? db.companies.find((c) => c.id === position.companyId) : undefined;

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("person");
    setParams(next);
  };

  const tie = useMemo(() => (person ? tieFor(person, profile, db.affiliations, (id) => db.employers.find((e) => e.id === id)?.name ?? id) : null), [person, profile, db]);
  const roles = company ? liveRoles(company.id, db.roles) : [];
  const hasRole = !!profile && roles.some((r) => profile.targetFunctions.includes(r.functionId));
  const [variant, setVariant] = useState(0);
  const generated = useMemo(() => {
    if (!person || !position || !company || !tie || !user || !profile) return "";
    const emp = (id: string) => db.employers.find((e) => e.id === id);
    return draftMessage({ user, profile, person, title: position.title, company, tie, roles, variant, employerName: (id) => emp(id)?.name ?? id, employerAliases: (id) => emp(id)?.aliases ?? [] });
  }, [person, position, company, tie, user, profile, roles, variant, db.employers]);
  const [text, setText] = useState(generated);
  useEffect(() => {
    setText(generated);
  }, [generated]);
  const [justSent, setJustSent] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState(addDaysISO(7));
  const [joining, setJoining] = useState(false);
  const [removal, setRemoval] = useState(false);
  useEffect(() => {
    if (person && company) recordEvent("draft_opened", person.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  if (!person || !position || !company || !tie) {
    return (
      <Drawer onClose={close} header={<h2>Person not found</h2>}>
        <p className="muted">This person may have asked to be removed from Bridge.</p>
      </Drawer>
    );
  }

  const first = person.name.split(" ")[0];
  const load = messagesLast7(person.id, db.interactions);
  const mine = myInteractions.filter((i) => i.personId === person.id).sort((a, b) => b.date.localeCompare(a.date));
  const joined = myInterest(company.id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      recordEvent("draft_copied", person.id);
      toast("Message copied. Paste it into your email or LinkedIn.");
    } catch {
      toast("Select the text and press Cmd or Ctrl + C to copy.");
    }
  };
  const markSent = () => {
    const id = logInteraction({ personId: person.id, companyId: company.id, type: "Message sent", via: "Mark as sent button", note: `${DRAFT_VARIANTS[variant]} message` });
    setJustSent(id);
    toast(`Logged. ${company.name} is now in your pipeline.`);
  };
  const quickLog = (type: InteractionType) => {
    logInteraction({ personId: person.id, companyId: company.id, type, via: "Logged manually" });
    toast(`${type} logged for ${first}`);
  };

  return (
    <>
      <Drawer
        onClose={close}
        header={
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Avatar name={person.name} tone={tieClass(tie)} />
            <div style={{ minWidth: 0 }}>
              <h2>{person.name}</h2>
              <div style={{ color: "var(--ink-2)" }}>
                {position.title},{" "}
                <Link to={`/companies/${company.id}`} onClick={close}>
                  {company.name}
                </Link>
              </div>
              <div className="small muted" style={{ marginTop: 2 }}>
                {affiliationLabel(person.cbsClassYear, affsOf(person.id, db.affiliations))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <TiePill tie={tie} />
                <RespondTag r={responsiveness(person.id, db.interactions)} />
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <button className="btn ghost" onClick={copy}>
              {Icon.copy()} Copy
            </button>
            <ExtLink className="btn ghost" href={person.linkedinUrl} sampleNote="Sample person: there's no real LinkedIn profile to open.">
              {Icon.linkedin()} Open LinkedIn
            </ExtLink>
            <span style={{ flex: 1 }} />
            <button className="btn accent" onClick={markSent}>
              {Icon.send()} Mark as sent
            </button>
          </>
        }
      >
        <div>
          <div className="sec-title">Why {first} relates to you</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
            {tie.reasons
              .filter((r) => r.relevant)
              .map((r, i) => (
                <li key={i}>{r.text}</li>
              ))}
          </ul>
          {tie.reasons.some((r) => !r.relevant) && (
            <p className="small muted" style={{ marginTop: 6 }}>
              Also: {tie.reasons.filter((r) => !r.relevant).map((r) => r.text.replace(new RegExp(`^${first} `), "")).join("; ")}
            </p>
          )}
        </div>

        <div className={`callout${load >= CONTACT_LOAD_NUDGE ? " warn" : ""}`}>
          <b>
            {load} CBS {load === 1 ? "student" : "students"} messaged {first} this week.
          </b>
          {load >= CONTACT_LOAD_NUDGE ? (
            <div style={{ marginTop: 6 }}>
              {first} has heard from many CBS students this week. Consider the interest list instead.{" "}
              {joined ? (
                <span>You're already on it.</span>
              ) : (
                <button className="linkbtn" onClick={() => setJoining(true)}>
                  Join the {company.name} interest list
                </button>
              )}
            </div>
          ) : (
            <span className="muted"> Counted from students who marked a message as sent.</span>
          )}
        </div>

        {justSent && (
          <div className="callout blue" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <b>
              {Icon.check()} Marked as sent today. {company.name} is in your pipeline as "Reached out".
            </b>
            <div className="row" style={{ alignItems: "center" }}>
              <label className="small" htmlFor="fu" style={{ fontWeight: 600 }}>
                Remind me to follow up on
              </label>
              <input id="fu" type="date" className="input" style={{ width: "auto" }} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              <button
                className="btn sm"
                onClick={() => {
                  updateInteraction(justSent, { followUpDue: followUp });
                  toast(`Follow-up set for ${fmtDate(followUp, { month: "short", day: "numeric" })}`);
                  setJustSent(null);
                }}
              >
                Set reminder
              </button>
              <button className="linkbtn small" onClick={() => setJustSent(null)}>
                Skip
              </button>
            </div>
          </div>
        )}

        <div className="draftbox">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            <div className="sec-title" style={{ margin: 0 }}>
              Draft message
            </div>
            <div className="variants" role="group" aria-label="Message angle">
              {DRAFT_VARIANTS.map((v, i) =>
                i === 1 && !hasRole ? null : (
                  <button key={v} className="chip" aria-pressed={variant === i} onClick={() => setVariant(i)}>
                    {v}
                  </button>
                )
              )}
            </div>
          </div>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} aria-label={`Message to ${person.name}`} />
          <div className="small muted">
            Pre-filled from your set-up, {first}'s CBS tie and {company.name}'s public facts. Edit it, copy it, and send it yourself from email or LinkedIn. Bridge never sends anything.
            {text !== generated && (
              <>
                {" "}
                <button className="linkbtn" onClick={() => setText(generated)}>
                  Reset draft
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="sec-title">Your outreach to {first}</div>
          {mine.length ? (
            <div className="history" style={{ marginBottom: 12 }}>
              {mine.map((i) => (
                <div className="h" key={i.id}>
                  <time>{fmtDate(i.date, { month: "short", day: "numeric" })}</time>
                  <b>{i.type}</b>
                  {i.followUpDue && <span className="muted"> · follow up {fmtDate(i.followUpDue, { month: "short", day: "numeric" })}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="small muted" style={{ marginBottom: 10 }}>
              Nothing logged yet. "Mark as sent" logs your first message.
            </p>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn ghost sm" onClick={() => quickLog("Reply")}>
              + {first} replied
            </button>
            <button className="btn ghost sm" onClick={() => quickLog("Coffee chat")}>
              + Had a coffee chat
            </button>
            <button className="btn ghost sm" onClick={() => quickLog("Follow-up")}>
              + I followed up
            </button>
          </div>
        </div>

        <div className="small muted" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          Listed from public, CBS-linked sources ·{" "}
          <Link to={`/companies/${company.id}`} onClick={close}>
            {company.name} company page
          </Link>{" "}
          ·{" "}
          {removal ? (
            <span>Removal requested. Hidden within 48 hours.</span>
          ) : (
            <button
              className="linkbtn"
              style={{ color: "var(--muted)" }}
              onClick={() => {
                addFlag({ targetType: "Person", targetId: person.id, field: "Removal request", note: "Asked to be removed from Bridge." });
                setRemoval(true);
                toast("Removal request sent. The person is hidden within 48 hours.");
              }}
            >
              Is this you? Ask to be removed
            </button>
          )}
        </div>
      </Drawer>
      {joining && <InterestDialog companyId={company.id} onClose={() => setJoining(false)} />}
    </>
  );
}
