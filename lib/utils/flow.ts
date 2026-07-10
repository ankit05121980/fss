export interface FlowStep {
  id: string;
  title: string;
  instruction: string;
  /** A concrete action the user should try on this screen. */
  whatToDo: string;
  href: string;
  /** Optional CSS selector to scroll-to and highlight on this screen. */
  target?: string;
}

/**
 * The end-to-end guided flow — walks every module of the application in order,
 * including key sub-actions. Steps deep-link to the relevant screen and may
 * highlight a target element (via `data-flow` attributes).
 */
export const FLOW_STEPS: FlowStep[] = [
  {
    id: "welcome",
    title: "Welcome to NetTrace",
    instruction:
      "This guided flow walks the complete business journey for Frontier Scientific — from onboarding data, to live operations, DSCSA traceability, a cold-chain recall, a counterfeit investigation, exception handling and AI.",
    whatToDo: "Press Next to begin. You can stop or resume at any time.",
    href: "/getting-started",
    target: "[data-flow='getting-started']",
  },
  // --- Business case 1: Onboard the data ---
  {
    id: "connect-data",
    title: "1 · Connect your data",
    instruction:
      "NetTrace sits above your systems of record. Upload an Excel/CSV file or connect NetSuite, Datex, EUPRY, carriers and the trading-partner registry — everything is conformed into one model.",
    whatToDo: "Try the upload area, or 'Configure' a connector to see what's required.",
    href: "/integrations",
    target: "[data-flow='integration-upload']",
  },
  // --- Business case 2: Executive readiness & foresight ---
  {
    id: "executive",
    title: "2 · Executive readiness",
    instruction:
      "The single pane of glass: overall compliance score, traceability & serialization coverage, authorized partners, recall readiness, open risks and active excursions.",
    whatToDo: "Review the KPI strip and the compliance gauge.",
    href: "/executive",
    target: "[data-flow='kpis']",
  },
  {
    id: "exec-predictions",
    title: "3 · Predict before it happens",
    instruction:
      "Predictive alerts are surfaced on the executive view so leaders see emerging delay, excursion and partner risk before events occur.",
    whatToDo: "Read the predictive alerts strip.",
    href: "/executive",
    target: "[data-flow='predictive-strip']",
  },
  // --- Business case 3: Operational visibility ---
  {
    id: "control-tower",
    title: "4 · Live control tower",
    instruction:
      "End-to-end visibility across ocean, air and road. The map adds other traffic and environmental conditions (storms, congestion, heat) that feed the risk model.",
    whatToDo: "Toggle the Weather / Congestion / Other-traffic layers on the map.",
    href: "/control-tower",
    target: "[data-flow='ct-map']",
  },
  {
    id: "open-shipment",
    title: "5 · From overview to one shipment",
    instruction:
      "Operations connects to compliance in one click — any shipment row opens its full traceability record.",
    whatToDo: "Click a shipment row in the table (or press Next to jump there).",
    href: "/control-tower",
    target: "[data-flow='ct-table']",
  },
  // --- Business case 4: DSCSA traceability ---
  {
    id: "traceability",
    title: "6 · Prove provenance (DSCSA)",
    instruction:
      "Trace serial SN0008743 of the COVID-19 vaccine: product, batch, current location, verification status, chain of custody and ownership.",
    whatToDo: "Review the resolved record for SN0008743.",
    href: "/traceability?type=serial&q=SN0008743",
    target: "[data-flow='trace-result']",
  },
  {
    id: "journey",
    title: "7 · End-to-end journey & custody",
    instruction:
      "The End-to-End Journey tab shows the minute-by-minute flow: each stage with custody handoff, owner, dwell time, temperature and exceptions.",
    whatToDo: "Open the 'End-to-End Journey' tab and follow the stages.",
    href: "/traceability?type=serial&q=SN0008743",
    target: "[data-flow='trace-tabs']",
  },
  // --- Business case 5: Cold-chain excursion → recall response ---
  {
    id: "cold-chain",
    title: "8 · Cold-chain root cause",
    instruction:
      "The 10°C excursion is detected and root-caused to the 18h Newark customs delay — correlating environment with logistics, exactly as the map predicted.",
    whatToDo: "Read the root-cause panel and temperature timeline.",
    href: "/cold-chain",
    target: "[data-flow='cc-rootcause']",
  },
  {
    id: "recall",
    title: "9 · Recall readiness",
    instruction:
      "The excursion triggers recall RCL-2026-001: 24,500 impacted / 24,120 located / 380 outstanding, with a live progress tracker and distribution map.",
    whatToDo: "Review the recall progress tracker.",
    href: "/recall",
    target: "[data-flow='recall-tracker']",
  },
  {
    id: "recall-response",
    title: "10 · Recall response",
    instruction:
      "See exactly which trading partners hold or handled the recalled product so outreach and reconciliation can begin immediately.",
    whatToDo: "Review the impacted trading partners.",
    href: "/recall",
    target: "[data-flow='recall-partners']",
  },
  // --- Business case 6: Counterfeit / suspect-product investigation ---
  {
    id: "partners",
    title: "11 · Trading-partner compliance",
    instruction:
      "Authorization, licences and a risk matrix. The Suspect Product Investigation panel surfaces counterfeit, diversion and unauthorized signals.",
    whatToDo: "Inspect the risk matrix and the suspect-product panel.",
    href: "/partners",
    target: "[data-flow='suspect']",
  },
  {
    id: "suspect-investigation",
    title: "12 · Investigate a suspect transfer",
    instruction:
      "Follow a flagged signal to its source: shipment SHP-012 shows an unauthorized custody transfer to GreyMarket Distributors — a potential diversion.",
    whatToDo: "Review the custody chain for SHP-012 (the gap is flagged).",
    href: "/traceability?type=shipment&q=SHP-012",
    target: "[data-flow='trace-result']",
  },
  // --- Business case 7: Exception management ---
  {
    id: "alerts",
    title: "13 · Exception management",
    instruction:
      "Open exceptions — missing scans, delays, deviations, excursions and unauthorized transfers — are always one click away in the alerts drawer.",
    whatToDo: "Open the bell in the top bar to view open alerts.",
    href: "/executive",
    target: "[data-flow='alerts-bell']",
  },
  // --- Business case 8: Conversational & automated intelligence ---
  {
    id: "askme-risk",
    title: "14 · Ask the data — at-risk shipments",
    instruction:
      "Ask natural-language compliance questions; answers are computed from the unified model and reconcile with every dashboard.",
    whatToDo: "Try: 'Show all shipments currently at risk of DSCSA non-compliance'.",
    href: "/askme",
    target: "[data-flow='askme']",
  },
  {
    id: "askme-recall",
    title: "15 · Ask the data — recall impact",
    instruction:
      "The same assistant answers operational and compliance questions with structured tables, charts and drill-through links.",
    whatToDo: "Try: 'List products impacted by Recall RCL-2026-001'.",
    href: "/askme",
    target: "[data-flow='askme']",
  },
  {
    id: "insights",
    title: "16 · Automated insights",
    instruction:
      "Do You Know surfaces data-derived patterns — excursions after customs delays, the carrier driving custody gaps, missing-scan hotspots and more.",
    whatToDo: "Skim the insight cards.",
    href: "/insights",
    target: "[data-flow='insights']",
  },
  {
    id: "predictive",
    title: "17 · Predictive risk",
    instruction:
      "Five explainable risk types per active shipment, plus partner risk — moving from descriptive to predictive, with drivers that match the conditions on the maps.",
    whatToDo: "Explore the risk leaderboard and the top drivers.",
    href: "/predictive",
    target: "[data-flow='risk-leaderboard']",
  },
  {
    id: "wrap",
    title: "You've seen the full journey",
    instruction:
      "From data onboarding → readiness → operations → traceability → cold-chain recall → counterfeit investigation → exceptions → AI. That's end-to-end DSCSA readiness with NetTrace.",
    whatToDo: "Re-run any step from the Getting Started hub, or explore freely.",
    href: "/getting-started",
    target: "[data-flow='getting-started']",
  },
];

export const FLOW_STORAGE_KEY = "nettrace-flow";
