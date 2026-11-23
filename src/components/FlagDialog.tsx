import { useState } from "react";
import { useBridge, useToast } from "../lib/store";
import type { FlagTarget } from "../data/types";
import { Dialog } from "./ui";
import { peopleAt } from "../lib/compute";

const FIELDS: Record<FlagTarget, string[]> = {
  Company: ["Funding or round", "Headcount", "Description", "Hiring areas", "Location", "Something else"],
  Role: ["Role is closed or filled", "Title", "Job type", "Visa terms", "Pay", "Posting link", "Something else"],
  Person: ["No longer works here", "Title", "CBS affiliation", "LinkedIn link", "Something else"],
};

/** Requirement 11: flag wrong information on a company, role or person card. Reviewed weekly by the product team. */
export default function FlagDialog({ companyId, initial, onClose }: { companyId: string; initial?: { type: FlagTarget; id: string }; onClose: () => void }) {
  const { db, addFlag } = useBridge();
  const toast = useToast();
  const company = db.companies.find((c) => c.id === companyId)!;
  const roles = db.roles.filter((r) => r.companyId === companyId && !r.closed);
  const people = peopleAt(companyId, db);
  const [target, setTarget] = useState(initial ? `${initial.type}:${initial.id}` : `Company:${companyId}`);
  const type = target.split(":")[0] as FlagTarget;
  const [field, setField] = useState(FIELDS[type][0]);
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const [t, id] = target.split(":");
    addFlag({ targetType: t as FlagTarget, targetId: id, field, note: note.trim() });
    toast("Thanks. The team reviews every flag weekly.");
    onClose();
  };

  return (
    <Dialog title="Flag something wrong" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p className="muted small">Accuracy is what makes Bridge useful. Tell us what's off and the team will check it against the source.</p>
        <label className="field">
          <span>What's wrong?</span>
          <select
            className="select"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setField(FIELDS[e.target.value.split(":")[0] as FlagTarget][0]);
            }}
          >
            <option value={`Company:${companyId}`}>{company.name} (company details)</option>
            {roles.length > 0 && (
              <optgroup label="A role">
                {roles.map((r) => (
                  <option key={r.id} value={`Role:${r.id}`}>
                    {r.titleAsPosted}
                  </option>
                ))}
              </optgroup>
            )}
            {people.length > 0 && (
              <optgroup label="A person">
                {people.map(({ person, position }) => (
                  <option key={person.id} value={`Person:${person.id}`}>
                    {person.name}, {position.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label className="field">
          <span>Which detail?</span>
          <select className="select" value={field} onChange={(e) => setField(e.target.value)}>
            {FIELDS[type].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>What should it say? (optional)</span>
          <textarea className="textarea" style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The posting now says they don't sponsor visas." />
        </label>
        <div className="acts">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            Send flag
          </button>
        </div>
      </form>
    </Dialog>
  );
}
