import { useCallback, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  ClipboardCheck,
  Command,
  Database,
  Droplets,
  ExternalLink,
  Fan,
  FileText,
  Gauge,
  Layers3,
  LineChart as LineChartIcon,
  MonitorPlay,
  PlayCircle,
  Presentation,
  RadioTower,
  Square,
  SunMedium,
  ThermometerSun,
  TimerReset,
  Usb,
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AtriumAirflowVisualizer } from "./components/AtriumAirflowVisualizer";
import { AtriumVisualizerPage } from "./components/AtriumVisualizerPage";
import { RoiCalculatorPanel } from "./components/RoiCalculatorPanel";
import { useSensorStream } from "./hooks/useSensorStream";
import {
  formatSensorTime,
  sensorModeMeta,
  sensorModes,
  sensorSourceLabels,
  sensorSources,
  type SensorMode,
  type SensorReading,
  type SensorSource,
} from "./lib/sensorData";
import { recommendDesign, type DesignInputs } from "./lib/simulation";
import {
  CommandPalette,
  PlatformModulePage,
  type PlatformTabKey,
} from "./PlatformModules";

type TabKey = PlatformTabKey;
type TimeOfDay = "morning" | "noon" | "evening";
type ScenarioLevel = "low" | "medium" | "high";
type VentilationMode = "passive" | "assisted" | "optimized";
type ScenarioBuildingType = "mall" | "airport" | "office" | "university" | "hotel";

type SimulationScenario = {
  timeOfDay: TimeOfDay;
  solarIntensity: ScenarioLevel;
  occupancyLoad: ScenarioLevel;
  ventilationMode: VentilationMode;
  buildingType: ScenarioBuildingType;
};

type ScenarioMetrics = {
  indoorTempReductionC: number;
  airflowVelocityMs: number;
  stackEffectStrengthPct: number;
  coolingLoadReductionPct: number;
  comfortIndexPct: number;
  solarGainPct: number;
  annualEnergySavingsRm: number;
};

type SavingsInputs = {
  buildingSizeM2: number;
  atriumHeightM: number;
  operatingHours: number;
  electricityCostRmKwh: number;
  coolingIntensity: number;
};

type SavingsEstimate = {
  annualEnergySavingsRm: number;
  coolingLoadReductionPct: number;
  paybackYears: { min: number; max: number };
  co2ReductionTonnes: number;
};

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: "visualizer", label: "Visualizer", icon: Wind },
  { key: "overview", label: "Overview", icon: Building2 },
  { key: "live", label: "Live Demo", icon: RadioTower },
  { key: "design", label: "Design Engine", icon: Layers3 },
  { key: "roi", label: "ROI", icon: Calculator },
  { key: "pilot", label: "Pilot Hub", icon: ClipboardCheck },
];

const backgroundUrl = "/assets/backgrounds/parametric-atrium.svg";

const defaultScenario: SimulationScenario = {
  timeOfDay: "noon",
  solarIntensity: "medium",
  occupancyLoad: "medium",
  ventilationMode: "optimized",
  buildingType: "mall",
};

const timeOfDayOptions: Array<{ value: TimeOfDay; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "noon", label: "Noon" },
  { value: "evening", label: "Evening" },
];

const levelOptions: Array<{ value: ScenarioLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const ventilationOptions: Array<{ value: VentilationMode; label: string }> = [
  { value: "passive", label: "Passive" },
  { value: "assisted", label: "Assisted" },
  { value: "optimized", label: "Optimized" },
];

const buildingTypeOptions: Array<{ value: ScenarioBuildingType; label: string }> = [
  { value: "mall", label: "Mall" },
  { value: "airport", label: "Airport" },
  { value: "office", label: "Office atrium" },
  { value: "university", label: "University hall" },
  { value: "hotel", label: "Hotel" },
];

const scenarioAutoplay: SimulationScenario[] = [
  { timeOfDay: "morning", solarIntensity: "medium", occupancyLoad: "low", ventilationMode: "passive", buildingType: "university" },
  { timeOfDay: "noon", solarIntensity: "high", occupancyLoad: "high", ventilationMode: "optimized", buildingType: "mall" },
  { timeOfDay: "evening", solarIntensity: "low", occupancyLoad: "medium", ventilationMode: "assisted", buildingType: "airport" },
];

const levelFactors: Record<ScenarioLevel, number> = {
  low: 0.72,
  medium: 1,
  high: 1.28,
};

const timeFactors: Record<TimeOfDay, number> = {
  morning: 0.72,
  noon: 1.28,
  evening: 0.86,
};

const ventilationFactors: Record<VentilationMode, number> = {
  passive: 0.78,
  assisted: 1,
  optimized: 1.22,
};

const buildingFactors: Record<ScenarioBuildingType, number> = {
  mall: 1.08,
  airport: 1.18,
  office: 0.92,
  university: 0.86,
  hotel: 0.96,
};

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const isDemoHub = pathname === "/demo-hub";
  const [activeTab, setActiveTabState] = useState<TabKey>(() => getInitialTab(pathname));
  const [commandOpen, setCommandOpen] = useState(false);
  const [demoDayMode, setDemoDayMode] = useState(false);
  const navScrollRef = useRef<HTMLElement | null>(null);
  const [navScrollState, setNavScrollState] = useState({ left: false, right: false });

  const updateNavScrollState = useCallback(() => {
    const rail = navScrollRef.current;
    if (!rail) {
      return;
    }

    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setNavScrollState({
      left: rail.scrollLeft > 4,
      right: rail.scrollLeft < maxScroll - 4,
    });
  }, []);

  const scrollTabIntoView = useCallback((tab: TabKey) => {
    window.setTimeout(() => {
      const activeTabElement = navScrollRef.current?.querySelector<HTMLElement>(`[data-tab-key="${tab}"]`);
      activeTabElement?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 0);
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveTabState(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const rail = navScrollRef.current;
    if (!rail) {
      return undefined;
    }

    const onScroll = () => updateNavScrollState();
    const onResize = () => updateNavScrollState();
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateNavScrollState) : null;

    updateNavScrollState();
    window.setTimeout(updateNavScrollState, 0);
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    resizeObserver?.observe(rail);

    return () => {
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [activeTab, updateNavScrollState]);

  useEffect(() => {
    scrollTabIntoView(activeTab);
  }, [activeTab, scrollTabIntoView]);

  function setActiveTab(tab: TabKey) {
    setActiveTabState(tab);
    window.history.replaceState(null, "", `/#${tab}`);
  }

  function scrollNav(direction: "left" | "right") {
    const rail = navScrollRef.current;
    if (!rail) {
      return;
    }

    const distance = Math.max(260, rail.clientWidth * 0.72);
    rail.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  function handleNavWheel(event: WheelEvent<HTMLElement>) {
    const rail = navScrollRef.current;
    if (!rail) {
      return;
    }

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (maxScroll <= 0 || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      return;
    }

    const nextScroll = rail.scrollLeft + event.deltaY;
    const canScroll =
      (event.deltaY < 0 && rail.scrollLeft > 0) || (event.deltaY > 0 && rail.scrollLeft < maxScroll);

    if (canScroll) {
      event.preventDefault();
      rail.scrollLeft = Math.min(maxScroll, Math.max(0, nextScroll));
    }
  }

  if (isDemoHub) {
    return <DemoHubPage />;
  }

  return (
    <main className={`studio-shell min-h-screen overflow-x-hidden text-atrium-paper ${demoDayMode ? "text-[18px]" : ""}`}>
      <div
        className="ambient-media fixed inset-0 -z-30 bg-atrium-ink bg-cover bg-center opacity-[0.32]"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="ambient-backdrop fixed inset-0 -z-20" />
      <div className="ambient-grid pointer-events-none fixed inset-0 -z-10" />
      <div className="ambient-ribbons pointer-events-none fixed inset-0 -z-10" />

      {demoDayMode && (
        <button
          className="fixed right-5 top-5 z-40 rounded-lg border border-white/15 bg-[#d7ff3f] px-4 py-3 text-sm font-black text-[#090616] shadow-2xl"
          onClick={() => setDemoDayMode(false)}
        >
          Exit Demo Day
        </button>
      )}

      <div className="spatial-app mx-auto min-h-screen max-w-[1820px] px-4 pb-12 pt-4 md:px-6 lg:px-8">
        {!demoDayMode && (
          <header className="spatial-nav">
            <div className="spatial-brand" aria-label="BreatheAtrium Studio">
              <div className="brand-mark grid h-11 w-11 place-items-center rounded-full font-black text-[#090616]">BA</div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#d7ff3f]">BreatheAtrium</p>
                <h1 className="truncate text-lg font-black leading-tight text-atrium-paper">Studio</h1>
              </div>
            </div>

            <div
              className={`spatial-dock-shell ${navScrollState.left ? "spatial-dock-has-left" : ""} ${
                navScrollState.right ? "spatial-dock-has-right" : ""
              }`}
            >
              <button
                aria-label="Scroll navigation left"
                className="spatial-scroll-button spatial-scroll-button-left"
                disabled={!navScrollState.left}
                onClick={() => scrollNav("left")}
                type="button"
              >
                <ChevronLeft size={15} />
              </button>
              <nav
                aria-label="Studio spaces"
                className="spatial-dock"
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    scrollNav("left");
                  }
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    scrollNav("right");
                  }
                }}
                onWheel={handleNavWheel}
                ref={navScrollRef}
                tabIndex={0}
              >
                {tabs.map((tab) => (
                  <button
                    className={`spatial-tab ${activeTab === tab.key ? "spatial-tab-active" : ""}`}
                    data-tab-key={tab.key}
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    title={tab.label}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
              <button
                aria-label="Scroll navigation right"
                className="spatial-scroll-button spatial-scroll-button-right"
                disabled={!navScrollState.right}
                onClick={() => scrollNav("right")}
                type="button"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="spatial-actions">
              <span className="spatial-data-pill">Simulated data</span>
              <button className="spatial-icon-button" onClick={() => setCommandOpen(true)} title="Command palette">
                <Command size={17} />
                <span className="hidden xl:inline">Ctrl K</span>
              </button>
              <button className="spatial-icon-button" onClick={() => setDemoDayMode(true)} title="Demo Day Mode">
                <MonitorPlay size={17} />
              </button>
            </div>
          </header>
        )}

        <motion.section
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className={`spatial-stage min-w-0 ${demoDayMode ? "pt-4" : "pt-6 md:pt-9"}`}
          initial={false}
          key={activeTab}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === "visualizer" && <AtriumVisualizerPage embedded />}
          {activeTab === "overview" && <OverviewPage onJump={setActiveTab} />}
          {activeTab === "live" && <LiveDemoPage />}
          {activeTab === "design" && <DesignEnginePage />}
          {activeTab === "roi" && <RoiPage />}
          {activeTab === "pilot" && <PlatformModulePage tab="pilot" />}
        </motion.section>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={setActiveTab} />
    </main>
  );
}

function getTabFromHash(): TabKey {
  const hash = window.location.hash.replace("#", "");
  return tabs.some((tab) => tab.key === hash) ? (hash as TabKey) : "visualizer";
}

function getInitialTab(pathname: string): TabKey {
  const hash = window.location.hash.replace("#", "");
  if (tabs.some((tab) => tab.key === hash)) {
    return hash as TabKey;
  }

  if (pathname === "/atrium-visualizer") {
    return "visualizer";
  }

  return "visualizer";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculateScenarioMetrics(reading: SensorReading, scenario: SimulationScenario): ScenarioMetrics {
  const active = reading.mode === "breathe_atrium";
  const solar = levelFactors[scenario.solarIntensity] * timeFactors[scenario.timeOfDay];
  const occupancy = levelFactors[scenario.occupancyLoad];
  const ventilation = ventilationFactors[scenario.ventilationMode];
  const building = buildingFactors[scenario.buildingType];
  const thermalStratification = Math.max(0.4, reading.topTempC - reading.occupiedTempC);
  const baseAirflow = reading.airflowMs * (active ? ventilation * 1.05 : 0.72);
  const stackEffectStrengthPct = active ? clamp(42 + solar * 16 + ventilation * 18 + thermalStratification * 2.4 - occupancy * 6, 28, 96) : clamp(18 + solar * 7, 12, 36);
  const airflowVelocityMs = active ? clamp(baseAirflow + solar * 0.08 - occupancy * 0.02, 0.38, 1.35) : clamp(reading.airflowMs * 0.72, 0.08, 0.34);
  const indoorTempReductionC = active ? clamp(1.8 + solar * 0.85 + ventilation * 1.2 - occupancy * 0.38 + building * 0.22, 1.4, 6.8) : clamp(0.2 + solar * 0.18, 0.1, 0.8);
  const coolingLoadReductionPct = active ? clamp(4.8 + solar * 2.4 + ventilation * 4.2 - occupancy * 1.2 + building * 1.4, 5, 18) : clamp(0.4 + solar * 0.35, 0.3, 1.6);
  const comfortIndexPct = active ? clamp(64 + indoorTempReductionC * 4.4 + airflowVelocityMs * 8 - occupancy * 4, 58, 93) : clamp(42 + airflowVelocityMs * 8 - occupancy * 3, 34, 54);
  const solarGainPct = clamp(solar * 58 + (scenario.timeOfDay === "noon" ? 14 : 2), 18, 96);
  const annualEnergySavingsRm = active ? Math.round((54000 * building * (coolingLoadReductionPct / 100) * (0.82 + occupancy * 0.18)) / 100) * 100 : 0;

  return {
    indoorTempReductionC: Number(indoorTempReductionC.toFixed(1)),
    airflowVelocityMs: Number(airflowVelocityMs.toFixed(2)),
    stackEffectStrengthPct: Math.round(stackEffectStrengthPct),
    coolingLoadReductionPct: Number(coolingLoadReductionPct.toFixed(1)),
    comfortIndexPct: Math.round(comfortIndexPct),
    solarGainPct: Math.round(solarGainPct),
    annualEnergySavingsRm,
  };
}

function estimateSavings(inputs: SavingsInputs): SavingsEstimate {
  const heightLift = clamp((inputs.atriumHeightM - 10) / 45, 0, 0.42);
  const runtimeFactor = clamp(inputs.operatingHours / 12, 0.55, 1.45);
  const coolingLoadReductionPct = clamp(6.5 + heightLift * 7.5 + (inputs.coolingIntensity - 90) * 0.025, 5, 16);
  const atriumCoolingProxyKwh = inputs.buildingSizeM2 * inputs.coolingIntensity * runtimeFactor * 0.11;
  const savedKwh = atriumCoolingProxyKwh * (coolingLoadReductionPct / 100);
  const annualEnergySavingsRm = Math.round(savedKwh * inputs.electricityCostRmKwh);
  const assumedRetrofitLow = inputs.buildingSizeM2 * 8;
  const assumedRetrofitHigh = inputs.buildingSizeM2 * 18;
  const paybackYears = {
    min: Number((assumedRetrofitLow / Math.max(annualEnergySavingsRm, 1)).toFixed(1)),
    max: Number((assumedRetrofitHigh / Math.max(annualEnergySavingsRm, 1)).toFixed(1)),
  };

  return {
    annualEnergySavingsRm,
    coolingLoadReductionPct: Number(coolingLoadReductionPct.toFixed(1)),
    paybackYears,
    co2ReductionTonnes: Number((savedKwh * 0.584 / 1000).toFixed(1)),
  };
}

function DemoHubPage() {
  const actions = [
    {
      label: "View dashboard",
      body: "Open the live BreatheAtrium Studio demo.",
      href: "/#overview",
      icon: LineChartIcon,
      tag: "product demo",
    },
    {
      label: "View pilot proposal",
      body: "Read the 90-day facility-manager pilot pack.",
      href: "/deliverables/breathe-atrium-90-day-pilot.html",
      icon: ClipboardCheck,
      tag: "next step",
    },
    {
      label: "View visualizer",
      body: "Open the cinematic 3D UM IP explainer.",
      href: "/#visualizer",
      icon: Wind,
      tag: "stage demo",
    },
    {
      label: "View prototype guide",
      body: "Follow the recommended live demo flow.",
      href: "/deliverables/prototype-guide.html",
      icon: CircuitBoard,
      tag: "offline guide",
    },
  ];

  return (
    <main className="studio-shell min-h-screen overflow-hidden text-atrium-paper">
      <div
        className="ambient-media fixed inset-0 -z-30 bg-atrium-ink bg-cover bg-center opacity-[0.34]"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="ambient-backdrop fixed inset-0 -z-20" />
      <div className="ambient-grid pointer-events-none fixed inset-0 -z-10" />
      <div className="ambient-ribbons pointer-events-none fixed inset-0 -z-10" />

      <section className="mx-auto grid min-h-screen max-w-7xl content-center gap-5 px-5 py-8">
        <div className="page-hero relative overflow-hidden rounded-lg p-6 md:p-10 xl:p-12">
          <AirflowRibbons />
          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="brand-mark grid h-14 w-14 place-items-center rounded-lg text-lg font-black text-[#090616]">BA</div>
                <div>
                  <p className="eyebrow">Demo hub</p>
                  <p className="font-bold text-atrium-cloud">National Deep Tech Challenge</p>
                </div>
              </div>
              <h1 className="display-title mt-8 max-w-4xl text-6xl md:text-8xl">
                BreatheAtrium
              </h1>
              <p className="body-copy mt-6 max-w-3xl text-xl">
                Turn overheated glass atriums into measurable, lower-energy breathing spaces.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="platform-button min-h-12 px-5" href="/#overview">
                  View dashboard
                  <ArrowRight size={18} />
                </a>
                <a
                  className="platform-button-secondary min-h-12 px-5"
                  href="/deliverables/breathe-atrium-90-day-pilot.html"
                >
                  Pilot proposal
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="status-pill rounded-lg px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em]">
                Data shown is simulated unless labeled measured
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {actions.map((action) => (
                  <HubActionCard key={action.label} {...action} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
          <div className="surface-card rounded-lg p-6">
            <p className="eyebrow">Contact / team</p>
            <h2 className="mt-3 text-3xl font-black text-atrium-paper">BreatheAtrium Team</h2>
            <p className="body-copy mt-3 max-w-3xl">
              Replace this placeholder with team names, email, QR booth link, mentor contact, or UM commercialization contact before the final pitch.
            </p>
          </div>

          <div className="surface-card rounded-lg p-6">
            <p className="eyebrow">Local fallback</p>
            <div className="mt-4 flex items-center gap-4">
              <img alt="Demo hub QR code" className="h-24 w-24 rounded-lg bg-atrium-paper p-2" src="/demo-hub-qr.svg" />
              <div>
                <p className="font-black text-atrium-paper">QR target</p>
                <p className="mt-1 text-sm text-atrium-cloud">Regenerate for your booth or deployed URL before presenting.</p>
              </div>
            </div>
            <p className="body-copy mt-3">
              Run <strong className="text-atrium-paper">npm run dev</strong>, open the Vite URL, then add
              <strong className="text-atrium-paper"> /demo-hub</strong>. If the QR points to a local network URL, keep this laptop and phones on the same booth network.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function HubActionCard({
  label,
  body,
  href,
  icon: Icon,
  tag,
}: {
  label: string;
  body: string;
  href: string;
  icon: LucideIcon;
  tag: string;
}) {
  return (
    <a className="surface-card surface-card-hover group rounded-lg p-5" href={href}>
      <Icon className="text-[#d7ff3f] transition group-hover:text-[#20f0d0]" size={24} />
      <span className="mt-4 block text-[11px] font-black uppercase tracking-[0.16em] text-[#20f0d0]">{tag}</span>
      <strong className="mt-2 block text-2xl font-black leading-tight text-atrium-paper">{label}</strong>
      <span className="mt-2 block text-sm leading-6 text-atrium-cloud">{body}</span>
    </a>
  );
}

function OverviewPage({ onJump }: { onJump: (tab: TabKey) => void }) {
  return (
    <div className="page-stack product-story grid">
      <section className="page-hero story-hero relative min-h-[720px] overflow-hidden rounded-lg p-6 md:p-10 xl:p-12">
        <AirflowRibbons />
        <div className="relative z-10 grid min-h-[620px] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="flex flex-col justify-center">
            <p className="eyebrow">BreatheAtrium climate twin</p>
            <h2 className="display-title mt-5 max-w-4xl text-5xl md:text-7xl 2xl:text-8xl">
              The building that breathes.
            </h2>
            <p className="body-copy mt-6 max-w-2xl text-lg">
              Atriums should not need industrial-scale cooling to remain habitable. Breathe Atrium turns trapped heat into
              upward motion, so cooling begins before the air conditioner switches on.
            </p>
            <div className="story-arc-strip mt-8">
              {[
                ["Problem", "Atriums trap heat."],
                ["Insight", "Hot air wants to rise."],
                ["Solution", "Envelope becomes engine."],
                ["Result", "Less mechanical force."],
              ].map(([label, body]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{body}</strong>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="platform-button min-h-12 px-5" onClick={() => onJump("live")}>
                Open digital twin
                <ArrowRight size={18} />
              </button>
              <button className="platform-button-secondary min-h-12 px-5" onClick={() => onJump("design")}>
                Design a retrofit
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <AtriumAirflowVisualizer defaultMode="breathe" surface="bare" />
        </div>
      </section>

      <StoryArcSection onJump={onJump} />
      <BeforeAfterComparison />
      <HowItWorksSection />
      <ApplicationsSection />
      <CostSavingsEstimator />
      <DeveloperValueSection />
      <section className="story-cta page-hero p-6 md:p-10">
        <div>
          <p className="eyebrow">Next move</p>
          <h2 className="display-title mt-4 max-w-5xl text-4xl md:text-6xl">Design the next breathing building.</h2>
          <p className="body-copy mt-5 max-w-3xl text-lg">
            One pilot atrium. Ninety days. Sensor-backed evidence for comfort, airflow, cooling load proxy, and commercial decision-making.
          </p>
        </div>
        <button className="platform-button min-h-12 px-5" onClick={() => onJump("pilot")}>
          Open pilot hub
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}

function StoryArcSection({ onJump }: { onJump: (tab: TabKey) => void }) {
  const steps = [
    {
      icon: ThermometerSun,
      title: "Atriums trap heat.",
      body: "Beautiful glazed volumes often become thermal reservoirs. The air looks still, but the cooling bill keeps moving.",
    },
    {
      icon: SunMedium,
      title: "The sun can drive motion.",
      body: "Solar heat strengthens the upward exhaust path instead of only adding load to the space below.",
    },
    {
      icon: Wind,
      title: "The envelope becomes the ventilation engine.",
      body: "Low-level intake, occupied-zone cross-flow, double-skin cavity, and stack flue work as one passive system.",
    },
    {
      icon: Gauge,
      title: "Cooling demand drops before HVAC reacts.",
      body: "The goal is mixed-mode comfort: lower heat build-up, better comfort hours, and less mechanical force.",
    },
  ];

  return (
    <section className="story-section story-arc-section">
      <div className="story-section-copy">
        <p className="eyebrow">Guided pitch</p>
        <h2 className="display-title mt-4 text-4xl md:text-6xl">From heat trap to breathing infrastructure.</h2>
        <p className="body-copy mt-5 text-lg">
          Breathe Atrium is not a decorative vent. It is a retrofit logic for large-volume spaces where architecture,
          passive physics, sensors, and business evidence need to move together.
        </p>
        <button className="platform-button mt-7 min-h-12 px-5" onClick={() => onJump("live")}>
          Run the simulation
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="story-step-flow">
        {steps.map((step, index) => (
          <article className="story-step surface-card-hover" key={step.title}>
            <div className="story-step-index">{String(index + 1).padStart(2, "0")}</div>
            <step.icon size={24} />
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BeforeAfterComparison() {
  return (
    <section className="story-section before-after-section">
      <div className="story-section-copy">
        <p className="eyebrow">Five-second comparison</p>
        <h2 className="display-title mt-4 text-4xl md:text-6xl">Same atrium. Different physics.</h2>
        <p className="body-copy mt-5 text-lg">
          Conventional atriums keep heat overhead until mechanical cooling fights it. Breathe Atrium gives hot air a
          dignified exit and pulls replacement air through the occupied zone.
        </p>
      </div>

      <div className="comparison-grid">
        <ComparisonAtriumCard
          mode="conventional"
          title="Conventional Atrium"
          bullets={["Heat trapped at ceiling", "Stagnant air pockets", "Heavy HVAC dependency", "High operating cost"]}
        />
        <ComparisonAtriumCard
          mode="breathe"
          title="Breathe Atrium"
          bullets={["Hot air rises and escapes", "Cooler air enters below", "Flow paths stay visible", "Reduced cooling burden"]}
        />
      </div>
    </section>
  );
}

function ComparisonAtriumCard({
  mode,
  title,
  bullets,
}: {
  mode: "conventional" | "breathe";
  title: string;
  bullets: string[];
}) {
  const active = mode === "breathe";

  return (
    <article className={`comparison-card comparison-card-${mode}`}>
      <div className="comparison-visual" aria-label={`${title} airflow visualization`}>
        <svg viewBox="0 0 620 420" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`skin-${mode}`} x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#EEF6FB" stopOpacity="0.42" />
              <stop offset="58%" stopColor={active ? "#20F0D0" : "#FF8A3D"} stopOpacity="0.14" />
              <stop offset="100%" stopColor="#8F7CFF" stopOpacity="0.04" />
            </linearGradient>
            <radialGradient id={`thermal-${mode}`} cx="52%" cy={active ? "56%" : "30%"} r="52%">
              <stop offset="0%" stopColor={active ? "#20F0D0" : "#FF8A3D"} stopOpacity={active ? "0.44" : "0.62"} />
              <stop offset="100%" stopColor={active ? "#20F0D0" : "#FF4FD8"} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`flow-${mode}`} x1="0%" x2="100%">
              <stop offset="0%" stopColor="#20F0D0" stopOpacity="0" />
              <stop offset="45%" stopColor={active ? "#B8FFFF" : "#FF8A3D"} stopOpacity="0.9" />
              <stop offset="100%" stopColor={active ? "#20F0D0" : "#FF4FD8"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="316" cy="356" rx="230" ry="34" fill="#000" opacity="0.4" />
          <path d="M112 350 C144 245 182 142 238 78 C330 50 440 54 512 100 C546 205 570 286 582 332 C412 384 238 384 112 350 Z" fill={`url(#skin-${mode})`} stroke="#DCE8EF" strokeOpacity="0.46" strokeWidth="2" />
          <path d="M238 78 C326 20 440 32 512 100 C410 128 308 130 238 78 Z" fill={`url(#skin-${mode})`} stroke="#DCE8EF" strokeOpacity="0.4" />
          <ellipse cx={active ? "345" : "372"} cy={active ? "274" : "138"} rx={active ? "176" : "205"} ry={active ? "68" : "92"} fill={`url(#thermal-${mode})`} />
          {active ? (
            <>
              <path className="comparison-flow" d="M44 332 C190 310 302 318 404 278 C482 248 512 190 536 112" stroke={`url(#flow-${mode})`} strokeLinecap="round" strokeWidth="18" />
              <path className="comparison-flow comparison-flow-delay" d="M414 278 C506 224 556 152 608 118" stroke="#EAF7FF" strokeLinecap="round" strokeWidth="12" opacity="0.58" />
            </>
          ) : (
            <>
              <path className="comparison-heat" d="M282 126 C262 184 278 230 250 282" stroke={`url(#flow-${mode})`} strokeLinecap="round" strokeWidth="17" />
              <path className="comparison-heat comparison-flow-delay" d="M398 120 C424 178 410 236 438 294" stroke={`url(#flow-${mode})`} strokeLinecap="round" strokeWidth="17" />
            </>
          )}
        </svg>
      </div>
      <div>
        <p className="eyebrow">{active ? "Passive mixed-mode path" : "Baseline condition"}</p>
        <h3>{title}</h3>
        <div className="comparison-bullets">
          {bullets.map((bullet) => (
            <span key={bullet}>
              <CheckCircle2 size={15} />
              {bullet}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function HowItWorksSection() {
  const stages = [
    ["Solar radiation", "Solar radiation heats the glazed cavity."],
    ["Warm air rises", "Warm air rises through the double-skin wall."],
    ["Stack flue", "The stack flue accelerates upward exhaust."],
    ["Cool air intake", "Cooler air is drawn into the occupied zone."],
    ["Lower demand", "Mechanical cooling demand is reduced."],
  ];

  return (
    <section className="story-section how-section">
      <div className="story-section-copy">
        <p className="eyebrow">How it works</p>
        <h2 className="display-title mt-4 text-4xl md:text-6xl">Cooling begins in the architecture.</h2>
        <p className="body-copy mt-5 text-lg">
          The system is simple enough to explain in a room, but measurable enough to defend in a pilot report.
        </p>
      </div>
      <div className="how-stage-rail">
        {stages.map(([title, body], index) => (
          <article className="how-stage" key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApplicationsSection() {
  const applications = [
    ["Malls", "Large public volumes with visible heat pain."],
    ["Airports", "Tall halls with long operating hours."],
    ["Offices", "Premium lobbies that must stay comfortable."],
    ["Hotels", "Arrival spaces where comfort shapes brand."],
    ["Campuses", "Institutional atriums ready for pilot evidence."],
  ];

  return (
    <section className="story-section applications-section">
      <div className="story-section-copy">
        <p className="eyebrow">Where it starts</p>
        <h2 className="display-title mt-4 text-4xl md:text-6xl">Start where the heat is visible.</h2>
      </div>
      <div className="application-orbit">
        {applications.map(([title, body], index) => (
          <article className={`application-cell application-cell-${index}`} key={title}>
            <Building2 size={20} />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CostSavingsEstimator() {
  const [inputs, setInputs] = useState<SavingsInputs>({
    buildingSizeM2: 22000,
    atriumHeightM: 26,
    operatingHours: 12,
    electricityCostRmKwh: 0.52,
    coolingIntensity: 115,
  });
  const estimate = useMemo(() => estimateSavings(inputs), [inputs]);

  function update<K extends keyof SavingsInputs>(key: K, value: SavingsInputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="story-section estimator-section">
      <div className="story-section-copy">
        <p className="eyebrow">Indicative estimator</p>
        <h2 className="display-title mt-4 text-4xl md:text-6xl">Translate airflow into a buyer conversation.</h2>
        <p className="body-copy mt-5 text-lg">
          These are simulated planning estimates, not certified engineering calculations. They exist to frame the audit,
          pilot, and retrofit discussion.
        </p>
      </div>

      <div className="estimator-panel">
        <div className="estimator-controls">
          <Slider label="Building size" value={inputs.buildingSizeM2} min={5000} max={120000} step={1000} unit="m2" onChange={(value) => update("buildingSizeM2", value)} />
          <Slider label="Atrium height" value={inputs.atriumHeightM} min={8} max={60} unit="m" onChange={(value) => update("atriumHeightM", value)} />
          <Slider label="Operating hours" value={inputs.operatingHours} min={6} max={24} unit="h/day" onChange={(value) => update("operatingHours", value)} />
          <Slider label="Electricity cost" value={inputs.electricityCostRmKwh} min={0.25} max={0.9} step={0.01} unit="RM/kWh" onChange={(value) => update("electricityCostRmKwh", value)} />
          <Slider label="Cooling intensity" value={inputs.coolingIntensity} min={55} max={220} step={5} unit="kWh/m2 yr" onChange={(value) => update("coolingIntensity", value)} />
        </div>

        <div className="estimator-results">
          <SavingsResultCard label="Annual energy savings" value={`RM ${estimate.annualEnergySavingsRm.toLocaleString()}`} tag="indicative" />
          <SavingsResultCard label="Cooling load reduction" value={`${estimate.coolingLoadReductionPct}%`} tag="assumed range logic" />
          <SavingsResultCard label="Payback potential" value={`${estimate.paybackYears.min}-${estimate.paybackYears.max} yrs`} tag="capex assumption" />
          <SavingsResultCard label="CO2 reduction" value={`${estimate.co2ReductionTonnes} t/yr`} tag="emissions assumption" />
        </div>
      </div>
    </section>
  );
}

function SavingsResultCard({ label, value, tag }: { label: string; value: string; tag: string }) {
  return (
    <article className="savings-result-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{tag}</em>
    </article>
  );
}

function DeveloperValueSection() {
  const pillars = [
    "Reduced HVAC operating cost",
    "Improved occupant comfort",
    "Lower carbon footprint",
    "Green building certification support",
    "Premium architectural differentiation",
    "Better performance for large-volume spaces",
  ];

  return (
    <section className="story-section developer-section">
      <div className="story-section-copy">
        <p className="eyebrow">Why developers care</p>
        <h2 className="display-title mt-4 text-4xl md:text-6xl">Commercial value, not academic novelty.</h2>
        <p className="body-copy mt-5 text-lg">
          Building owners do not buy airflow. They buy lower risk, better comfort, lower operating burden, and a
          more intelligent asset story.
        </p>
      </div>
      <div className="developer-pillars">
        {pillars.map((pillar) => (
          <article className="developer-pillar" key={pillar}>
            <CheckCircle2 size={18} />
            <span>{pillar}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function BeforeAfterAtrium() {
  return (
    <div className="grid gap-4 self-center">
      <AtriumStateCard
        label="Before"
        title="Dead Atrium"
        tone="hot"
        metrics={["Top layer: 42.6 C simulated", "Weak airflow", "HVAC compensates late"]}
      />
      <AtriumStateCard
        label="After"
        title="BreatheAtrium Mode"
        tone="cool"
        metrics={["Top layer: 37.9 C simulated", "Cross-flow active", "BMS keeps HVAC in reserve"]}
      />
    </div>
  );
}

function AtriumStateCard({
  label,
  title,
  tone,
  metrics,
}: {
  label: string;
  title: string;
  tone: "hot" | "cool";
  metrics: string[];
}) {
  const activeTone =
    tone === "hot"
      ? "from-atrium-coral/35 via-atrium-gold/20 to-white/5"
      : "from-atrium-mint/30 via-atrium-teal/30 to-white/5";

  return (
    <article className={`surface-card surface-card-hover relative overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br ${activeTone} p-5`}>
      <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-atrium-gold/30 blur-2xl" />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-atrium-gold">{label}</p>
      <h3 className="mt-2 text-3xl font-black text-atrium-paper">{title}</h3>
      <div className="mt-5 grid gap-2">
        {metrics.map((metric) => (
          <div className="flex items-center gap-2 text-sm text-atrium-cloud" key={metric}>
            <CheckCircle2 className="text-atrium-mint" size={16} />
            {metric}
          </div>
        ))}
      </div>
    </article>
  );
}

function LiveDemoPage() {
  const stream = useSensorStream();
  const activeMode = sensorModeMeta[stream.reading.mode];
  const sourceTag = stream.source === "simulated" ? "simulated" : stream.source === "csv" ? "playback" : "hardware";
  const isSerialRunning = stream.source === "serial" && stream.status === "running";
  const isRunButtonActive = stream.isDemoRunActive || isSerialRunning;
  const [scenario, setScenario] = useState<SimulationScenario>(defaultScenario);
  const [xrayMode, setXrayMode] = useState(false);
  const [thermalMap, setThermalMap] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const scenarioMetrics = useMemo(() => calculateScenarioMetrics(stream.reading, scenario), [stream.reading, scenario]);

  useEffect(() => {
    if (!presentationMode) return;
    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % scenarioAutoplay.length;
      setScenario(scenarioAutoplay[index]);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [presentationMode]);

  function updateScenario<K extends keyof SimulationScenario>(key: K, value: SimulationScenario[K]) {
    setScenario((current) => ({ ...current, [key]: value }));
  }

  const digitalTwinMetrics: Array<{ label: string; value: string; icon: LucideIcon; status: string; tone: string }> = [
    { label: "Temperature reduction", value: `${scenarioMetrics.indoorTempReductionC} C`, icon: ThermometerSun, status: "estimated", tone: "thermal" },
    { label: "Airflow velocity", value: `${scenarioMetrics.airflowVelocityMs} m/s`, icon: Fan, status: sourceTag, tone: "air" },
    { label: "Stack effect strength", value: `${scenarioMetrics.stackEffectStrengthPct}%`, icon: Wind, status: "simulated", tone: "air" },
    { label: "Cooling load reduction", value: `${scenarioMetrics.coolingLoadReductionPct}%`, icon: Gauge, status: "pilot target", tone: "cool" },
    { label: "Comfort index", value: `${scenarioMetrics.comfortIndexPct}%`, icon: Activity, status: "estimated", tone: "silver" },
    { label: "Solar gain level", value: `${scenarioMetrics.solarGainPct}%`, icon: SunMedium, status: scenario.timeOfDay, tone: "solar" },
    { label: "Energy savings", value: `RM ${scenarioMetrics.annualEnergySavingsRm.toLocaleString()}/yr`, icon: BadgeDollarSign, status: "indicative", tone: "silver" },
  ];
  const trendData = stream.history.map((item) => ({
    time: formatSensorTime(item.timestamp),
    topTempC: item.topTempC,
    occupiedTempC: item.occupiedTempC,
    airflowIndex: Number((item.airflowMs * 50).toFixed(1)),
  }));

  return (
    <PageFrame badge="ESTIMATED DEMO DATA" eyebrow="Live Simulation Twin" title="A breathing building simulation, not a static dashboard.">
      <div className={`live-experience ${presentationMode ? "live-presentation-mode" : ""}`}>
        <div className="live-demo-toolbar">
          <div>
            <p className="eyebrow">Scenario studio</p>
            <h3>Trapped heat becomes upward motion.</h3>
          </div>
          <div className="live-demo-actions">
            <button className={`micro-toggle ${thermalMap ? "micro-toggle-active" : ""}`} onClick={() => setThermalMap((value) => !value)}>
              <ThermometerSun size={16} />
              Thermal map
            </button>
            <button className={`micro-toggle ${xrayMode ? "micro-toggle-active" : ""}`} onClick={() => setXrayMode((value) => !value)}>
              <Layers3 size={16} />
              X-Ray mode
            </button>
            <button className={`micro-toggle ${presentationMode ? "micro-toggle-active" : ""}`} onClick={() => setPresentationMode((value) => !value)}>
              <Presentation size={16} />
              Presentation mode
            </button>
          </div>
        </div>

        <section className="live-twin-layout">
          <DigitalTwinScene
            activeModeLabel={activeMode.label}
            metrics={digitalTwinMetrics}
            presentationMode={presentationMode}
            reading={stream.reading}
            scenario={scenario}
            scenarioMetrics={scenarioMetrics}
            sourceTag={sourceTag}
            thermalMap={thermalMap}
            xrayMode={xrayMode}
          />

          {!presentationMode && (
            <aside className="live-control-plane">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start xl:flex-col">
                <div>
                  <p className="eyebrow">Simulation control</p>
                  <h3 className="mt-3 text-3xl font-black leading-tight text-atrium-paper md:text-4xl">{activeMode.label}</h3>
                  <p className="body-copy mt-3 max-w-2xl text-sm">{activeMode.summary}</p>
                </div>
                <button
                  className="platform-button disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={stream.source === "serial" && stream.status === "unsupported"}
                  onClick={isRunButtonActive ? stream.stopDemoRun : stream.startDemoRun}
                >
                  {isRunButtonActive ? <Square size={16} /> : <PlayCircle size={18} />}
                  {stream.source === "serial" ? (isRunButtonActive ? "Disconnect serial" : "Connect serial") : isRunButtonActive ? "Stop demo run" : "Start demo run"}
                </button>
              </div>

              <div className="scenario-control-grid mt-7">
                <ScenarioControlGroup title="Time of day" options={timeOfDayOptions} value={scenario.timeOfDay} onChange={(value) => updateScenario("timeOfDay", value)} />
                <ScenarioControlGroup title="Solar intensity" options={levelOptions} value={scenario.solarIntensity} onChange={(value) => updateScenario("solarIntensity", value)} />
                <ScenarioControlGroup title="Occupancy load" options={levelOptions} value={scenario.occupancyLoad} onChange={(value) => updateScenario("occupancyLoad", value)} />
                <ScenarioControlGroup title="Ventilation mode" options={ventilationOptions} value={scenario.ventilationMode} onChange={(value) => updateScenario("ventilationMode", value)} />
                <ScenarioControlGroup title="Building type" options={buildingTypeOptions} value={scenario.buildingType} onChange={(value) => updateScenario("buildingType", value)} />
              </div>

              <div className="mt-7 grid gap-3">
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  {sensorSources.map((source) => (
                    <SourceButton
                      active={stream.source === source}
                      key={source}
                      label={sensorSourceLabels[source]}
                      onClick={() => stream.setSource(source)}
                      source={source}
                      unsupported={source === "serial" && !stream.serialSupported}
                    />
                  ))}
                </div>
                <div className="parametric-toggle grid grid-cols-2 gap-2 p-1">
                  {sensorModes.map((item) => (
                    <button
                      className={`parametric-toggle-button ${stream.mode === item ? "parametric-toggle-button-cool" : ""} disabled:cursor-not-allowed disabled:opacity-55`}
                      disabled={stream.source !== "simulated"}
                      key={item}
                      onClick={() => stream.setMode(item)}
                    >
                      {sensorModeMeta[item].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="live-status-panel mt-5">
                <p className="eyebrow">{stream.dataLabel}</p>
                <p className="body-copy mt-2 text-sm">{stream.statusMessage}</p>
                <p className="mt-3 text-sm text-atrium-cloud">
                  Last reading <strong className="text-atrium-paper">{formatSensorTime(stream.reading.timestamp)}</strong>
                </p>
                {stream.source === "csv" && <p className="text-sm text-atrium-cloud">{stream.csvRowCount} CSV rows loaded</p>}
              </div>
            </aside>
          )}
        </section>

        {!presentationMode && (
          <section className="live-analysis-grid">
            <div className="chart-shell live-trace-panel h-[360px] p-4">
              <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="eyebrow">Environmental trace</p>
                  <h3 className="mt-2 text-2xl font-black text-atrium-paper">Thermal response over the demo run</h3>
                </div>
                <span className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-atrium-cloud">
                  {formatSensorTime(stream.reading.timestamp)}
                </span>
              </div>
              <ResponsiveContainer height="78%" width="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(248,243,231,0.58)" tickLine={false} />
                  <YAxis stroke="rgba(248,243,231,0.58)" tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line dataKey="topTempC" dot={false} isAnimationActive={false} name="Top temp C" stroke="#B8C5D0" strokeWidth={3.2} />
                  <Line
                    dataKey="occupiedTempC"
                    dot={false}
                    isAnimationActive={false}
                    name="Occupied temp C"
                    stroke="#20F0D0"
                    strokeWidth={3.2}
                  />
                  <Line dataKey="airflowIndex" dot={false} isAnimationActive={false} name="Airflow index, m/s x50" stroke="#8F7CFF" strokeWidth={3.2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <SystemStatus mode={stream.reading.mode} serialSupported={stream.serialSupported} source={stream.source} statusMessage={stream.statusMessage} />
          </section>
        )}
      </div>
    </PageFrame>
  );
}

function DigitalTwinScene({
  reading,
  activeModeLabel,
  metrics,
  sourceTag,
  scenario,
  scenarioMetrics,
  xrayMode,
  thermalMap,
  presentationMode,
}: {
  reading: SensorReading;
  activeModeLabel: string;
  metrics: Array<{ label: string; value: string; icon: LucideIcon; status: string; tone: string }>;
  sourceTag: string;
  scenario: SimulationScenario;
  scenarioMetrics: ScenarioMetrics;
  xrayMode: boolean;
  thermalMap: boolean;
  presentationMode: boolean;
}) {
  const active = reading.mode === "breathe_atrium";
  const thermalDelta = Math.max(0, reading.topTempC - reading.occupiedTempC);
  const airflowScore = active ? Math.min(96, Math.round(scenarioMetrics.airflowVelocityMs * 82)) : Math.max(14, Math.round(reading.airflowMs * 95));
  const visibleMetrics = presentationMode ? metrics.slice(0, 5) : metrics;
  const scenarioLabel = `${buildingTypeOptions.find((item) => item.value === scenario.buildingType)?.label} / ${scenario.timeOfDay} / ${scenario.ventilationMode}`;

  return (
    <section className={`digital-twin-scene ${active ? "digital-twin-active" : "digital-twin-hot"} ${xrayMode ? "digital-twin-xray" : ""} ${thermalMap ? "digital-twin-thermal" : "digital-twin-thermal-off"} ${presentationMode ? "digital-twin-presentation" : ""}`}>
      <div className="digital-twin-camera" />
      <div className="digital-twin-light-sweep" />

      <div className="relative z-20 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Smart building digital twin</p>
          <h3 className="mt-3 max-w-3xl text-4xl font-black leading-[0.92] text-atrium-paper md:text-6xl">
            The atrium breathes in real time.
          </h3>
          <p className="body-copy mt-4 max-w-2xl">
            Floating telemetry is simulated unless labeled measured. The visual model shows airflow intent, thermal zones, and stack-effect behavior for pitch demonstration.
          </p>
        </div>
        <div className="twin-mode-orb">
          <span>{sourceTag}</span>
          <strong>{activeModeLabel}</strong>
          <em>{scenarioLabel}</em>
        </div>
      </div>

      <div className="digital-twin-stage">
        <svg className="digital-twin-svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 640" aria-label="Semi 3D atrium digital twin">
          <defs>
            <linearGradient id="twin-glass" x1="15%" x2="86%" y1="6%" y2="100%">
              <stop offset="0%" stopColor="#F8FBFF" stopOpacity="0.44" />
              <stop offset="46%" stopColor="#20F0D0" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#8F7CFF" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="twin-metal" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#EBF2F7" stopOpacity="0.86" />
              <stop offset="56%" stopColor="#B8C5D0" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#20F0D0" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="twin-flow" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#20F0D0" stopOpacity="0" />
              <stop offset="42%" stopColor="#6FF7FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#8F7CFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="twin-solar" x1="82%" x2="28%" y1="0%" y2="80%">
              <stop offset="0%" stopColor="#F8FBFF" stopOpacity="0.42" />
              <stop offset="50%" stopColor="#20F0D0" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#F8FBFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="twin-hot-zone" cx="52%" cy="40%" r="54%">
              <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.56" />
              <stop offset="58%" stopColor="#FF4FD8" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#FF4FD8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="twin-cool-zone" cx="48%" cy="54%" r="58%">
              <stop offset="0%" stopColor="#20F0D0" stopOpacity="0.46" />
              <stop offset="62%" stopColor="#20F0D0" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#20F0D0" stopOpacity="0" />
            </radialGradient>
            <filter id="twin-blur">
              <feGaussianBlur stdDeviation="20" />
            </filter>
          </defs>

          <rect width="1100" height="640" fill="transparent" />
          <path className="twin-solar-field" d="M746 -40 L1118 48 L754 462 L430 390 Z" fill="url(#twin-solar)" />
          <ellipse cx="552" cy="554" rx="428" ry="62" fill="#000000" opacity="0.42" />
          <ellipse className="twin-floor-glow" cx="552" cy="535" rx="360" ry="45" fill={active ? "#20F0D0" : "#FF8A3D"} opacity={active ? "0.14" : "0.08"} />

          <g className="twin-building">
            <path d="M180 520 C342 480 527 470 880 416 L946 457 C678 540 394 565 144 546 Z" fill="#080B14" stroke="url(#twin-metal)" strokeOpacity="0.52" strokeWidth="2" />
            <path d="M228 515 C255 391 311 244 367 150 C501 99 663 89 793 128 C846 243 887 356 913 459 C700 522 462 548 228 515 Z" fill="url(#twin-glass)" stroke="url(#twin-metal)" strokeWidth="2" />
            <path d="M304 497 C334 383 382 270 432 198 C536 166 650 158 744 181 C783 280 815 370 832 438 C662 491 492 512 304 497 Z" fill="url(#twin-glass)" opacity="0.52" stroke="#DCE8EF" strokeOpacity="0.28" />
            <path d="M367 150 C480 54 667 55 793 128 C732 162 542 181 432 198 C400 184 381 168 367 150 Z" fill="url(#twin-glass)" stroke="#EAF7FF" strokeOpacity="0.5" strokeWidth="2" />
            <g className="twin-fins">
              <path d="M414 188 C534 135 678 134 774 158" />
              <path d="M389 236 C528 188 699 190 811 222" />
              <path d="M360 289 C514 250 701 252 838 292" />
              <path d="M334 342 C492 310 714 313 864 358" />
            </g>
            <path className="twin-stack" d="M746 181 C808 194 858 236 879 300 C892 354 898 411 913 459 L832 438 C817 345 791 254 746 181 Z" fill="#20F0D0" opacity={active ? "0.2" : "0.08"} stroke="#9CFDFF" strokeOpacity={active ? "0.58" : "0.2"} strokeWidth="2" />
          </g>

          <g className="twin-thermal-zone">
            <ellipse cx="575" cy="404" rx="236" ry="78" fill={active ? "url(#twin-cool-zone)" : "url(#twin-hot-zone)"} />
            <ellipse cx="646" cy="270" rx="196" ry="116" fill={active ? "url(#twin-cool-zone)" : "url(#twin-hot-zone)"} opacity={active ? "0.42" : "0.78"} />
            <path className="twin-thermal-plume" d="M616 474 C650 396 700 338 782 238" stroke={active ? "#20F0D0" : "#FF8A3D"} strokeLinecap="round" strokeWidth="42" opacity={active ? "0.18" : "0.26"} />
          </g>

          <g className={active ? "twin-active-flow" : "twin-stagnant-flow"}>
            {active ? (
              <>
                <path className="twin-flow-line twin-flow-main" d="M102 500 C278 468 412 475 564 448 C700 424 779 347 812 216" stroke="url(#twin-flow)" strokeLinecap="round" strokeWidth="30" />
                <path className="twin-flow-line twin-flow-rise" d="M508 498 C620 502 724 450 783 350 C816 292 823 228 839 162" stroke="url(#twin-flow)" strokeLinecap="round" strokeWidth="20" />
                <path className="twin-exhaust-line" d="M836 154 C898 104 982 82 1054 66" stroke="#DCE8EF" strokeLinecap="round" strokeWidth="18" opacity="0.6" />
                {[0, 1, 2, 3, 4, 5, 6].map((item) => (
                  <circle className={`twin-air-particle twin-air-particle-${item + 1}`} fill="#C8FFFF" key={item} r={item % 2 ? 3.4 : 5}>
                    <animateMotion begin={`${item * -0.58}s`} dur={`${5.1 + item * 0.24}s`} path={item % 2 ? "M508 498 C620 502 724 450 783 350 C816 292 823 228 839 162" : "M102 500 C278 468 412 475 564 448 C700 424 779 347 812 216"} repeatCount="indefinite" />
                  </circle>
                ))}
              </>
            ) : (
              <>
                <path className="twin-heat-column" d="M518 238 C500 306 515 372 486 443" stroke="#FF8A3D" strokeLinecap="round" strokeWidth="23" />
                <path className="twin-heat-column twin-heat-column-delay" d="M650 220 C682 292 664 363 700 435" stroke="#FF4FD8" strokeLinecap="round" strokeWidth="19" />
                <path className="weak-flow" d="M104 505 C192 492 260 493 336 501" stroke="#20F0D0" strokeLinecap="round" strokeWidth="15" opacity="0.2" />
              </>
            )}
          </g>

          {xrayMode && (
            <g className="twin-xray-lines">
              <path d="M418 214 L250 128" />
              <path d="M826 330 L1010 248" />
              <path d="M188 504 L92 442" />
              <path d="M760 180 L932 138" />
              <path d="M544 154 L400 76" />
            </g>
          )}
        </svg>

        <div className="twin-hotspot twin-hotspot-inlet" aria-label="Low-level intake" title="Low-level intake" />
        <div className="twin-hotspot twin-hotspot-flue" aria-label="Stack flue ventilation" title="Stack flue ventilation" />
        <div className="twin-hotspot twin-hotspot-roof" aria-label="Solar heat interaction" title="Solar heat interaction" />
        {xrayMode && (
          <div className="twin-xray-labels">
            {[
              ["Double skin wall cavity", "left-[4%] top-[22%]"],
              ["Stack flue", "right-[2%] top-[38%]"],
              ["Cool air inlet path", "left-[3%] bottom-[21%]"],
              ["Hot air exhaust path", "right-[6%] top-[16%]"],
              ["Shading fins", "left-[30%] top-[7%]"],
            ].map(([label, className]) => (
              <span className={className} key={label}>
                {label}
              </span>
            ))}
          </div>
        )}
        <div className="twin-metric-field">
          {visibleMetrics.map((metric, index) => (
            <DigitalTwinMetricBubble index={index} key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      <div className="digital-twin-footer">
        <div>
          <span>Thermal stratification</span>
          <strong>{thermalDelta.toFixed(1)} C</strong>
        </div>
        <div>
          <span>Airflow score</span>
          <strong>{airflowScore}%</strong>
        </div>
        <div>
          <span>Cooling load</span>
          <strong>{scenarioMetrics.coolingLoadReductionPct}%</strong>
        </div>
      </div>
    </section>
  );
}

function DigitalTwinMetricBubble({
  label,
  value,
  icon: Icon,
  status,
  tone,
  index,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  status: string;
  tone: string;
  index: number;
}) {
  return (
    <article className={`twin-metric-bubble twin-metric-${index} metric-tone-${tone}`}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{status}</em>
    </article>
  );
}

function ScenarioControlGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="scenario-control-group">
      <span>{title}</span>
      <div>
        {options.map((option) => (
          <button
            className={option.value === value ? "scenario-option scenario-option-active" : "scenario-option"}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SourceButton({
  active,
  source,
  label,
  unsupported,
  onClick,
}: {
  active: boolean;
  source: SensorSource;
  label: string;
  unsupported: boolean;
  onClick: () => void;
}) {
  const Icon = getSourceIcon(source);

  return (
    <button
      className={`surface-card-hover rounded-lg p-4 text-left transition ${
        active ? "status-pill text-[#090616]" : "surface-card text-atrium-cloud hover:border-[#20f0d0]"
      }`}
      onClick={onClick}
    >
      <Icon size={20} />
      <span className="mt-3 block font-black">{label}</span>
      <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] opacity-75">
        {unsupported ? "unsupported here" : source === "simulated" ? "safe fallback" : source === "csv" ? "offline replay" : "optional"}
      </span>
    </button>
  );
}

function getSourceIcon(source: SensorSource) {
  const icons: Record<SensorSource, LucideIcon> = {
    simulated: Database,
    csv: FileText,
    serial: Usb,
  };

  return icons[source];
}

function SensorCard({ label, value, icon: Icon, status }: { label: string; value: string; icon: LucideIcon; status: string }) {
  return (
    <article className="metric-card rounded-lg p-4">
      <Icon className="text-[#d7ff3f]" size={22} />
      <p className="mt-4 min-h-10 text-sm text-atrium-cloud">{label}</p>
      <strong className="mt-2 block text-2xl font-black leading-tight text-atrium-paper">{value}</strong>
      <span className="mt-3 block text-[11px] font-black uppercase tracking-[0.16em] text-[#20f0d0]">{status}</span>
    </article>
  );
}

function SystemStatus({
  mode,
  source,
  serialSupported,
  statusMessage,
}: {
  mode: SensorMode;
  source: SensorSource;
  serialSupported: boolean;
  statusMessage: string;
}) {
  const active = mode === "breathe_atrium";

  return (
    <aside className="surface-card rounded-lg p-6">
      <p className="eyebrow">System flow</p>
      <h3 className="mt-3 text-2xl font-black text-atrium-paper">{active ? "Passive path active" : "Heat path constrained"}</h3>
      <div className="mt-6 grid gap-3">
        {[
          ["Low inlet", active],
          ["Cross-flow", active],
          ["Solar chimney", active],
          ["High outlet", active],
          ["BMS handoff", true],
        ].map(([label, isActive]) => (
          <div className="flex items-center justify-between rounded-lg border border-white/12 bg-white/[0.07] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]" key={String(label)}>
            <span className="text-atrium-cloud">{label}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-[#d7ff3f] shadow-[0_0_22px_rgba(215,255,63,0.6)]" : "bg-atrium-coral"}`} />
          </div>
        ))}
      </div>
      <div className="surface-card mt-6 rounded-lg p-4">
        <p className="eyebrow">{sensorSourceLabels[source]}</p>
        <p className="body-copy mt-2 text-sm">{statusMessage}</p>
      </div>
      <p className="body-copy mt-4 text-sm">
        Simulated and CSV playback modes are demo data. Hardware serial is optional
        {serialSupported ? " and available in this browser." : ", but this browser does not expose Web Serial."}
      </p>
    </aside>
  );
}

function DesignEnginePage() {
  const [inputs, setInputs] = useState<DesignInputs>({
    atriumHeightM: 24,
    floorAreaM2: 1200,
    roofGlazingPct: 72,
    occupancy: 280,
    discomfortSeverity: 4,
  });
  const recommendation = useMemo(() => recommendDesign(inputs), [inputs]);

  return (
    <PageFrame eyebrow="Design Engine" title="From atrium geometry to a first-pass passive retrofit concept.">
      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-card rounded-lg p-6">
          <h3 className="text-2xl font-black text-atrium-paper">Atrium inputs</h3>
          <div className="mt-6 grid gap-5">
            <Slider label="Atrium height" value={inputs.atriumHeightM} min={8} max={45} unit="m" onChange={(value) => setInputs({ ...inputs, atriumHeightM: value })} />
            <Slider label="Floor area" value={inputs.floorAreaM2} min={300} max={5000} step={50} unit="m2" onChange={(value) => setInputs({ ...inputs, floorAreaM2: value })} />
            <Slider label="Roof glazing level" value={inputs.roofGlazingPct} min={20} max={95} unit="%" onChange={(value) => setInputs({ ...inputs, roofGlazingPct: value })} />
            <Slider label="Peak occupancy" value={inputs.occupancy} min={40} max={1200} step={20} unit="people" onChange={(value) => setInputs({ ...inputs, occupancy: value })} />
            <Slider label="Current discomfort severity" value={inputs.discomfortSeverity} min={1} max={5} unit="/5" onChange={(value) => setInputs({ ...inputs, discomfortSeverity: value })} />
          </div>
        </div>

        <div className="surface-card rounded-lg p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <p className="eyebrow">Recommended package</p>
              <h3 className="mt-3 text-3xl font-black leading-tight text-atrium-paper">Passive-first design stack</h3>
            </div>
            <div className="status-pill rounded-lg px-4 py-3">
              <span className="block text-xs font-black uppercase tracking-wide">Heat risk</span>
              <strong className="text-3xl font-black">{recommendation.heatRisk}</strong>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <RecommendationCard icon={Wind} label="Low-level inlet" value={`${recommendation.inletAreaM2.toFixed(1)} m2 free area`} tag="concept output" />
            <RecommendationCard icon={ArrowRight} label="High-level outlet" value={`${recommendation.outletAreaM2.toFixed(1)} m2 free area`} tag="concept output" />
            <RecommendationCard icon={SunMedium} label="Solar chimney" value={`${recommendation.chimneyHeightM.toFixed(1)} m target path`} tag="concept output" />
            <RecommendationCard icon={RadioTower} label="Sensors" value={`${recommendation.sensorCount} nodes`} tag="pilot target" />
            <RecommendationCard
              icon={Droplets}
              label="Optional water wall"
              value={recommendation.waterWall ? "Evaluate in pilot" : "Keep optional"}
              tag="site dependent"
            />
            <RecommendationCard icon={CircuitBoard} label="BMS integration" value="Mixed-mode handoff" tag="required" />
          </div>
        </div>
      </section>

      <AtriumAirflowVisualizer className="min-h-[680px]" defaultMode="breathe" variant="pitch" />
    </PageFrame>
  );
}

function RoiPage() {
  return (
    <PageFrame eyebrow="ROI Calculator" title="A buyer conversation built around assumptions, not overclaims.">
      <RoiCalculatorPanel />
    </PageFrame>
  );
}

function PilotReportPage() {
  const phases = [
    { day: "Days 0-14", title: "Baseline", body: "Measure heat stratification, comfort hours, humidity, CO2, HVAC proxy, and occupant feedback." },
    { day: "Days 15-45", title: "Retrofit and tune", body: "Commission inlets, outlet path, solar chimney behavior, sensor nodes, and BMS handoff rules." },
    { day: "Days 46-90", title: "Operate and compare", body: "Compare matched weather windows and create the measured pilot evidence pack." },
  ];

  const kpis = [
    "Occupied-zone temperature profile",
    "Top-layer heat build-up",
    "Comfort hours",
    "Relative humidity excursions",
    "CO2 and ventilation proxy",
    "HVAC runtime proxy",
    "Occupant feedback",
    "Facilities team acceptance",
  ];

  return (
    <PageFrame eyebrow="Pilot Report" title="A 90-day path from concept to measured decision.">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-lg p-6">
          <div className="flex items-center gap-3">
            <TimerReset className="text-atrium-gold" />
            <h3 className="text-2xl font-black text-atrium-paper">90-day pilot structure</h3>
          </div>
          <div className="mt-6 grid gap-4">
            {phases.map((phase) => (
              <article className="rounded-lg border border-white/15 bg-white/10 p-5" key={phase.day}>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-atrium-gold">{phase.day}</span>
                <h4 className="mt-2 text-2xl font-black text-atrium-paper">{phase.title}</h4>
                <p className="mt-2 text-atrium-cloud">{phase.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass rounded-lg p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-atrium-gold">Measurement plan</p>
            <div className="mt-5 grid gap-2">
              {kpis.map((kpi) => (
                <div className="flex items-center gap-2 text-atrium-cloud" key={kpi}>
                  <CheckCircle2 className="shrink-0 text-atrium-mint" size={17} />
                  {kpi}
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-lg p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-atrium-gold">Decision gate</p>
            <h3 className="mt-3 text-3xl font-black text-atrium-paper">Scale only after measured proof.</h3>
            <p className="mt-3 text-atrium-cloud">
              Proceed when the pilot shows credible comfort improvement, manageable humidity risk, facilities acceptance,
              and a repeatable retrofit playbook.
            </p>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function PageFrame({
  eyebrow,
  title,
  children,
  badge = "SIMULATED DATA",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="page-stack grid">
      <header className="page-hero rounded-lg p-6 md:p-8 xl:p-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display-title mt-4 max-w-5xl text-4xl md:text-6xl">{title}</h2>
          </div>
          <div className="status-pill rounded-lg px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em]">
            {badge}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function InsightCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <article className="surface-card surface-card-hover rounded-lg p-6">
      <Icon className="text-[#d7ff3f]" size={26} />
      <h3 className="mt-4 text-2xl font-black leading-tight text-atrium-paper">{title}</h3>
      <p className="body-copy mt-3">{body}</p>
    </article>
  );
}

function RecommendationCard({ icon: Icon, label, value, tag }: { icon: LucideIcon; label: string; value: string; tag: string }) {
  return (
    <article className="surface-card surface-card-hover rounded-lg p-5">
      <Icon className="text-[#d7ff3f]" size={22} />
      <p className="mt-4 text-sm text-atrium-cloud">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-atrium-paper">{value}</strong>
      <span className="mt-3 block text-[11px] font-black uppercase tracking-[0.16em] text-[#20f0d0]">{tag}</span>
    </article>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const valueLabel = unit === "RM" ? `RM ${value.toLocaleString()}` : `${value.toLocaleString()} ${unit}`;

  return (
    <label className="grid gap-3 text-sm text-atrium-cloud">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <strong className="text-atrium-paper">{valueLabel}</strong>
      </span>
      <input
        className="range-input w-full"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function AirflowRibbons() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 1, 2, 3].map((item) => (
        <motion.div
          animate={{ x: ["-12%", "20%"], opacity: [0.06, 0.46, 0.08] }}
          className="airflow-ribbon absolute h-3 rounded-full blur-[0.2px]"
          key={item}
          style={{
            left: `${8 + item * 9}%`,
            top: `${55 + item * 8}%`,
            width: `${48 - item * 4}%`,
          }}
          transition={{ delay: item * -0.9, duration: 8.2 - item * 0.6, ease: "linear", repeat: Infinity }}
        />
      ))}
    </div>
  );
}

const tooltipStyle = {
  background: "rgba(8,6,18,0.94)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 8,
  color: "#F9F5EA",
  boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
  backdropFilter: "blur(18px)",
};
