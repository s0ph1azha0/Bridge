import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { COLUMBIA_EMAIL, useBridge } from "../lib/store";
import { BridgeMark } from "../components/ui";

/** Screen 0: limit access to CBS students. Any Columbia email can enter with a one-time code. */
export default function SignIn() {
  const { user, profile, requestCode, verifyCode, pendingCode } = useBridge();
  const nav = useNavigate();
  const [email, setEmail] = useState(pendingCode?.email ?? "");
  const [step, setStep] = useState<"email" | "code">(pendingCode ? "code" : "email");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  if (user) return <Navigate to={profile ? "/companies" : "/setup"} replace />;

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!COLUMBIA_EMAIL.test(email.trim())) {
      setErr("Use your Columbia email, for example uni27@gsb.columbia.edu or uni@columbia.edu.");
      return;
    }
    setErr("");
    requestCode(email);
    setStep("code");
  };
  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode(code)) nav("/setup");
    else setErr("That code doesn't match. Check the code and try again.");
  };

  return (
    <div className="auth">
      <section className="story">
        <div className="brand">
          <BridgeMark size={32} dark />
          <b>Project Bridge</b>
        </div>
        <h1>
          Project Bridge: your CBS way into <em>NYC startups</em>
        </h1>
        <p className="lede">A map of New York's high-growth startups and the CBS people who can open their doors. Start from the company, not the job title.</p>
        <ul>
          <li>
            <i>01</i>
            <span>
              <b>Every company you're targeting, in one place</b>
              Funding, momentum and open business roles, each with a source link and a last-verified date.
            </span>
          </li>
          <li>
            <i>02</i>
            <span>
              <b>Your warmest way in</b>
              Alumni, people who spoke at your clubs and people from your past employers, ranked by how strong your tie is.
            </span>
          </li>
          <li>
            <i>03</i>
            <span>
              <b>Outreach you send yourself</b>
              Draft a message, send it from your own email or LinkedIn, and track every reply and coffee chat.
            </span>
          </li>
        </ul>
        <svg className="arc" width="520" height="520" viewBox="0 0 520 520" aria-hidden="true">
          <path d="M20 400c80-200 160-300 240-300s160 100 240 300" fill="none" stroke="#7DB4F5" strokeWidth="18" strokeLinecap="round" />
          <path d="M20 400h480M120 400V260M260 400V170M400 400V260" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
        </svg>
      </section>

      <section className="formside">
        {step === "email" ? (
          <form className="box" onSubmit={sendCode} noValidate>
            <div>
              <div className="eyebrow">CBS students only</div>
              <h2 style={{ marginTop: 6 }}>Sign in with your Columbia email</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                We'll send a six-digit code. Every CBS student gets the same access.
              </p>
            </div>
            <label className="field">
              <span>Columbia email</span>
              <input className="input" type="email" autoComplete="email" placeholder="uni27@gsb.columbia.edu" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus aria-invalid={!!err} />
            </label>
            {err && <div className="callout crit small">{err}</div>}
            <button className="btn accent" type="submit">
              Send my code
            </button>
          </form>
        ) : (
          <form className="box" onSubmit={check}>
            <div>
              <div className="eyebrow">Check your inbox</div>
              <h2 style={{ marginTop: 6 }}>Enter the six-digit code</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                We sent it to <b style={{ color: "var(--ink)" }}>{pendingCode?.email ?? email}</b>.
              </p>
            </div>
            {pendingCode && (
              <div className="demo-code">
                Prototype: no email is sent. Your code is <b>{pendingCode.code}</b>
              </div>
            )}
            <label className="field">
              <span className="sr">Six-digit code</span>
              <input
                className="input codeinput"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                aria-label="Six-digit code"
              />
            </label>
            {err && <div className="callout crit small">{err}</div>}
            <button className="btn accent" type="submit" disabled={code.length !== 6}>
              Sign in
            </button>
            <button
              type="button"
              className="linkbtn small"
              style={{ alignSelf: "flex-start" }}
              onClick={() => {
                setStep("email");
                setCode("");
                setErr("");
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
