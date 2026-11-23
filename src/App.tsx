import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useBridge } from "./lib/store";
import { BridgeMark, Icon } from "./components/ui";
import PersonDrawer from "./components/PersonDrawer";
import SignIn from "./pages/SignIn";
import Setup from "./pages/Setup";
import Directory from "./pages/Directory";
import CompanyPage from "./pages/CompanyPage";
import InterestConfirm from "./pages/InterestConfirm";
import NetworkMap from "./pages/NetworkMap";
import Pipeline from "./pages/Pipeline";
import TeamOps from "./pages/TeamOps";
import CmcTotals from "./pages/CmcTotals";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route element={<RequireUser />}>
        <Route path="/setup" element={<Setup />} />
        <Route element={<Shell />}>
          <Route path="/" element={<Navigate to="/companies" replace />} />
          <Route path="/companies" element={<Directory />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/companies/:id/interest" element={<InterestConfirm />} />
          <Route path="/map" element={<NetworkMap />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/team" element={<TeamOps />} />
          <Route path="/cmc" element={<CmcTotals />} />
          <Route path="*" element={<Navigate to="/companies" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

/** Screen 0 gate: CBS email sign-in. Screen 1 gate: set-up shows once, when no Profile exists. */
function RequireUser() {
  const { user, profile } = useBridge();
  const { pathname } = useLocation();
  if (!user) return <Navigate to="/signin" replace />;
  if (!profile && pathname !== "/setup") return <Navigate to="/setup" replace />;
  return <Outlet />;
}

function Shell() {
  const { user, mySaved, signOut, resetAll, setRole } = useBridge();
  const [params] = useSearchParams();
  const personId = params.get("person");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  const name = [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;
  const ini = (user!.firstName?.[0] ?? user!.email[0]).toUpperCase() + (user!.lastName?.[0] ?? "").toUpperCase();

  return (
    <>
      <div className="bar">
        <div className="wrap">
          <Link to="/companies" className="brand" aria-label="Project Bridge home">
            <BridgeMark />
            <b>Project Bridge</b>
          </Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/companies">{Icon.building()}Companies</NavLink>
            <NavLink to="/map">{Icon.map()}Network map</NavLink>
            <NavLink to="/pipeline">
              {Icon.pipeline()}My pipeline{mySaved.length > 0 && <span className="count">{mySaved.length}</span>}
            </NavLink>
          </nav>
          <span className="spacer" />
          <span className="sample wide" title="All companies, people and other students are fictional">
            Sample data
          </span>
          <div className="menu" ref={menuRef}>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
              <span className="avatar me">{ini}</span>
              <span className="small" style={{ fontWeight: 500 }}>{user!.firstName || "You"}</span>
            </button>
            {open && (
              <div className="pop" role="menu" onClick={() => setOpen(false)}>
                <div className="who">
                  <div style={{ fontWeight: 600 }}>{name}</div>
                  <div className="small muted">{user!.email}</div>
                </div>
                <Link to="/setup" role="menuitem">Edit my set-up</Link>
                <button role="menuitem" onClick={() => { signOut(); nav("/signin"); }}>Sign out</button>
                <hr />
                <div className="label">Prototype</div>
                <Link to="/team" role="menuitem" onClick={() => setRole("Product team")}>Product team view</Link>
                <Link to="/cmc" role="menuitem" onClick={() => setRole("CMC viewer")}>CMC totals (after MVP)</Link>
                <button
                  role="menuitem"
                  onClick={() => {
                    if (confirm("Clear everything saved in this browser and start a fresh session for the next interviewee?")) {
                      resetAll();
                      nav("/signin");
                    }
                  }}
                >
                  Reset for the next interview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main>
        <div className="wrap">
          <Outlet />
        </div>
      </main>

      <footer className="foot">
        <div className="wrap">
          <span>Project Bridge prototype · CBS Prompt to Product, Team 12</span>
          <span>All companies and people are fictional sample data.</span>
          <span style={{ flex: 1 }} />
          <Link to="/team">Product team view</Link>
          <Link to="/cmc">CMC totals</Link>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Main">
        <NavLink to="/companies">{Icon.building()}Companies</NavLink>
        <NavLink to="/map">{Icon.map()}Network</NavLink>
        <NavLink to="/pipeline">{Icon.pipeline()}Pipeline</NavLink>
      </nav>

      {personId && <PersonDrawer personId={personId} />}
    </>
  );
}
