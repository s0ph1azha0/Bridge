import type { Company } from "../data/types";
import { initials, TIE_RULE, type PersonCardData } from "../lib/compute";

export interface NetGroup {
  c: Company;
  cards: PersonCardData[];
}

/**
 * Radial network: you in the center, CBS people on the inner ring (colored by tie strength),
 * companies on the outer ring. People sit on two alternating radii so neighbors never overlap.
 */
export function NetSvg({
  groups,
  savedIds,
  selected,
  onCompany,
  onPerson,
  compact = false,
}: {
  groups: NetGroup[];
  savedIds: Set<string>;
  selected?: string | null;
  onCompany?: (id: string) => void;
  onPerson: (id: string) => void;
  compact?: boolean;
}) {
  const N = Math.max(groups.length, 1);
  const W = 1000, H = compact ? 640 : 860;
  const cx = W / 2, cy = H / 2;
  const scale = compact ? 0.72 : 1;
  const rA = 190 * scale, rB = 245 * scale, r2 = 330 * scale;
  const spread = Math.min(0.16, (2 * Math.PI) / N / 4.4);
  const pos = new Map<string, { x: number; y: number }>();
  let k = 0;
  groups.forEach((g, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
    g.cards.forEach((p, j) => {
      const pa = a + (j - (g.cards.length - 1) / 2) * (compact ? Math.min(spread * 1.6, 0.22) : spread);
      const r = k++ % 2 === 0 ? rA : rB;
      pos.set(g.c.id + p.person.id, { x: cx + r * Math.cos(pa), y: cy + r * Math.sin(pa) });
    });
  });
  const key = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <svg className="net" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Network map of your CBS paths into NYC startups">
      <circle className="ring" cx={cx} cy={cy} r={(rA + rB) / 2} />
      <circle className="ring" cx={cx} cy={cy} r={r2} />
      {groups.map((g, i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
        const sx = cx + r2 * Math.cos(a), sy = cy + r2 * Math.sin(a);
        const dim = selected && selected !== g.c.id ? " dim" : "";
        return (
          <g key={g.c.id}>
            {g.cards.map((p) => {
              const { x, y } = pos.get(g.c.id + p.person.id)!;
              return (
                <g key={p.person.id}>
                  <line className={p.tie.label.toLowerCase() + dim} x1={cx} y1={cy} x2={x} y2={y} />
                  <line className={"ps" + dim} x1={x} y1={y} x2={sx} y2={sy} />
                </g>
              );
            })}
          </g>
        );
      })}
      {groups.map((g, i) => {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
        const co = Math.cos(a), si = Math.sin(a);
        const sx = cx + r2 * co, sy = cy + r2 * si;
        const dim = selected && selected !== g.c.id ? " dim" : "";
        const anchor = co > 0.3 ? "start" : co < -0.3 ? "end" : "middle";
        const nudge = anchor !== "middle" && Math.abs(si) > 0.7 ? (anchor === "start" ? 16 : -16) : 0;
        const lx = cx + (r2 + 32) * co + nudge, ly = cy + (r2 + 32) * si + (anchor === "middle" ? (si < 0 ? -12 : 10) : 0);
        const paths = g.cards.length;
        return (
          <g key={g.c.id}>
            {g.cards.map((p) => {
              const { x, y } = pos.get(g.c.id + p.person.id)!;
              return (
                <g
                  key={p.person.id}
                  className={`n p ${p.tie.label.toLowerCase()}${dim}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.person.name}, ${p.position.title} at ${g.c.name}, ${p.tie.label} tie`}
                  onClick={() => onPerson(p.person.id)}
                  onKeyDown={(e) => key(e, () => onPerson(p.person.id))}
                >
                  <title>{`${p.person.name}, ${p.position.title}. ${p.tie.label} tie.`}</title>
                  <circle cx={x} cy={y} r={13} />
                  <text x={x} y={y + 3.8}>
                    {initials(p.person.name)}
                  </text>
                </g>
              );
            })}
            <g
              className={`n s${savedIds.has(g.c.id) ? " saved" : ""}${selected === g.c.id ? " on" : ""}${dim}`}
              tabIndex={0}
              role="button"
              aria-label={`${g.c.name}, ${paths} ${paths === 1 ? "path" : "paths"}`}
              onClick={() => onCompany?.(g.c.id)}
              onKeyDown={(e) => key(e, () => onCompany?.(g.c.id))}
            >
              <circle cx={sx} cy={sy} r={22} style={paths ? undefined : { fill: "var(--surface)", stroke: "var(--line-2)", strokeDasharray: "4 4" }} />
              <text className="ini" x={sx} y={sy + 4} style={paths ? undefined : { fill: "var(--muted)" }}>
                {g.c.name.slice(0, 2).toUpperCase()}
              </text>
              <text className="lbl" textAnchor={anchor} x={lx} y={ly}>
                {g.c.name}
              </text>
              <text className="sub" textAnchor={anchor} x={lx} y={ly + 16}>
                {g.c.stage} · {paths ? `${paths} ${paths === 1 ? "path" : "paths"}` : "no path yet"}
              </text>
            </g>
          </g>
        );
      })}
      <g className="you">
        <circle cx={cx} cy={cy} r={36} />
        <text x={cx} y={cy + 5}>
          You
        </text>
      </g>
    </svg>
  );
}

/** The same tie definition used on company pages and in the drawer (X2). */
export function TieLegend({ showNodes = true }: { showNodes?: boolean }) {
  const cls = ["l3", "l2", "l1"];
  return (
    <div className="legend">
      {TIE_RULE.levels.map((l, i) => (
        <div key={l.label}>
          <i className={cls[i]} />
          <span>
            <b>{l.label}</b> ({l.points}): {l.example}
          </span>
        </div>
      ))}
      {showNodes && (
        <>
          <div>
            <i className="cs" />
            In your pipeline
          </div>
          <div>
            <i className="cn" />
            Not saved yet
          </div>
        </>
      )}
    </div>
  );
}
