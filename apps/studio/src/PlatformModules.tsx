import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Layers3,
  MonitorPlay,
  QrCode,
  Search,
  type LucideIcon,
} from "lucide-react";

import businessModelDoc from "../../../docs/business/business-model.md?raw";
import goToMarketDoc from "../../../docs/business/go-to-market.md?raw";
import competitiveLandscapeDoc from "../../../docs/business/competitive-landscape.md?raw";
import scalingPotentialDoc from "../../../docs/business/scaling-potential.md?raw";

export type PlatformTabKey =
  | "visualizer"
  | "overview"
  | "live"
  | "design"
  | "roi"
  | "pilot";

type PlatformModuleKey = Extract<PlatformTabKey, "pilot">;

type NavigateFn = (tab: PlatformTabKey) => void;

export function PlatformModulePage({ tab }: { tab: PlatformModuleKey }) {
  if (tab === "pilot") return <PilotHubPage />;
  return null;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: NavigateFn;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const commands = useMemo(
    () => [
      commandItem("Open Visualizer", "Cinematic 3D explanation of the UM IP.", MonitorPlay, () => onNavigate("visualizer")),
      commandItem("Go to Overview", "Start the studio walkthrough.", Building2, () => onNavigate("overview")),
      commandItem("Open Live Demo", "Sensor stream, CSV playback, and hardware serial mode.", Gauge, () => onNavigate("live")),
      commandItem("Open Design Engine", "Generate the conceptual retrofit package.", Layers3, () => onNavigate("design")),
      commandItem("Open ROI", "Run commercial assumptions and payback ranges.", BarChart3, () => onNavigate("roi")),
      commandItem("Open Pilot Proposal", "Facility-manager pilot hub and proposal links.", ClipboardCheck, () => onNavigate("pilot")),
      commandItem("Open Demo Hub", "QR-friendly landing page.", QrCode, () => {
        window.location.href = "/demo-hub";
      }),
    ],
    [onNavigate],
  );

  const filtered = commands.filter((item) => {
    const haystack = `${item.label} ${item.body}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-[#05030b]/78 px-4 py-20 backdrop-blur-2xl md:place-items-center md:py-4">
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="surface-card w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <Search className="text-[#d7ff3f]" size={20} />
          <input
            autoFocus
            className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/35"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search BreatheAtrium Studio..."
            value={query}
          />
          <button className="rounded-md border border-white/15 px-2 py-1 text-xs font-bold text-white/60" onClick={onClose}>
            ESC
          </button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto p-2">
          {filtered.map((item) => (
            <button
              className="group grid w-full grid-cols-[42px_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/10"
              key={item.label}
              onClick={() => {
                item.run();
                onClose();
              }}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-[#20f0d0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] group-hover:bg-[#d7ff3f] group-hover:text-[#090616]">
                <item.icon size={19} />
              </span>
              <span>
                <span className="block font-black text-white">{item.label}</span>
                <span className="block text-sm text-white/55">{item.body}</span>
              </span>
              <ArrowRight className="text-white/30 group-hover:text-[#d7ff3f]" size={18} />
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-8 text-center font-semibold text-white/50">No command found.</p>}
        </div>
      </motion.div>
    </div>
  );
}

function PilotHubPage() {
  const phases = [
    ["Week 1-2", "Audit and baseline measurement"],
    ["Week 3-6", "Prototype or retrofit installation"],
    ["Week 7-10", "Monitored operation"],
    ["Week 11-12", "Verification report and scale decision"],
  ];

  return (
    <PlatformFrame
      kicker="Pilot hub"
      title="The facility-manager next step."
      subtitle="A concise commercialization path: audit the pain, instrument the site, pilot the retrofit, then decide with evidence."
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4">
          <AccentCard accent="#d7ff3f" icon={ClipboardCheck} title="90-day pilot proposal">
            <p className="text-white/70">
              The HTML/PDF proposal is packaged as a booth-ready artifact. It is intentionally executive, printable, and measurement-first.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="platform-button" href="/deliverables/breathe-atrium-90-day-pilot.html" target="_blank" rel="noreferrer">
                Open HTML
                <ExternalLink size={16} />
              </a>
              <a className="platform-button-secondary" href="/deliverables/breathe-atrium-90-day-pilot.pdf" target="_blank" rel="noreferrer">
                Open PDF
              </a>
            </div>
            <div className="mt-4 h-[520px] overflow-hidden rounded-lg border border-white/10 bg-white">
              <iframe
                className="h-full w-full"
                src="/deliverables/breathe-atrium-90-day-pilot.html"
                title="90-day BreatheAtrium pilot proposal"
              />
            </div>
          </AccentCard>
          <div className="grid gap-3 sm:grid-cols-2">
            {phases.map(([time, body], index) => (
              <div className="surface-card surface-card-hover rounded-lg p-4" key={time}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#20f0d0]">Phase {index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-white">{time}</h3>
                <p className="mt-2 text-sm font-semibold text-white/62">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <MarkdownPanel title="Business model" content={businessModelDoc} />
          <MarkdownPanel title="Go-to-market" content={goToMarketDoc} />
          <MarkdownPanel title="Competitive landscape" content={competitiveLandscapeDoc} />
          <MarkdownPanel title="Scaling potential" content={scalingPotentialDoc} />
        </div>
      </div>
    </PlatformFrame>
  );
}

function PlatformFrame({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="page-stack grid pb-8"
      initial={false}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className="platform-hero relative overflow-hidden rounded-lg p-5 md:p-7 xl:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(36deg,transparent_0_42%,rgba(215,255,63,0.1)_58%,transparent_76%),linear-gradient(145deg,rgba(32,240,208,0.07),transparent_45%)]" />
        <div className="relative z-10">
          <p className="eyebrow">{kicker}</p>
          <h1 className="display-title mt-4 max-w-5xl text-5xl md:text-7xl">{title}</h1>
          <p className="body-copy mt-5 max-w-4xl text-lg">{subtitle}</p>
        </div>
      </section>
      {children}
    </motion.div>
  );
}

function MarkdownPanel({ title, content, tall = false }: { title: string; content: string; tall?: boolean }) {
  return (
    <section className={`surface-card rounded-lg p-5 ${tall ? "" : ""}`}>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <div className={`mt-4 overflow-auto pr-1 ${tall ? "max-h-[980px]" : "max-h-[620px]"}`}>
        <MarkdownView content={content} />
      </div>
    </section>
  );
}

function AccentCard({
  accent,
  icon: Icon,
  title,
  children,
}: {
  accent: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card surface-card-hover rounded-lg p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-lg text-[#090616]" style={{ backgroundColor: accent }}>
          <Icon size={22} />
        </span>
        <h2 className="text-2xl font-black text-white">{title}</h2>
      </div>
      <div className="relative z-10 mt-4">{children}</div>
    </section>
  );
}

function MarkdownView({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return <div className="space-y-4 text-sm leading-6 text-white/70">{blocks}</div>;
}

function parseMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre className="overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-5 text-white/70" key={`code-${i}`}>
          {code.join("\n")}
        </pre>,
      );
      continue;
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^#+/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#{1,3}\s/, "");
      const className =
        level === 1
          ? "text-3xl font-black leading-tight text-white"
          : level === 2
            ? "text-2xl font-black leading-tight text-white"
            : "text-xl font-black leading-tight text-white";
      blocks.push(
        <h3 className={className} key={`heading-${i}`}>
          {renderInline(text)}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|") && lines[i + 1]?.trim().includes("---")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      blocks.push(<MarkdownTable lines={tableLines} key={`table-${i}`} />);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul className="space-y-2" key={`ul-${i}`}>
          {items.map((item) => (
            <li className="flex gap-2 font-semibold text-white/68" key={item}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d7ff3f]" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol className="list-decimal space-y-2 pl-5 font-semibold text-white/68" key={`ol-${i}`}>
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("```") &&
      !(lines[i].trim().startsWith("|") && lines[i + 1]?.trim().includes("---"))
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p className="font-semibold text-white/66" key={`p-${i}`}>
        {renderInline(paragraph.join(" "))}
      </p>,
    );
  }

  return blocks;
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((line) => !line.includes("---"))
    .map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean),
    );
  const [head, ...body] = rows;

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead className="bg-white/10 text-white">
          <tr>
            {head?.map((cell) => (
              <th className="border-b border-white/10 px-3 py-3 font-black uppercase tracking-[0.12em]" key={cell}>
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row) => (
            <tr className="border-b border-white/10 last:border-b-0" key={row.join("-")}>
              {row.map((cell) => (
                <td className="px-3 py-3 align-top font-semibold text-white/66" key={cell}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong className="font-black text-white" key={`${segment}-${index}`}>
          {segment.slice(2, -2)}
        </strong>
      );
    }
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.88em] font-black text-[#d7ff3f]" key={`${segment}-${index}`}>
          {segment.slice(1, -1)}
        </code>
      );
    }
    const link = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a className="font-black text-[#20f0d0] underline decoration-white/20 underline-offset-4" href={link[2]} key={`${segment}-${index}`}>
          {link[1]}
        </a>
      );
    }
    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function commandItem(label: string, body: string, icon: LucideIcon, run: () => void) {
  return { label, body, icon, run };
}
