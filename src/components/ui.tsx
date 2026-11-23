import { useEffect, useRef, type ReactNode } from "react";
import type { Tie } from "../lib/compute";
import { fmtDate, initials } from "../lib/compute";
import type { VisaStated } from "../data/types";
import { useToast } from "../lib/store";

/* ---------- Icons (inline, stroke-based) ---------- */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icon = {
  heart: (on = false) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...P} fill={on ? "currentColor" : "none"}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
  flag: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...P}>
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </svg>
  ),
  copy: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...P}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  ),
  ext: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...P}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...P}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...P}>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  x: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...P}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  building: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M11 21v-3h2v3" />
    </svg>
  ),
  map: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M10.2 10.4L6.5 7.4M13.8 10.4l3.7-3M13.6 13.8l3 3.6" />
    </svg>
  ),
  pipeline: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}>
      <rect x="3" y="4" width="5" height="16" rx="1.2" />
      <rect x="10" y="4" width="5" height="11" rx="1.2" />
      <rect x="17" y="4" width="4" height="7" rx="1.2" />
    </svg>
  ),
  people: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...P}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.6M17.5 14.2A5.5 5.5 0 0 1 20.5 19" />
    </svg>
  ),
  linkedin: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.9c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V21h-4z" />
    </svg>
  ),
  send: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...P}>
      <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
    </svg>
  ),
};

export function BridgeMark({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={dark ? "#ffffff" : "var(--ink)"} />
      <path d="M6 21c3-7 7-10 10-10s7 3 10 10" fill="none" stroke="#7DB4F5" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M6 21h20" stroke={dark ? "#0E1B2C" : "var(--surface)"} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 21v-5.2M16 21v-8.2M21 21v-5.2" stroke={dark ? "#0E1B2C" : "var(--surface)"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Small pieces ---------- */
export const tieClass = (t: Pick<Tie, "label">) => t.label.toLowerCase();

export function TiePill({ tie, suffix = "" }: { tie: Pick<Tie, "label" | "strength">; suffix?: string }) {
  if (tie.label === "None") return null;
  return (
    <span className={`pill ${tie.label.toLowerCase()}`} title={`Tie strength ${tie.strength} of 4`}>
      <span className={`dot ${tie.label.toLowerCase()}`} />
      {tie.label} tie{suffix}
    </span>
  );
}

export function VisaLabel({ v, prefix = "Visa" }: { v: VisaStated; prefix?: string }) {
  const cls = v === "Yes" ? "yes" : v === "No" ? "no" : "ns";
  const txt = v === "Yes" ? "Stated yes" : v === "No" ? "Stated no" : "Not stated";
  return (
    <span className={`visa ${cls}`}>
      {prefix}: {txt}
    </span>
  );
}

export function CompanyLogo({ name, size }: { name: string; size?: "sm" }) {
  return <span className={`logo${size ? " " + size : ""}`} aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
}

export function Avatar({ name, tone }: { name: string; tone?: string }) {
  return <span className={`avatar${tone ? " " + tone : ""}`} aria-hidden="true">{initials(name)}</span>;
}

/** Sample data points at placeholder URLs, so links explain themselves instead of opening a dead page. */
export function ExtLink({ href, children, className, sampleNote }: { href: string; children: ReactNode; className?: string; sampleNote: string }) {
  const toast = useToast();
  const sample = /example\.com|crunchbase\.com\/organization\/|linkedin\.com\/in\/sample-/.test(href);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={(e) => {
        if (sample) {
          e.preventDefault();
          toast(sampleNote);
        }
      }}
    >
      {children}
    </a>
  );
}

export function Source({ href, verified, label = "Source" }: { href: string; verified?: string; label?: string }) {
  return (
    <span className="src">
      <ExtLink href={href} sampleNote="Sample data: in the MVP this opens the public source the fact came from.">
        {label}
      </ExtLink>
      {verified ? ` · Last verified ${fmtDate(verified, { month: "short", day: "numeric" })}` : ""}
    </span>
  );
}

/* ---------- Overlays ---------- */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

export function Dialog({ title, onClose, children, labelledBy = "dlg-title" }: { title: string; onClose: () => void; children: ReactNode; labelledBy?: string }) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
  }, []);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <h2 id={labelledBy}>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            {Icon.x()}
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

export function Drawer({ onClose, header, footer, children }: { onClose: () => void; header: ReactNode; footer?: ReactNode; children: ReactNode }) {
  useEscape(onClose);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Person details">
        <header>
          <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            {Icon.x()}
          </button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </>
  );
}
