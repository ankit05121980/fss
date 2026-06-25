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
    title: "Welcome to Lumenore",
    instruction:
      "This guided flow walks the entire DSCSA readiness journey for Frontier Scientific — from boardroom readiness to live operations, traceability, compliance and AI.",
    whatToDo: "Press Next to begin. You can stop or resume at any time.",
    href: "/getting-started",
    target: "[data-flow='getting-started']",
  },
  {
    id: "executive",
    title: "1 · Executive readiness",
    instruction:
      "The Executive dashboard is the single pane of glass: overall compliance score, coverage, authorized partners, recall readiness, open risks and active excursions.",
    whatToDo: "Review the KPI strip and the compliance gauge.",
    href: "/executive",
    target: "[data-flow='kpis']",
  },
  {
    id: "exec-predictions",
    title: "2 · Surfaced predictions",
    instruction:
      "Predictive alerts are surfaced right on the executive view so leaders see emerging risk (delay, excursion, partner) before it happens.",
    whatToDo: "Read the predictive alerts strip.",
    href: "/executive",
    target: "[data-flow='predictive-strip']",
  },
  {
    id: "control-tower",
    title: "3 · Control Tower",
    instruction:
      "Operational visibility across ocean, air and road. The global map emphasizes ocean lanes and shows facility & transport-mode icons.",
    whatToDo: "Filter by mode or status and explore the map markers.",
    href: "/control-tower",
    target: "[data-flow='ct-map']",
  },
  {
    id: "open-shipment",
    title: "4 · Drill into a shipment",
    instruction:
      "Every shipment row opens its full traceability record — connecting operations to compliance in one click.",
    whatToDo: "Click any shipment row in the table (or press Next to jump there).",
    href: "/control-tower",
    target: "[data-flow='ct-table']",
  },
  {
    id: "traceability",
    title: "5 · End-to-end traceability",
    instruction:
      "Trace serial SN0008743 of the COVID-19 vaccine: product, batch, custody, ownership, verification and temperature — the heart of DSCSA.",
    whatToDo: "Review the resolved record for SN0008743.",
    href: "/traceability?type=serial&q=SN0008743",
    target: "[data-flow='trace-result']",
  },
  {
    id: "journey",
    title: "6 · The shipment journey",
    instruction:
      "The End-to-End Journey tab shows the minute-by-minute flow: each stage with custody, ownership, dwell time, temperature and exceptions.",
    whatToDo: "Open the 'End-to-End Journey' tab.",
    href: "/traceability?type=serial&q=SN0008743",
    target: "[data-flow='trace-tabs']",
  },
  {
    id: "cold-chain",
    title: "7 · Cold chain root-cause",
    instruction:
      "The 10°C excursion is detected and root-caused to the 18h Newark customs delay — correlating environment with logistics.",
    whatToDo: "Read the root-cause panel and temperature timeline.",
    href: "/cold-chain",
    target: "[data-flow='cc-rootcause']",
  },
  {
    id: "recall",
    title: "8 · Recall readiness",
    instruction:
      "Recall RCL-2026-001 resolves to 24,500 impacted / 24,120 located / 380 outstanding, with a live progress tracker and distribution map.",
    whatToDo: "Review the recall progress tracker.",
    href: "/recall",
    target: "[data-flow='recall-tracker']",
  },
  {
    id: "partners",
    title: "9 · Trading-partner compliance",
    instruction:
      "Authorization, licences and a risk matrix. The Suspect Product Investigation panel surfaces counterfeit / diversion / unauthorized signals.",
    whatToDo: "Inspect the partner risk matrix and suspect-product panel.",
    href: "/partners",
    target: "[data-flow='suspect']",
  },
  {
    id: "alerts",
    title: "10 · Exception alerts",
    instruction:
      "Open exceptions (missing scans, delays, deviations, excursions, unauthorized transfers) are always one click away in the alerts drawer.",
    whatToDo: "Open the bell in the top bar to view open alerts.",
    href: "/executive",
    target: "[data-flow='alerts-bell']",
  },
  {
    id: "askme",
    title: "11 · AskMe",
    instruction:
      "Ask natural-language compliance questions — answers are computed from the unified model and reconcile with every dashboard.",
    whatToDo: "Try an example question chip.",
    href: "/askme",
    target: "[data-flow='askme']",
  },
  {
    id: "insights",
    title: "12 · Do You Know",
    instruction:
      "Automatically generated, data-derived insights surface patterns like excursions after customs delays and the carrier driving custody gaps.",
    whatToDo: "Skim the insight cards.",
    href: "/insights",
    target: "[data-flow='insights']",
  },
  {
    id: "predictive",
    title: "13 · Predictive analytics",
    instruction:
      "Five heuristic risk types per active shipment with explainable drivers and proactive alerts — moving from descriptive to predictive.",
    whatToDo: "Explore the risk leaderboard and partner risk.",
    href: "/predictive",
    target: "[data-flow='risk-leaderboard']",
  },
];

export const FLOW_STORAGE_KEY = "lumenore-flow";
