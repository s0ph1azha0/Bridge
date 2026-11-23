/*
 * SAMPLE DATA. Every company, person and student below is fictional.
 * In the real MVP this is collected weekly with AI from public sources
 * (careers pages, ATS job feeds, funding announcements, company team pages,
 * CBS and club event pages). Dates that should stay "fresh" are stored as
 * days-ago offsets and turned into real dates when the app loads.
 */
import type {
  Affiliation,
  Company,
  Flag,
  Interaction,
  InterestEntry,
  Person,
  Position,
  Role,
  Saved,
  User,
} from "./types";

export const daysAgo = (n: number, base = new Date()): string => {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const ts = (n: number, hour = 10) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const cb = (slug: string) => `https://www.crunchbase.com/organization/${slug}`;

/* ---------- Companies ---------- */
type CompanySeed = Omit<Company, "lastVerified"> & { verifiedDaysAgo: number };
const COMPANY_SEED: CompanySeed[] = [
  {
    id: "ledgerline", name: "Ledgerline", sector: "Fintech infrastructure", hq: "Flatiron", headcountBand: "201–500",
    oneLiner: "Real-time reconciliation APIs for mid-market finance teams.",
    stage: "Series C", lastRoundName: "Series C", totalRaised: 142, lastRoundSize: 70, priorRoundSize: 40, lastRoundDate: "2026-09-15", lastValuation: 900, headcountGrowth6m: 22,
    investors: "Northlight Ventures, Hudson Bay Partners, Greyline Capital", hiringAreas: ["strategy-ops", "product", "bizdev"],
    careersUrl: "https://ledgerline.example.com/careers", sourceUrl: cb("ledgerline"), verifiedDaysAgo: 3,
  },
  {
    id: "harbor", name: "Harbor AI", sector: "Enterprise AI", hq: "SoHo", headcountBand: "51–200",
    oneLiner: "AI agents that run insurance claims operations end to end.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 48, lastRoundSize: 35, priorRoundSize: 11, lastRoundDate: "2026-06-10", lastValuation: 260, headcountGrowth6m: 41,
    investors: "Fieldstone Ventures, Pier 57 Capital", hiringAreas: ["gtm", "chief-of-staff"],
    careersUrl: "https://harbor-ai.example.com/careers", sourceUrl: cb("harbor-ai"), verifiedDaysAgo: 2,
  },
  {
    id: "cadence", name: "Cadence Pay", sector: "Payments", hq: "Midtown", headcountBand: "501–1,000",
    oneLiner: "Embedded payments and payouts for vertical software companies.",
    stage: "Series D+", lastRoundName: "Series D", totalRaised: 610, lastRoundSize: 250, priorRoundSize: 150, lastRoundDate: "2026-03-18", lastValuation: 4200, headcountGrowth6m: 9,
    investors: "Meridian Growth, Northlight Ventures, Atlas Crossover Fund", hiringAreas: ["strategy-ops", "bizdev", "product"],
    careersUrl: "https://cadencepay.example.com/careers", sourceUrl: cb("cadence-pay"), verifiedDaysAgo: 4,
  },
  {
    id: "tidewell", name: "Tidewell Health", sector: "Health tech", hq: "Chelsea", headcountBand: "51–200",
    oneLiner: "Care coordination software for outpatient clinics.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 61, lastRoundSize: 45, priorRoundSize: 14, lastRoundDate: "2026-07-22", lastValuation: 280, headcountGrowth6m: 35,
    investors: "Bellwether Health Ventures, Canal Street Capital", hiringAreas: ["strategy-ops", "gtm", "bizdev"],
    careersUrl: "https://tidewell.example.com/careers", sourceUrl: cb("tidewell-health"), verifiedDaysAgo: 5,
  },
  {
    id: "kilnworks", name: "Kilnworks", sector: "Climate & industrial", hq: "Brooklyn Navy Yard", headcountBand: "201–500",
    oneLiner: "Procurement marketplace for low-carbon cement and steel.",
    stage: "Series C", lastRoundName: "Series C", totalRaised: 118, lastRoundSize: 60, priorRoundSize: 30, lastRoundDate: "2026-02-11", lastValuation: 650, headcountGrowth6m: 18,
    investors: "Evergreen Climate Partners, Gowanus Ventures", hiringAreas: ["strategy-ops", "bizdev"],
    careersUrl: "https://kilnworks.example.com/careers", sourceUrl: cb("kilnworks"), verifiedDaysAgo: 3,
  },
  {
    id: "parcelwise", name: "Parcelwise", sector: "Logistics software", hq: "Midtown South", headcountBand: "501–1,000",
    oneLiner: "Routing and returns software for mid-size retailers.",
    stage: "Series D+", lastRoundName: "Series D", totalRaised: 365, lastRoundSize: 120, priorRoundSize: 90, lastRoundDate: "2025-10-08", lastValuation: 2100, headcountGrowth6m: 4,
    investors: "Meridian Growth, Lantern Capital", hiringAreas: ["strategy-ops", "product"],
    careersUrl: "https://parcelwise.example.com/careers", sourceUrl: cb("parcelwise"), verifiedDaysAgo: 6,
  },
  {
    id: "verity", name: "Verity Legal", sector: "Enterprise AI", hq: "NoMad", headcountBand: "51–200",
    oneLiner: "Contract review copilots for in-house legal teams.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 39, lastRoundSize: 30, priorRoundSize: 8, lastRoundDate: "2026-07-14", lastValuation: 210, headcountGrowth6m: 52,
    investors: "Fieldstone Ventures, Lexicon Partners", hiringAreas: ["gtm", "chief-of-staff"],
    careersUrl: "https://veritylegal.example.com/careers", sourceUrl: cb("verity-legal"), verifiedDaysAgo: 2,
  },
  {
    id: "saltmarsh", name: "Saltmarsh", sector: "Food & commerce", hq: "Greenpoint", headcountBand: "51–200",
    oneLiner: "Wholesale ordering platform for independent restaurants.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 33, lastRoundSize: 25, priorRoundSize: 6, lastRoundDate: "2025-03-20", lastValuation: 140, headcountGrowth6m: -6,
    investors: "Union Square Seed Fund, Pantry Capital", hiringAreas: ["growth", "strategy-ops"],
    careersUrl: "https://saltmarsh.example.com/careers", sourceUrl: cb("saltmarsh"), verifiedDaysAgo: 4,
  },
  {
    id: "keystone", name: "Keystone Sentry", sector: "Cybersecurity", hq: "Financial District", headcountBand: "201–500",
    oneLiner: "Identity threat detection for banks and asset managers.",
    stage: "Series C", lastRoundName: "Series C", totalRaised: 156, lastRoundSize: 80, priorRoundSize: 50, lastRoundDate: "2026-09-03", lastValuation: 1100, headcountGrowth6m: 15,
    investors: "Bulwark Ventures, Greyline Capital", hiringAreas: ["gtm", "bizdev"],
    careersUrl: "https://keystonesentry.example.com/careers", sourceUrl: cb("keystone-sentry"), verifiedDaysAgo: 1,
  },
  {
    id: "atlas", name: "Atlas Robotics", sector: "Robotics", hq: "Sunset Park", headcountBand: "201–500",
    oneLiner: "Autonomous pallet movers for urban warehouses.",
    stage: "Series C", lastRoundName: "Series C", totalRaised: 190, lastRoundSize: 100, priorRoundSize: 55, lastRoundDate: "2026-05-06", lastValuation: 1300, headcountGrowth6m: 12,
    investors: "Ironbridge Capital, Lantern Capital", hiringAreas: ["strategy-ops"],
    careersUrl: "https://atlasrobotics.example.com/careers", sourceUrl: cb("atlas-robotics"), verifiedDaysAgo: 5,
  },
  {
    id: "patronly", name: "Patronly", sector: "Creator economy", hq: "Williamsburg", headcountBand: "51–200",
    oneLiner: "Membership and payments tools for independent creators.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 44, lastRoundSize: 32, priorRoundSize: 9, lastRoundDate: "2026-10-20", lastValuation: 230, headcountGrowth6m: 30,
    investors: "Bowline Ventures, Pier 57 Capital", hiringAreas: ["chief-of-staff", "growth"],
    careersUrl: "https://patronly.example.com/careers", sourceUrl: cb("patronly"), verifiedDaysAgo: 2,
  },
  {
    id: "girderline", name: "Girderline", sector: "Vertical software", hq: "Long Island City", headcountBand: "51–200",
    oneLiner: "Project financials for commercial construction firms.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 52, lastRoundSize: 38, priorRoundSize: 12, lastRoundDate: "2026-01-27", lastValuation: 300, headcountGrowth6m: 10,
    investors: "Ironbridge Capital, Queensboro Ventures", hiringAreas: ["strategy-ops", "product"],
    careersUrl: "https://girderline.example.com/careers", sourceUrl: cb("girderline"), verifiedDaysAgo: 6,
  },
  {
    id: "fieldnote", name: "Fieldnote AI", sector: "AI for investors", hq: "Flatiron", headcountBand: "11–50",
    oneLiner: "An AI research analyst for investment teams. Raised a large seed round at a reported $1B+ valuation.",
    stage: "Seed", lastRoundName: "Seed", totalRaised: 80, lastRoundSize: 80, priorRoundSize: null, lastRoundDate: "2026-08-19", lastValuation: 1200, headcountGrowth6m: 120,
    investors: "Halcyon Partners, Northlight Ventures", hiringAreas: ["gtm", "strategy-ops"],
    careersUrl: "https://fieldnote.example.com/careers", sourceUrl: cb("fieldnote-ai"), verifiedDaysAgo: 1,
  },
  {
    id: "gridwise", name: "Gridwise", sector: "Climate software", hq: "Dumbo", headcountBand: "11–50",
    oneLiner: "Energy management software for commercial buildings.",
    stage: "Series A", lastRoundName: "Series A", totalRaised: 22, lastRoundSize: 18, priorRoundSize: 4, lastRoundDate: "2026-04-15", lastValuation: 95, headcountGrowth6m: 25,
    investors: "Evergreen Climate Partners, Brooklyn Bridge Fund", hiringAreas: ["growth", "bizdev"],
    careersUrl: "https://gridwise.example.com/careers", sourceUrl: cb("gridwise"), verifiedDaysAgo: 3,
  },
  {
    id: "copperleaf", name: "Copperleaf Media", sector: "Media tech", hq: "Midtown", headcountBand: "11–50",
    oneLiner: "AI tools that help local newsrooms publish faster.",
    stage: "Series A", lastRoundName: "Series A", totalRaised: 28, lastRoundSize: 20, priorRoundSize: 5, lastRoundDate: "2026-09-24", lastValuation: 120, headcountGrowth6m: 33,
    investors: "Bowline Ventures, Fourth Estate Fund", hiringAreas: ["product", "growth"],
    careersUrl: "https://copperleaf.example.com/careers", sourceUrl: cb("copperleaf-media"), verifiedDaysAgo: 4,
  },
  {
    id: "tessera", name: "Tessera Retail", sector: "Retail tech", hq: "SoHo", headcountBand: "51–200",
    oneLiner: "Clienteling software for luxury and specialty retail.",
    stage: "Series B", lastRoundName: "Series B", totalRaised: 57, lastRoundSize: 40, priorRoundSize: 12, lastRoundDate: "2026-02-25", lastValuation: 400, headcountGrowth6m: 20,
    investors: "Maison Ventures, Canal Street Capital", hiringAreas: ["gtm", "growth"],
    careersUrl: "https://tesseraretail.example.com/careers", sourceUrl: cb("tessera-retail"), verifiedDaysAgo: 3,
  },
  {
    id: "copperline", name: "Copperline", sector: "HR and payroll", hq: "Hudson Yards", headcountBand: "1,001–5,000",
    oneLiner: "Payroll and benefits platform for small businesses.",
    stage: "Series D+", lastRoundName: "Series E", totalRaised: 820, lastRoundSize: 300, priorRoundSize: 180, lastRoundDate: "2026-06-24", lastValuation: 6500, headcountGrowth6m: 14,
    investors: "Meridian Growth, Atlas Crossover Fund, Northlight Ventures", hiringAreas: ["strategy-ops", "product", "bizdev"],
    careersUrl: "https://copperline.example.com/careers", sourceUrl: cb("copperline"), verifiedDaysAgo: 2,
  },
  {
    id: "kestrel", name: "Kestrel AI", sector: "AI infrastructure", hq: "Chelsea", headcountBand: "201–500",
    oneLiner: "Cuts the cost of running AI models for enterprise teams.",
    stage: "Series C", lastRoundName: "Series C", totalRaised: 310, lastRoundSize: 200, priorRoundSize: 80, lastRoundDate: "2026-10-07", lastValuation: 2400, headcountGrowth6m: 85,
    investors: "Halcyon Partners, Bulwark Ventures", hiringAreas: ["gtm", "strategy-ops", "chief-of-staff"],
    careersUrl: "https://kestrel-ai.example.com/careers", sourceUrl: cb("kestrel-ai"), verifiedDaysAgo: 1,
  },
];

/* ---------- Roles (open business roles, collected from each company's own careers page) ---------- */
type RoleSeed = Omit<Role, "firstSeen" | "lastVerified" | "postingUrl" | "closed"> & {
  seen: number; verified: number; closed?: boolean; summary: string;
};
const ROLE_SEED: RoleSeed[] = [
  { id: "r-ll-1", companyId: "ledgerline", titleAsPosted: "BizOps Associate", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Yes", payStated: "$165,000–$185,000 base", seen: 9, verified: 3,
    summary: "Run the operating cadence for the go-to-market team: planning, pricing analysis and the quarterly board pack." },
  { id: "r-ll-2", companyId: "ledgerline", titleAsPosted: "Product Manager, Treasury", functionId: "product", jobType: "Full-time", visaStated: "Not stated", payStated: "$170,000–$200,000 base", seen: 21, verified: 3,
    summary: "Own the treasury product line, from customer discovery with CFOs to launch." },
  { id: "r-ll-3", companyId: "ledgerline", titleAsPosted: "MBA Strategy Fellow (Spring, part-time)", functionId: "strategy-ops", jobType: "Part-time", visaStated: "Not stated", payStated: "$50/hour", seen: 5, verified: 3,
    summary: "Fifteen hours a week on one scoped project: sizing the mid-market expansion." },
  { id: "r-hb-1", companyId: "harbor", titleAsPosted: "Strategist", functionId: "gtm", jobType: "Full-time", visaStated: "Yes", payStated: "$150,000–$180,000 base", seen: 4, verified: 2,
    summary: "Work with the Head of GTM on which insurers to target, how to price pilots, and how to turn pilots into contracts." },
  { id: "r-hb-2", companyId: "harbor", titleAsPosted: "Chief of Staff to the CEO", functionId: "chief-of-staff", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 12, verified: 2,
    summary: "Run the CEO's priorities, the leadership meeting and special projects across hiring and fundraising." },
  { id: "r-hb-3", companyId: "harbor", titleAsPosted: "Forward Deployed Associate (MBA, part-time)", functionId: "gtm", jobType: "Part-time", visaStated: "Not stated", payStated: "$45/hour", seen: 30, verified: 18,
    summary: "Sit with a claims team at a pilot customer and map where the agents save time." },
  { id: "r-cp-1", companyId: "cadence", titleAsPosted: "Strategy Associate, 2027 Program", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Yes", payStated: "$175,000 base", seen: 15, verified: 4,
    summary: "Join a four-person strategy team that reports to the VP Strategy and rotates across product lines." },
  { id: "r-cp-2", companyId: "cadence", titleAsPosted: "Partnerships Lead, Platforms", functionId: "bizdev", jobType: "Full-time", visaStated: "No", payStated: "$180,000–$210,000 base", seen: 26, verified: 4,
    summary: "Sign and grow partnerships with vertical software platforms that embed Cadence payments." },
  { id: "r-cp-3", companyId: "cadence", titleAsPosted: "Summer Associate, Strategy (MBA)", functionId: "strategy-ops", jobType: "Internship", visaStated: "Yes", payStated: "$48/hour", seen: 8, verified: 4,
    summary: "A ten-week summer internship with one owned project and a final readout to the CEO." },
  { id: "r-cp-4", companyId: "cadence", titleAsPosted: "Senior Analyst, Pricing", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 60, verified: 31, closed: true,
    summary: "Pricing analytics for the platform business." },
  { id: "r-tw-1", companyId: "tidewell", titleAsPosted: "Business Generalist", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Not stated", payStated: "$140,000–$160,000 base", seen: 6, verified: 5,
    summary: "The first generalist hire. Expect clinic onboarding, pricing and investor updates in your first quarter." },
  { id: "r-tw-2", companyId: "tidewell", titleAsPosted: "Head of Partnerships", functionId: "bizdev", jobType: "Full-time", visaStated: "No", payStated: "", seen: 40, verified: 20,
    summary: "Build partnerships with hospital systems and EHR vendors." },
  { id: "r-kw-1", companyId: "kilnworks", titleAsPosted: "Strategy & Operations Manager", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Yes", payStated: "$160,000–$185,000 base", seen: 11, verified: 3,
    summary: "Own the expansion playbook for new Northeast markets and the supplier scorecard." },
  { id: "r-kw-2", companyId: "kilnworks", titleAsPosted: "Supply Partnerships Associate", functionId: "bizdev", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 3, verified: 3,
    summary: "Bring new low-carbon cement and steel suppliers onto the marketplace." },
  { id: "r-pw-1", companyId: "parcelwise", titleAsPosted: "Senior Associate, BizOps", functionId: "strategy-ops", jobType: "Full-time", visaStated: "No", payStated: "$150,000–$170,000 base", seen: 19, verified: 6,
    summary: "Forecasting, unit economics and planning for the returns business." },
  { id: "r-pw-2", companyId: "parcelwise", titleAsPosted: "Product Manager, Returns", functionId: "product", jobType: "Full-time", visaStated: "No", payStated: "$165,000–$190,000 base", seen: 33, verified: 6,
    summary: "Own the returns portal used by 400 retailers." },
  { id: "r-vl-1", companyId: "verity", titleAsPosted: "Founding Operator", functionId: "chief-of-staff", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 7, verified: 2,
    summary: "Work directly with the founder on whatever matters most this quarter: hiring, pricing, the first enterprise deals." },
  { id: "r-vl-2", companyId: "verity", titleAsPosted: "GTM Lead, Mid-Market", functionId: "gtm", jobType: "Full-time", visaStated: "Yes", payStated: "$160,000 base plus equity", seen: 14, verified: 2,
    summary: "Build the mid-market motion from the first ten customers up." },
  { id: "r-ks-1", companyId: "keystone", titleAsPosted: "Strategic Alliances Manager", functionId: "bizdev", jobType: "Full-time", visaStated: "Yes", payStated: "$170,000–$200,000 base", seen: 10, verified: 1,
    summary: "Run partnerships with core banking vendors and the large consultancies." },
  { id: "r-ks-2", companyId: "keystone", titleAsPosted: "GTM Strategy & Planning Associate", functionId: "gtm", jobType: "Full-time", visaStated: "Yes", payStated: "$155,000–$175,000 base", seen: 2, verified: 1,
    summary: "Territory design, capacity planning and the forecast for a 60-person sales team." },
  { id: "r-ar-1", companyId: "atlas", titleAsPosted: "Deployment Operations Lead", functionId: "strategy-ops", jobType: "Full-time", visaStated: "No", payStated: "$150,000–$175,000 base", seen: 22, verified: 5,
    summary: "Lead the playbook for launching robots in new customer warehouses." },
  { id: "r-pa-1", companyId: "patronly", titleAsPosted: "First Business Hire (Generalist)", functionId: "chief-of-staff", jobType: "Full-time", visaStated: "Not stated", payStated: "$130,000–$150,000 base", seen: 3, verified: 2,
    summary: "The founders' first non-engineering hire, owning operations, finance and partnerships." },
  { id: "r-pa-2", companyId: "patronly", titleAsPosted: "Growth Lead", functionId: "growth", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 17, verified: 2,
    summary: "Own creator acquisition and activation across paid and partner channels." },
  { id: "r-gl-1", companyId: "girderline", titleAsPosted: "Product Operations Manager", functionId: "product", jobType: "Full-time", visaStated: "Yes", payStated: "$150,000 base", seen: 12, verified: 6,
    summary: "Connect customer feedback, release planning and support for a 40-person product org." },
  { id: "r-fn-1", companyId: "fieldnote", titleAsPosted: "Strategist, Financial Services", functionId: "gtm", jobType: "Full-time", visaStated: "Yes", payStated: "$160,000–$190,000 base", seen: 1, verified: 1,
    summary: "Turn hedge fund and asset manager pilots into paid contracts and shape what the product team builds next." },
  { id: "r-fn-2", companyId: "fieldnote", titleAsPosted: "Operations Generalist (Spring, part-time)", functionId: "strategy-ops", jobType: "Part-time", visaStated: "Not stated", payStated: "$40/hour", seen: 4, verified: 1,
    summary: "Ten to fifteen hours a week building the operating systems of a 30-person company." },
  { id: "r-gw-1", companyId: "gridwise", titleAsPosted: "Growth Associate", functionId: "growth", jobType: "Full-time", visaStated: "Not stated", payStated: "$120,000–$140,000 base", seen: 8, verified: 3,
    summary: "Run outbound experiments with building owners and property managers." },
  { id: "r-gw-2", companyId: "gridwise", titleAsPosted: "MBA Fellow, Utility Partnerships (part-time)", functionId: "bizdev", jobType: "Part-time", visaStated: "Not stated", payStated: "", seen: 13, verified: 3,
    summary: "A scoped spring project mapping utility rebate programs in New York and New Jersey." },
  { id: "r-cl-1", companyId: "copperleaf", titleAsPosted: "Product Lead, Newsroom AI", functionId: "product", jobType: "Full-time", visaStated: "Yes", payStated: "$170,000 base", seen: 9, verified: 4,
    summary: "Own the editing assistant used by 80 local newsrooms." },
  { id: "r-tr-1", companyId: "tessera", titleAsPosted: "Strategic Accounts Associate", functionId: "gtm", jobType: "Full-time", visaStated: "No", payStated: "$140,000 base plus commission", seen: 16, verified: 3,
    summary: "Grow accounts with luxury houses already using Tessera in their US stores." },
  { id: "r-tr-2", companyId: "tessera", titleAsPosted: "Summer MBA Intern, Growth", functionId: "growth", jobType: "Internship", visaStated: "Yes", payStated: "$50/hour", seen: 5, verified: 3,
    summary: "A summer project on how clienteling drives repeat purchases." },
  { id: "r-co-1", companyId: "copperline", titleAsPosted: "Strategy & Operations Associate", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Yes", payStated: "$170,000–$190,000 base", seen: 6, verified: 2,
    summary: "Join the CEO's strategy team on pricing, new markets and the annual plan." },
  { id: "r-co-2", companyId: "copperline", titleAsPosted: "Product Manager, Benefits", functionId: "product", jobType: "Full-time", visaStated: "Yes", payStated: "$175,000–$205,000 base", seen: 12, verified: 2,
    summary: "Own the benefits enrollment flow used by 60,000 small businesses." },
  { id: "r-co-3", companyId: "copperline", titleAsPosted: "Partner Manager, Accounting Firms", functionId: "bizdev", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 20, verified: 2,
    summary: "Grow the channel of accounting firms that bring Copperline to their clients." },
  { id: "r-co-4", companyId: "copperline", titleAsPosted: "MBA Summer Associate, Strategy", functionId: "strategy-ops", jobType: "Internship", visaStated: "Yes", payStated: "$55/hour", seen: 3, verified: 2,
    summary: "A ten-week summer project for the strategy team, with a readout to the leadership team." },
  { id: "r-ke-1", companyId: "kestrel", titleAsPosted: "Deployment Strategist", functionId: "gtm", jobType: "Full-time", visaStated: "Yes", payStated: "$165,000–$195,000 base", seen: 2, verified: 1,
    summary: "Scope and launch the first deployments at large enterprise customers, then turn what you learn into the playbook." },
  { id: "r-ke-2", companyId: "kestrel", titleAsPosted: "Chief of Staff, Revenue", functionId: "chief-of-staff", jobType: "Full-time", visaStated: "Not stated", payStated: "", seen: 9, verified: 1,
    summary: "Run the operating rhythm for a revenue team that doubled this year." },
  { id: "r-ke-3", companyId: "kestrel", titleAsPosted: "BizOps Lead", functionId: "strategy-ops", jobType: "Full-time", visaStated: "Yes", payStated: "$180,000 base", seen: 16, verified: 1,
    summary: "Build the forecasting, pricing analysis and planning behind a fast-growing usage business." },
];

/* ---------- People, their positions and CBS affiliations ---------- */
interface PersonSeed {
  id: string; name: string; companyId: string; title: string; cbs: string; employers: string[];
  aff?: { type: Affiliation["type"]; club?: string; event: string; date: string }[];
}
const PEOPLE_SEED: PersonSeed[] = [
  { id: "p-maya", name: "Maya Okafor", companyId: "ledgerline", title: "Co-founder & CEO", cbs: "MBA '15", employers: ["goldman", "jpm"],
    aff: [{ type: "Club event speaker", club: "fintech", event: "Fintech Club infrastructure panel", date: "2026-10-21" }] },
  { id: "p-tom", name: "Tom Hsieh", companyId: "ledgerline", title: "Chief of Staff", cbs: "MBA '22", employers: ["mckinsey"] },
  { id: "p-priya", name: "Priya Natarajan", companyId: "ledgerline", title: "VP Product", cbs: "", employers: ["google"],
    aff: [{ type: "Campus speaker", event: "Product Management Speaker Series", date: "2026-03-04" }] },
  { id: "p-daniel", name: "Daniel Reiss", companyId: "ledgerline", title: "COO", cbs: "", employers: ["bcg"],
    aff: [{ type: "Club event speaker", club: "mca", event: "MCA fireside on moving from consulting to operating", date: "2025-11-12" }] },

  { id: "p-aisha", name: "Aisha Rahman", companyId: "harbor", title: "Head of Go-to-Market", cbs: "MBA '19", employers: ["bain", "salesforce"],
    aff: [{ type: "Club event speaker", club: "ai", event: "AI Club panel on agents in the enterprise", date: "2026-09-30" }] },
  { id: "p-jonas", name: "Jonas Lindqvist", companyId: "harbor", title: "Founder & CEO", cbs: "", employers: ["meta"],
    aff: [{ type: "Campus speaker", event: "Columbia Startup Lab Demo Day keynote", date: "2026-04-15" }] },
  { id: "p-carla", name: "Carla Jimenez", companyId: "harbor", title: "Head of People", cbs: "MBA '17", employers: ["amex", "deloitte"],
    aff: [{ type: "Club event speaker", club: "hba", event: "HBA conference careers panel", date: "2026-02-13" }] },

  { id: "p-omar", name: "Omar Siddiqui", companyId: "cadence", title: "VP Strategy", cbs: "MBA '18", employers: ["mckinsey", "stripe"] },
  { id: "p-hannah", name: "Hannah Whitfield", companyId: "cadence", title: "Chief Revenue Officer", cbs: "MBA '12", employers: ["amex"],
    aff: [{ type: "Club event speaker", club: "fintech", event: "Fintech Club payments summit", date: "2026-02-20" }] },
  { id: "p-grace", name: "Grace Lin", companyId: "cadence", title: "Product Manager", cbs: "MBA '24", employers: ["deloitte"],
    aff: [{ type: "Club event speaker", club: "aba", event: "ABA alumni mixer", date: "2026-09-18" }] },
  { id: "p-gabriel", name: "Gabriel Stone", companyId: "cadence", title: "CEO", cbs: "", employers: ["jpm"],
    aff: [{ type: "Campus speaker", event: "Dean's Distinguished Speaker Series", date: "2025-10-08" }] },

  { id: "p-marcus", name: "Marcus Bell", companyId: "tidewell", title: "Head of Strategy", cbs: "MBA '21", employers: ["jnj", "bcg"] },
  { id: "p-naomi", name: "Naomi Feld", companyId: "tidewell", title: "Co-founder & CEO", cbs: "", employers: [],
    aff: [{ type: "Club event speaker", club: "healthcare", event: "Healthcare Industry Association conference", date: "2026-02-27" }] },
  { id: "p-leah", name: "Leah Kaplan", companyId: "tidewell", title: "Director of Operations", cbs: "EMBA '20", employers: ["deloitte"] },

  { id: "p-sofia", name: "Sofia Brandt", companyId: "kilnworks", title: "Co-founder & CFO", cbs: "MBA '17", employers: ["morganstanley"],
    aff: [{ type: "Club event speaker", club: "green", event: "Green Business Club climate finance night", date: "2026-03-02" }] },
  { id: "p-kwame", name: "Kwame Asante", companyId: "kilnworks", title: "Co-founder & CEO", cbs: "", employers: ["bcg"],
    aff: [{ type: "Campus speaker", event: "Tamer Center social enterprise summit", date: "2025-11-14" }] },
  { id: "p-ines", name: "Ines Duarte", companyId: "kilnworks", title: "Strategy & Operations Manager", cbs: "MBA '23", employers: ["accenture"] },

  { id: "p-julia", name: "Julia Nakamura", companyId: "parcelwise", title: "Director, BizOps", cbs: "MBA '20", employers: ["amazon", "bain"] },
  { id: "p-andre", name: "Andre Lewis", companyId: "parcelwise", title: "Senior Product Manager", cbs: "MBA '23", employers: ["uber"],
    aff: [{ type: "Club event speaker", club: "bbsa", event: "BBSA conference operators panel", date: "2026-01-30" }] },
  { id: "p-peter", name: "Peter Vance", companyId: "parcelwise", title: "COO", cbs: "", employers: ["amazon"],
    aff: [{ type: "Campus speaker", event: "Operations Strategy guest lecture series", date: "2025-11-12" }] },

  { id: "p-lucas", name: "Lucas Ferreira", companyId: "verity", title: "Founder & CEO", cbs: "MBA '20", employers: ["google"],
    aff: [{ type: "Club event speaker", club: "entrepreneurship", event: "Entrepreneurship Club founder stories night", date: "2026-10-09" }] },
  { id: "p-mei", name: "Mei Tanaka", companyId: "verity", title: "Head of Operations", cbs: "", employers: ["mckinsey"],
    aff: [{ type: "Club event speaker", club: "cwib", event: "CWiB conference panel on women operators", date: "2026-04-03" }] },

  { id: "p-samir", name: "Samir Haddad", companyId: "saltmarsh", title: "VP Growth", cbs: "MBA '16", employers: ["pg", "uber"] },
  { id: "p-beatrice", name: "Beatrice Olsen", companyId: "saltmarsh", title: "Founder & CEO", cbs: "", employers: [],
    aff: [{ type: "Club event speaker", club: "entrepreneurship", event: "Entrepreneurship Club food founders night", date: "2026-04-22" }] },

  { id: "p-rahul", name: "Rahul Desai", companyId: "keystone", title: "Director, Strategic Alliances", cbs: "MBA '19", employers: ["ey", "citi"] },
  { id: "p-dana", name: "Dana Kim", companyId: "keystone", title: "Chief Revenue Officer", cbs: "", employers: ["microsoft"],
    aff: [{ type: "Club event speaker", club: "tech", event: "Tech Club fireside on selling security", date: "2026-04-07" }] },

  { id: "p-rohan", name: "Rohan Mehta", companyId: "atlas", title: "Founder & CEO", cbs: "", employers: ["amazon"],
    aff: [{ type: "Campus speaker", event: "CBS robotics and automation forum", date: "2026-03-26" }] },
  { id: "p-claire", name: "Claire Dubois", companyId: "atlas", title: "CFO", cbs: "MBA '14", employers: ["lazard", "evercore"] },

  { id: "p-tessa", name: "Tessa Greene", companyId: "patronly", title: "Co-founder & CEO", cbs: "MBA '18", employers: ["meta"],
    aff: [{ type: "Club event speaker", club: "media", event: "MMA creator economy panel", date: "2026-10-16" }] },
  { id: "p-idris", name: "Idris Bello", companyId: "patronly", title: "Co-founder & CTO", cbs: "", employers: ["google"],
    aff: [{ type: "Campus speaker", event: "Digital Future Initiative talk", date: "2026-09-17" }] },

  { id: "p-elena", name: "Elena Vasquez", companyId: "fieldnote", title: "Co-founder & CEO", cbs: "MBA '16", employers: ["blackrock", "goldman"],
    aff: [
      { type: "Club event speaker", club: "ai", event: "AI Club founders panel", date: "2026-11-05" },
      { type: "Club event speaker", club: "vc", event: "Venture Capital Club panel on seed rounds in AI", date: "2026-10-01" },
    ] },
  { id: "p-jamal", name: "Jamal Wright", companyId: "fieldnote", title: "Head of Go-to-Market", cbs: "MBA '21", employers: ["bloomberg", "mckinsey"] },

  { id: "p-hana", name: "Hana Sato", companyId: "gridwise", title: "Co-founder & COO", cbs: "MBA '19", employers: ["bcg", "nyc-gov"],
    aff: [
      { type: "Club event speaker", club: "green", event: "Green Business Club career night", date: "2026-10-28" },
      { type: "Club event speaker", club: "aba", event: "ABA founders dinner", date: "2026-09-12" },
    ] },
  { id: "p-owen", name: "Owen Mercer", companyId: "gridwise", title: "Head of Growth", cbs: "", employers: ["amazon"],
    aff: [{ type: "Club event speaker", club: "marketing", event: "Marketing Association growth summit", date: "2026-03-12" }] },

  { id: "p-sana", name: "Sana Qureshi", companyId: "copperleaf", title: "Co-founder & CEO", cbs: "MBA '17", employers: ["bloomberg"],
    aff: [{ type: "Club event speaker", club: "media", event: "MMA annual conference", date: "2026-02-06" }] },
  { id: "p-theo", name: "Theo Brennan", companyId: "copperleaf", title: "Product Lead", cbs: "MBA '24", employers: ["tfa", "google"] },

  { id: "p-camille", name: "Camille Laurent", companyId: "tessera", title: "VP Sales", cbs: "MBA '13", employers: ["lvmh", "loreal"],
    aff: [{ type: "Club event speaker", club: "rlg", event: "RLG Summit retail tech panel", date: "2026-03-27" }] },
  { id: "p-jordan", name: "Jordan Pierce", companyId: "tessera", title: "Head of Growth", cbs: "", employers: ["unilever"],
    aff: [{ type: "Club event speaker", club: "cwib", event: "CWiB conference keynote", date: "2026-02-20" }] },
  { id: "p-mira", name: "Mira Shah", companyId: "tessera", title: "Strategic Accounts Lead", cbs: "MBA '22", employers: ["bain"] },

  { id: "p-rebecca", name: "Rebecca Lindgren", companyId: "copperline", title: "VP Strategy & Operations", cbs: "MBA '16", employers: ["mckinsey", "amex"] },
  { id: "p-arjun", name: "Arjun Kapoor", companyId: "copperline", title: "Group Product Manager", cbs: "MBA '20", employers: ["google"],
    aff: [{ type: "Club event speaker", club: "tech", event: "Tech Club product leaders panel", date: "2026-10-14" }] },
  { id: "p-nadia", name: "Nadia Rahimi", companyId: "copperline", title: "Chief People Officer", cbs: "", employers: ["deloitte"],
    aff: [{ type: "Campus speaker", event: "CBS future of work forum", date: "2026-04-09" }] },

  { id: "p-samuel", name: "Samuel Adeyemi", companyId: "kestrel", title: "Co-founder & President", cbs: "MBA '17", employers: ["goldman", "bcg"],
    aff: [{ type: "Club event speaker", club: "ai", event: "AI Club infrastructure night", date: "2026-10-22" }] },
  { id: "p-lina", name: "Lina Ortiz", companyId: "kestrel", title: "Head of Strategy & Operations", cbs: "MBA '21", employers: ["bain"] },
  { id: "p-chris", name: "Chris Varga", companyId: "kestrel", title: "VP Sales", cbs: "", employers: ["salesforce"],
    aff: [{ type: "Club event speaker", club: "fintech", event: "Fintech Club panel on AI in financial services", date: "2026-09-25" }] },
];

/* ---------- Other (fictional) students, so counts and CMC totals are not empty ---------- */
const OTHER_STUDENTS: [string, string, string][] = [
  ["u-s01", "Alex", "Moreno"], ["u-s02", "Bea", "Chen"], ["u-s03", "Chris", "Okoye"], ["u-s04", "Dev", "Patel"],
  ["u-s05", "Emma", "Rossi"], ["u-s06", "Farah", "Haddad"], ["u-s07", "Gabe", "Kim"], ["u-s08", "Hiro", "Tanaka"],
  ["u-s09", "Isla", "Novak"], ["u-s10", "Jae", "Park"], ["u-s11", "Kofi", "Mensah"], ["u-s12", "Lena", "Schulz"],
];

/** Messages other students sent each person, and replies they logged: [personId, message days ago, reply days ago]. */
const MESSAGES_SEED: [string, number[], number[]][] = [
  ["p-maya", [0, 1, 2, 3, 5, 6, 12, 20], [10]],
  ["p-elena", [0, 1, 1, 2, 3, 4, 6], []],
  ["p-omar", [1, 2, 4, 6, 9, 30], [3, 7, 25]],
  ["p-aisha", [1, 3, 5, 15], [13]],
  ["p-lucas", [2, 5, 18], [16]],
  ["p-tessa", [3, 40], []],
  ["p-camille", [2, 4, 25], [22]],
  ["p-hana", [5, 33], [30]],
  ["p-marcus", [6, 14, 21, 40, 70], [12, 19]],
  ["p-julia", [9, 20, 28, 45, 52, 60], [18, 26, 50]],
  ["p-jamal", [2], []],
  ["p-sana", [11], []],
  ["p-samir", [60, 75, 80, 90, 95], []],
  ["p-sofia", [8, 50], []],
  ["p-tom", [3, 17], [15]],
  ["p-rebecca", [2, 10, 16, 24, 35], [8, 14, 30]],
  ["p-samuel", [1, 4], []],
  ["p-chris", [6], []],
];

/** Number of other students who saved each company, and how many joined its interest list. */
const SAVES_SEED: Record<string, [number, number]> = {
  ledgerline: [9, 4], harbor: [7, 3], cadence: [11, 6], tidewell: [4, 1], kilnworks: [3, 1], parcelwise: [5, 2],
  verity: [6, 2], saltmarsh: [4, 3], keystone: [3, 1], atlas: [1, 0], patronly: [4, 1], girderline: [0, 0],
  fieldnote: [10, 5], gridwise: [3, 1], copperleaf: [2, 1], tessera: [5, 2], copperline: [8, 3], kestrel: [6, 2],
};

/* ---------- Materialize ---------- */
export interface SeedData {
  companies: Company[];
  roles: (Role & { summary: string })[];
  people: Person[];
  positions: Position[];
  affiliations: Affiliation[];
  otherUsers: User[];
  saved: Saved[];
  interactions: Interaction[];
  interest: InterestEntry[];
  flags: Flag[];
}

export function buildSeed(): SeedData {
  const companies: Company[] = COMPANY_SEED.map(({ verifiedDaysAgo, ...c }) => ({ ...c, lastVerified: daysAgo(verifiedDaysAgo) }));
  const roles = ROLE_SEED.map(({ seen, verified, closed, ...r }) => ({
    ...r,
    postingUrl: `${companies.find((c) => c.id === r.companyId)!.careersUrl}/${r.id}`,
    firstSeen: daysAgo(seen),
    lastVerified: daysAgo(verified),
    closed: !!closed,
  }));
  const people: Person[] = [];
  const positions: Position[] = [];
  const affiliations: Affiliation[] = [];
  PEOPLE_SEED.forEach((p, i) => {
    const slug = p.name.toLowerCase().replace(/[^a-z]+/g, "-");
    const co = companies.find((c) => c.id === p.companyId)!;
    const verified = daysAgo((i % 6) + 1);
    people.push({
      id: p.id, name: p.name, linkedinUrl: `https://www.linkedin.com/in/sample-${slug}`, cbsClassYear: p.cbs,
      pastEmployers: p.employers, sourceUrl: `${co.careersUrl.replace("/careers", "/team")}`, lastVerified: verified, optedOut: false,
    });
    positions.push({ id: `pos-${p.id}`, personId: p.id, companyId: p.companyId, title: p.title, current: true, sourceUrl: co.careersUrl.replace("/careers", "/team"), lastVerified: verified });
    (p.aff ?? []).forEach((a, j) =>
      affiliations.push({
        id: `aff-${p.id}-${j}`, personId: p.id, type: a.type, clubId: a.club ?? null, eventName: a.event, eventDate: a.date,
        sourceUrl: a.club ? `https://www8.gsb.columbia.edu/clubs/${a.club}/events` : "https://business.columbia.edu/events",
      })
    );
  });

  const otherUsers: User[] = OTHER_STUDENTS.map(([id, f, l], i) => ({
    id, firstName: f, lastName: l, email: `${f[0].toLowerCase()}${l.toLowerCase()}${27 + (i % 2)}@gsb.columbia.edu`, role: "Student", createdAt: ts(40 - i),
  }));

  const interactions: Interaction[] = [];
  let k = 0;
  MESSAGES_SEED.forEach(([personId, ds, replies], pi) => {
    const companyId = positions.find((p) => p.personId === personId)!.companyId;
    ds.forEach((d, j) => {
      const u = otherUsers[(pi * 3 + j * 5) % otherUsers.length];
      interactions.push({
        id: `seed-int-${k++}`, userId: u.id, personId, companyId, type: "Message sent", capturedVia: "Mark as sent button",
        date: ts(d, 9 + (j % 8)), followUpDue: null, note: "",
      });
    });
    replies.forEach((d, j) => {
      const u = otherUsers[(pi * 3 + j * 5) % otherUsers.length];
      interactions.push({
        id: `seed-int-${k++}`, userId: u.id, personId, companyId, type: "Reply", capturedVia: "Logged manually",
        date: ts(d, 15), followUpDue: null, note: "",
      });
    });
  });

  const saved: Saved[] = [];
  const interest: InterestEntry[] = [];
  Object.entries(SAVES_SEED).forEach(([companyId, [nSaved, nInterest]], ci) => {
    for (let i = 0; i < nSaved; i++) {
      const u = otherUsers[(ci * 3 + i) % otherUsers.length];
      saved.push({ id: `seed-sv-${companyId}-${i}`, userId: u.id, companyId, stage: i % 3 === 0 ? "Reached out" : "Saved", dateSaved: ts(10 + i * 3), stageChanged: ts(5 + i) });
    }
    for (let i = 0; i < nInterest; i++) {
      const u = otherUsers[(ci * 3 + i) % otherUsers.length];
      interest.push({
        id: `seed-il-${companyId}-${i}`, userId: u.id, companyId, resumeName: `${u.firstName}_${u.lastName}_Resume.pdf`, resumeSize: 182_000 + i * 9_000,
        consentToShare: true, joined: ts(4 + i * 5), removed: null,
      });
    }
  });

  const flags: Flag[] = [
    { id: "seed-fl-1", userId: "u-s03", targetType: "Role", targetId: "r-tw-2", field: "Still open?", note: "I think this was filled last month. Their careers page no longer lists it.", status: "Open", created: ts(2), resolved: null },
    { id: "seed-fl-2", userId: "u-s07", targetType: "Company", targetId: "parcelwise", field: "Headcount", note: "LinkedIn shows closer to 1,200 people now.", status: "Open", created: ts(4), resolved: null },
    { id: "seed-fl-3", userId: "u-s10", targetType: "Role", targetId: "r-hb-1", field: "Visa", note: "Posting says they sponsor, but the recruiter told me only for senior roles.", status: "Fixed", created: ts(9), resolved: daysAgo(6) },
  ];

  return { companies, roles, people, positions, affiliations, otherUsers, saved, interactions, interest, flags };
}
