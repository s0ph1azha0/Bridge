import type { ClubHelper, EmployerHelper, FunctionHelper } from "./types";

/* Function_Helper: the six business functions from BRD requirement 2b. */
export const FUNCTIONS: FunctionHelper[] = [
  { id: "product", name: "Product" },
  { id: "strategy-ops", name: "Strategy & Operations" },
  { id: "growth", name: "Growth" },
  { id: "chief-of-staff", name: "Chief of Staff" },
  { id: "gtm", name: "Go-to-market" },
  { id: "bizdev", name: "Business Development" },
];

/* Club_Helper: CBS clubs a student can pick at set-up. */
export const CLUBS: ClubHelper[] = [
  { id: "tech", name: "Technology Business Group (Tech Club)" },
  { id: "fintech", name: "Fintech Club" },
  { id: "ai", name: "AI Club" },
  { id: "healthcare", name: "Healthcare Industry Association" },
  { id: "green", name: "Green Business Club" },
  { id: "rlg", name: "Retail & Luxury Goods Club" },
  { id: "media", name: "Media Management Association" },
  { id: "marketing", name: "Marketing Association" },
  { id: "vc", name: "Venture Capital Club" },
  { id: "pe", name: "Private Equity Club" },
  { id: "realestate", name: "Real Estate Association" },
  { id: "mca", name: "Management Consulting Association" },
  { id: "entrepreneurship", name: "Entrepreneurship Club" },
  { id: "aba", name: "Asian Business Association" },
  { id: "bbsa", name: "Black Business Student Association" },
  { id: "hba", name: "Hispanic Business Association" },
  { id: "cwib", name: "Columbia Women in Business" },
  { id: "outdoors", name: "Outdoors Club" },
  { id: "wellness", name: "Health & Wellness Club" },
  { id: "sbcp", name: "Small Business Consulting Program" },
];

export const CLUB_SHORT: Record<string, string> = {
  tech: "Tech Club",
  healthcare: "Healthcare Industry Association",
};

/* Employer_Helper: shared by students and people, so a shared past employer is found
   even when one says "McKinsey" and the other "McKinsey & Company". */
export const EMPLOYERS: EmployerHelper[] = [
  { id: "mckinsey", name: "McKinsey & Company", aliases: ["McKinsey", "McK", "McKinsey and Company"] },
  { id: "bcg", name: "Boston Consulting Group", aliases: ["BCG", "The Boston Consulting Group"] },
  { id: "bain", name: "Bain & Company", aliases: ["Bain", "Bain and Company"] },
  { id: "deloitte", name: "Deloitte", aliases: ["Deloitte Consulting", "Monitor Deloitte"] },
  { id: "accenture", name: "Accenture", aliases: ["Accenture Strategy"] },
  { id: "ey", name: "EY", aliases: ["Ernst & Young", "EY-Parthenon", "Ernst and Young"] },
  { id: "pwc", name: "PwC", aliases: ["PricewaterhouseCoopers", "Strategy&", "Strategy and"] },
  { id: "kearney", name: "Kearney", aliases: ["A.T. Kearney", "AT Kearney"] },
  { id: "oliverwyman", name: "Oliver Wyman", aliases: [] },
  { id: "goldman", name: "Goldman Sachs", aliases: ["GS", "Goldman"] },
  { id: "jpm", name: "J.P. Morgan", aliases: ["JPMorgan", "JP Morgan", "JPM", "JPMorgan Chase", "Chase"] },
  { id: "morganstanley", name: "Morgan Stanley", aliases: ["MS"] },
  { id: "citi", name: "Citi", aliases: ["Citigroup", "Citibank"] },
  { id: "bofa", name: "Bank of America", aliases: ["BofA", "BofA Securities", "Merrill Lynch"] },
  { id: "evercore", name: "Evercore", aliases: [] },
  { id: "lazard", name: "Lazard", aliases: [] },
  { id: "blackrock", name: "BlackRock", aliases: [] },
  { id: "amex", name: "American Express", aliases: ["Amex"] },
  { id: "google", name: "Google", aliases: ["Alphabet"] },
  { id: "amazon", name: "Amazon", aliases: ["AWS", "Amazon Web Services"] },
  { id: "meta", name: "Meta", aliases: ["Facebook"] },
  { id: "microsoft", name: "Microsoft", aliases: [] },
  { id: "apple", name: "Apple", aliases: [] },
  { id: "salesforce", name: "Salesforce", aliases: [] },
  { id: "uber", name: "Uber", aliases: [] },
  { id: "stripe", name: "Stripe", aliases: [] },
  { id: "bloomberg", name: "Bloomberg", aliases: ["Bloomberg LP"] },
  { id: "pg", name: "Procter & Gamble", aliases: ["P&G", "Procter and Gamble"] },
  { id: "unilever", name: "Unilever", aliases: [] },
  { id: "loreal", name: "L'Oréal", aliases: ["L'Oreal", "Loreal"] },
  { id: "lvmh", name: "LVMH", aliases: [] },
  { id: "pfizer", name: "Pfizer", aliases: [] },
  { id: "jnj", name: "Johnson & Johnson", aliases: ["J&J", "Johnson and Johnson"] },
  { id: "tfa", name: "Teach For America", aliases: ["TFA"] },
  { id: "usarmy", name: "U.S. Army", aliases: ["US Army", "Army"] },
  { id: "usnavy", name: "U.S. Navy", aliases: ["US Navy", "Navy"] },
  { id: "nyc-gov", name: "City of New York", aliases: ["NYC government", "NYC Mayor's Office"] },
];

export const fnName = (id: string) => FUNCTIONS.find((f) => f.id === id)?.name ?? id;
export const clubName = (id: string) => CLUBS.find((c) => c.id === id)?.name ?? id;
export const clubShort = (id: string) => CLUB_SHORT[id] ?? clubName(id);

/** Find employers named in free text (pasted resume or background), matching names and aliases. */
export function employersInText(text: string, list: EmployerHelper[]): string[] {
  if (!text.trim()) return [];
  const found: string[] = [];
  for (const e of list) {
    const names = [e.name, ...e.aliases].filter((n) => n.length >= 3 || /[&.]/.test(n));
    const hit = names.some((n) => {
      const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, n === n.toUpperCase() ? "" : "i").test(text);
    });
    if (hit) found.push(e.id);
  }
  return found;
}

/** Match a typed employer name to a helper entry by name or alias. */
export function matchEmployer(input: string, list: EmployerHelper[]): EmployerHelper | undefined {
  const q = input.trim().toLowerCase();
  if (!q) return undefined;
  return list.find((e) => e.name.toLowerCase() === q || e.aliases.some((a) => a.toLowerCase() === q));
}
