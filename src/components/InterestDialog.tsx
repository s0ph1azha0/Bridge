import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBridge } from "../lib/store";
import { Dialog, Icon } from "./ui";

/** Requirement 10: join a company's CBS interest list with a resume. Any student can join, with no screening. */
export default function InterestDialog({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const { db, joinInterest } = useBridge();
  const nav = useNavigate();
  const company = db.companies.find((c) => c.id === companyId)!;
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [consent, setConsent] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !consent) return;
    joinInterest(companyId, file);
    onClose();
    nav(`/companies/${companyId}/interest`);
  };

  return (
    <Dialog title={`Join the CBS interest list for ${company.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p className="muted small">
          CBS can share this list with {company.name} as one package, instead of dozens of cold emails. Every student who joins is on the list. CBS does not screen or rank it.
        </p>
        <div className={`drop${file ? " has" : ""}`}>
          {file ? (
            <>
              <b>
                {Icon.check()} {file.name}
              </b>
              <span className="small muted">{Math.round(file.size / 1024)} KB</span>
              <button type="button" className="linkbtn small" onClick={() => input.current?.click()}>
                Choose a different file
              </button>
            </>
          ) : (
            <>
              <b>Upload your resume</b>
              <span className="small muted">PDF or Word, up to 5 MB. Separate from your set-up background.</span>
              <button type="button" className="btn ghost sm" onClick={() => input.current?.click()}>
                Choose file
              </button>
            </>
          )}
          <input
            ref={input}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile({ name: f.name, size: f.size });
            }}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            CBS may share my resume with {company.name}. <span className="muted">This resume is the only student data that can reach an employer.</span>
          </span>
        </label>
        <p className="small muted">Prototype: only the file name is kept, in this browser. Nothing is uploaded.</p>
        <div className="acts">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn accent" disabled={!file || !consent}>
            Add me to the list
          </button>
        </div>
      </form>
    </Dialog>
  );
}
