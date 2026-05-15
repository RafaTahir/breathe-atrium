import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, Download, Flame, Layers3, Maximize2, Moon, Snowflake, SunMedium } from "lucide-react";
import type { AtriumAirflowMode } from "./AtriumAirflowVisualizer";
import { WebGLAtriumVisualizer, type AtriumEnvironmentMode } from "./WebGLAtriumVisualizer";

const exportCss = `
  .render-solar-beam { opacity: .74; }
  .render-solar-core { filter: drop-shadow(0 0 28px rgba(232,242,247,.42)); }
  .floor-reflection { opacity: .14; }
  .render-floor-grid, .render-spines path, .render-shading-fins path { fill: none; stroke-linecap: round; }
  .render-floor-grid { stroke: rgba(184,251,255,.13); stroke-width: 1.2; }
  .render-spines path { stroke: rgba(232,242,247,.28); stroke-width: 1.35; }
  .render-shading-fins path { stroke: rgba(232,242,247,.52); stroke-width: 1.7; }
  .render-front-skin { filter: drop-shadow(0 28px 56px rgba(0,0,0,.28)) drop-shadow(0 0 20px rgba(184,251,255,.08)); }
  .render-stack-flue { filter: drop-shadow(0 0 20px rgba(32,240,208,.18)); }
  .thermal-volume { mix-blend-mode: screen; }
  .flow-ribbon { stroke-dasharray: 42 44; opacity: .92; filter: drop-shadow(0 0 18px rgba(32,240,208,.34)); }
  .heat-exhaust-ribbon { filter: drop-shadow(0 0 16px rgba(255,184,107,.26)); }
  .direction-arrow { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 4; stroke-dasharray: 18 24; opacity: .95; }
  .direction-arrow-cool { stroke: rgba(184,251,255,.92); filter: drop-shadow(0 0 15px rgba(32,240,208,.72)); }
  .direction-arrow-heat { stroke: rgba(255,215,154,.95); filter: drop-shadow(0 0 15px rgba(255,184,107,.48)); }
  .direction-arrow-red { stroke: rgba(255,138,61,.96); filter: drop-shadow(0 0 15px rgba(255,90,61,.52)); }
  .flow-arrowheads path { fill: #b8fbff; opacity: .9; filter: drop-shadow(0 0 15px rgba(32,240,208,.72)); }
  .flow-arrowheads .flow-arrowhead-hot { fill: #ffd79a; filter: drop-shadow(0 0 15px rgba(255,184,107,.58)); }
  .flow-particle, .exhaust-particle, .heat-particle, .stack-particle { opacity: .86; filter: drop-shadow(0 0 11px currentColor); }
  .heat-fall { stroke-dasharray: 36 42; filter: drop-shadow(0 0 16px rgba(255,138,61,.34)); }
  .weak-flow { opacity: .22; }
  .render-callout-lines { display: none; }
`;

const modeNarratives = {
  dead: {
    kicker: "Conventional heat trap",
    title: "Glass traps heat without a release path.",
    body: "Heat collects below the glazed roof. Air movement weakens. Mechanical cooling has to fight the same volume again and again.",
    stepsTitle: "What is happening",
    steps: [
      "Sun loads the glass roof",
      "Heat pools at the top",
      "Air becomes stagnant",
      "HVAC carries the burden",
    ],
  },
  breathe: {
    kicker: "Solar-assisted natural ventilation",
    title: "The sun becomes the exhaust engine.",
    body: "Cool air enters low. Heat rises through the solar chimney. The atrium begins to breathe before HVAC carries the full burden.",
    stepsTitle: "How it works",
    steps: [
      "Sun heats the chimney",
      "Hot air rises",
      "Heat exhausts at the top",
      "Cooler air crosses the occupied zone",
    ],
  },
} satisfies Record<AtriumAirflowMode, { kicker: string; title: string; body: string; stepsTitle: string; steps: string[] }>;

export function AtriumVisualizerPage({ embedded = false }: { embedded?: boolean }) {
  const [mode, setMode] = useState<AtriumAirflowMode>(() => getInitialVisualizerMode());
  const [environment, setEnvironment] = useState<AtriumEnvironmentMode>("day");
  const [explainMode, setExplainMode] = useState(false);
  const [presentationLock, setPresentationLock] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportMessage, setExportMessage] = useState("Ready for pitch capture");
  const pageRef = useRef<HTMLElement | null>(null);
  const captureRef = useRef<HTMLElement | null>(null);
  const pendingExport = useRef<AtriumAirflowMode | null>(null);

  const requestPageFullscreen = useCallback(async () => {
    const element = pageRef.current;
    if (!element || document.fullscreenElement || !element.requestFullscreen) {
      return;
    }

    try {
      await element.requestFullscreen();
    } catch {
      // Fullscreen can be blocked by browser policy; presentation lock still works without it.
    }
  }, []);

  const exitPageFullscreen = useCallback(async () => {
    if (!document.fullscreenElement || !document.exitFullscreen) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore browser-level fullscreen exit failures.
    }
  }, []);

  const activatePresentationLock = useCallback(() => {
    setPresentationLock(true);
    void requestPageFullscreen();
  }, [requestPageFullscreen]);

  const exitPresentationLock = useCallback(() => {
    setPresentationLock(false);
    void exitPageFullscreen();
  }, [exitPageFullscreen]);

  const togglePresentationLock = useCallback(() => {
    if (presentationLock) {
      exitPresentationLock();
      return;
    }

    activatePresentationLock();
  }, [activatePresentationLock, exitPresentationLock, presentationLock]);

  useEffect(() => {
    if (pendingExport.current !== mode) return;

    const timer = window.setTimeout(() => {
      downloadScenePng(mode);
      pendingExport.current = null;
    }, 160);

    return () => window.clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isEditable) {
        return;
      }

      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        togglePresentationLock();
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        setExplainMode((value) => !value);
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setEnvironment((value) => (value === "day" ? "night" : "day"));
      }

      if (event.key === "Escape" && presentationLock) {
        setPresentationLock(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presentationLock, togglePresentationLock]);

  function requestExport(targetMode: AtriumAirflowMode) {
    setExportMessage(`Preparing ${targetMode === "breathe" ? "Breathe Mode" : "Heat Trap"} screenshot...`);

    if (targetMode === mode) {
      window.setTimeout(() => downloadScenePng(targetMode), 80);
      return;
    }

    pendingExport.current = targetMode;
    setMode(targetMode);
  }

  function downloadScenePng(targetMode: AtriumAirflowMode) {
    const webglCanvas = captureRef.current?.querySelector<HTMLCanvasElement>("canvas[data-atrium-webgl-scene='true']");
    if (webglCanvas && webglCanvas.width > 0 && webglCanvas.height > 0) {
      downloadWebGLScenePng(webglCanvas, targetMode, setExportMessage);
      return;
    }

    const sceneSvg = captureRef.current?.querySelector<SVGSVGElement>("svg[data-atrium-scene='true']");
    if (!sceneSvg) {
      setExportMessage("Scene not ready yet. Try again.");
      return;
    }

    const svgText = buildExportSvg(sceneSvg, targetMode);
    const image = new Image();
    const svgUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 900;
      const context = canvas.getContext("2d");

      if (!context) {
        setExportMessage("Canvas export is unavailable in this browser.");
        URL.revokeObjectURL(svgUrl);
        return;
      }

      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(svgUrl);

        if (!blob) {
          setExportMessage("Screenshot export failed. Try browser screenshot instead.");
          return;
        }

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `breatheatrium-${targetMode === "breathe" ? "breathe-mode" : "heat-trap"}-visualizer.png`;
        link.click();
        URL.revokeObjectURL(url);
        setExportMessage(`${targetMode === "breathe" ? "Breathe Mode" : "Heat Trap"} screenshot exported.`);
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      setExportMessage("Screenshot export failed. Use browser capture as fallback.");
    };

    image.src = svgUrl;
  }

  const isBreathe = mode === "breathe";
  const isNight = environment === "night";
  const narrative = modeNarratives[mode];
  const Shell = embedded ? "section" : "main";

  return (
    <Shell
      className={`atrium-explainer-page ${embedded ? "atrium-explainer-embedded" : ""} ${
        isBreathe ? "atrium-explainer-breathe" : "atrium-explainer-heat"
      } ${
        isNight ? "atrium-env-night" : "atrium-env-day"
      } ${explainMode ? "atrium-explain-mode" : ""} ${presentationLock ? "atrium-presentation-lock" : ""}`}
      ref={pageRef}
    >
      <div className="atrium-explainer-orb atrium-explainer-orb-one" />
      <div className="atrium-explainer-orb atrium-explainer-orb-two" />

      {presentationLock && (
        <>
          <div className="atrium-presentation-mode-toggle" aria-label="Presentation visualizer mode">
            <button className={!isBreathe ? "active" : ""} onClick={() => setMode("dead")} type="button">
              <Flame size={15} />
              Heat Trap
            </button>
            <button className={isBreathe ? "active" : ""} onClick={() => setMode("breathe")} type="button">
              <Snowflake size={15} />
              Breathe Mode
            </button>
          </div>
          <button className="atrium-presentation-exit" onClick={exitPresentationLock}>
            Exit presentation
            <span>P</span>
          </button>
        </>
      )}

      <header className="atrium-explainer-topbar" aria-label="BreatheAtrium visualizer controls">
        <a className="atrium-explainer-brand" href="/#visualizer">
          <span>BA</span>
          <div>
            <strong>BreatheAtrium</strong>
            <em>UM IP visual explainer</em>
          </div>
        </a>

        <div className="atrium-explainer-top-actions">
          <div className="atrium-explainer-toggle atrium-explainer-mode-toggle" aria-label="Visualizer mode">
            <button className={!isBreathe ? "active" : ""} onClick={() => setMode("dead")}>
              <Flame size={15} />
              Heat Trap
            </button>
            <button className={isBreathe ? "active" : ""} onClick={() => setMode("breathe")}>
              <Snowflake size={15} />
              Breathe Mode
            </button>
          </div>

          <div className="atrium-explainer-toggle atrium-explainer-env-toggle" aria-label="Environmental mode">
            <button className={!isNight ? "active" : ""} onClick={() => setEnvironment("day")}>
              <SunMedium size={15} />
              Day
            </button>
            <button className={isNight ? "active" : ""} onClick={() => setEnvironment("night")}>
              <Moon size={15} />
              Night
            </button>
          </div>

          <button
            className={`atrium-explainer-link atrium-explainer-action-button ${explainMode ? "active" : ""}`}
            onClick={() => setExplainMode((value) => !value)}
            type="button"
          >
            <Layers3 size={16} />
            Explain
          </button>

          <button
            className={`atrium-explainer-link atrium-explainer-action-button ${presentationLock ? "active" : ""}`}
            onClick={togglePresentationLock}
            type="button"
          >
            <Maximize2 size={16} />
            {isFullscreen || presentationLock ? "Presenting" : "Present"}
          </button>

          <a className="atrium-explainer-link" href="/#overview">
            Open Deep Dive
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <section className="atrium-explainer-shell" ref={captureRef}>
        <div className="atrium-explainer-copy">
          <p>{narrative.kicker}</p>
          <h1 key={`title-${mode}`}>{narrative.title}</h1>
          <span key={`body-${mode}`}>{narrative.body}</span>
          <em className="atrium-explainer-state-line">
            {isNight
              ? "Night mode: softer lighting, lower chimney drive, passive airflow remains."
              : "Day mode: sunlight activates the chimney and strengthens upward exhaust."}
          </em>
        </div>

        <div className="atrium-explainer-visual">
          <WebGLAtriumVisualizer
            environment={environment}
            explainMode={explainMode}
            mode={mode}
            presentationLock={presentationLock}
          />
        </div>

        <aside className="atrium-explainer-steps" aria-label="How the UM IP works">
          <div className="atrium-explainer-step-kicker">
            <SunMedium size={18} />
            {narrative.stepsTitle}
          </div>
          <ol key={`steps-${mode}`}>
            {narrative.steps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>

          <div className="atrium-explainer-export">
            <p>Pitch-deck screenshots</p>
            <div>
              <button onClick={() => requestExport("dead")}>
                <Camera size={15} />
                Heat Trap
              </button>
              <button onClick={() => requestExport("breathe")}>
                <Download size={15} />
                Breathe Mode
              </button>
            </div>
            <em>{exportMessage}</em>
          </div>

          <div className="atrium-explainer-bottom atrium-explainer-bottom-aside">
            <span>One visual.</span>
            <span>One pilot.</span>
            <span>Measured results.</span>
          </div>
        </aside>
      </section>
    </Shell>
  );
}

function buildExportSvg(sceneSvg: SVGSVGElement, mode: AtriumAirflowMode) {
  const clone = sceneSvg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.setAttribute("width", "1060");
  clone.setAttribute("height", "672");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const sceneMarkup = clone.innerHTML;
  const isBreathe = mode === "breathe";
  const title = isBreathe ? "Breathe Mode" : "Heat Trap";
  const headline = isBreathe ? "The sun pulls heat out." : "Glass traps heat overhead.";
  const accent = isBreathe ? "#20F0D0" : "#F2B84B";
  const secondary = isBreathe ? "#B8FBFF" : "#FFD79A";
  const steps = modeNarratives[mode].steps;
  const stepsTitle = modeNarratives[mode].stepsTitle.toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <style>${exportCss}</style>
  <defs>
    <radialGradient id="exportGlow" cx="76%" cy="18%" r="58%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".18"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="exportBg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#040610"/>
      <stop offset="56%" stop-color="#08131A"/>
      <stop offset="100%" stop-color="#020308"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#exportBg)"/>
  <rect width="1600" height="900" fill="url(#exportGlow)"/>
  <text x="74" y="88" fill="#20F0D0" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="900" letter-spacing="5">BREATHEATRIUM</text>
  <text x="74" y="144" fill="#F9F5EA" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="950">${title}</text>
  <text x="74" y="194" fill="#D8E1DF" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700">${headline}</text>
  <svg x="64" y="222" width="1060" height="672" viewBox="0 0 1200 760">${sceneMarkup}</svg>
  <g transform="translate(1185 250)">
    <text x="0" y="0" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" letter-spacing="4">${escapeSvg(stepsTitle)}</text>
    ${steps
      .map(
        (step, index) => `
    <circle cx="20" cy="${64 + index * 92}" r="19" fill="${accent}" fill-opacity=".16" stroke="${secondary}" stroke-opacity=".55"/>
    <text x="14" y="${71 + index * 92}" fill="${secondary}" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900">${index + 1}</text>
    <text x="58" y="${71 + index * 92}" fill="#F9F5EA" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="850">${escapeSvg(step)}</text>`
      )
      .join("")}
  </g>
  <text x="1185" y="800" fill="#F9F5EA" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="950">One visual. One pilot.</text>
  <text x="1185" y="842" fill="#D8E1DF" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="760">Measured results.</text>
</svg>`;
}

function downloadWebGLScenePng(
  sourceCanvas: HTMLCanvasElement,
  mode: AtriumAirflowMode,
  setExportMessage: (message: string) => void
) {
  const isBreathe = mode === "breathe";
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 1600;
  outputCanvas.height = 900;
  const context = outputCanvas.getContext("2d");

  if (!context) {
    setExportMessage("Canvas export is unavailable in this browser.");
    return;
  }

  const accent = isBreathe ? "#20F0D0" : "#F2B84B";
  const headline = isBreathe ? "The sun pulls heat out." : "Glass traps heat overhead.";
  const title = isBreathe ? "Breathe Mode" : "Heat Trap";
  const steps = modeNarratives[mode].steps;
  const stepsTitle = modeNarratives[mode].stepsTitle.toUpperCase();
  const gradient = context.createLinearGradient(0, 0, 1600, 900);
  gradient.addColorStop(0, "#040610");
  gradient.addColorStop(0.56, "#08131A");
  gradient.addColorStop(1, "#020308");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1600, 900);

  const glow = context.createRadialGradient(1210, 150, 10, 1210, 150, 720);
  glow.addColorStop(0, hexToRgba(accent, 0.2));
  glow.addColorStop(1, hexToRgba(accent, 0));
  context.fillStyle = glow;
  context.fillRect(0, 0, 1600, 900);

  context.fillStyle = "#20F0D0";
  context.font = "900 21px Inter, Arial, sans-serif";
  context.letterSpacing = "5px";
  context.fillText("BREATHEATRIUM", 74, 88);
  context.letterSpacing = "0px";
  context.fillStyle = "#F9F5EA";
  context.font = "900 64px Inter, Arial, sans-serif";
  context.fillText(title, 74, 144);
  context.fillStyle = "#D8E1DF";
  context.font = "700 26px Inter, Arial, sans-serif";
  context.fillText(headline, 74, 194);

  drawContainedImage(context, sourceCanvas, 64, 222, 1060, 640);

  context.fillStyle = accent;
  context.font = "900 18px Inter, Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText(stepsTitle, 1185, 250);
  context.letterSpacing = "0px";

  steps.forEach((step, index) => {
    const y = 314 + index * 92;
    context.strokeStyle = hexToRgba(accent, 0.55);
    context.fillStyle = hexToRgba(accent, 0.16);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(1205, y, 19, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = isBreathe ? "#B8FBFF" : "#FFD79A";
    context.font = "900 17px Inter, Arial, sans-serif";
    context.fillText(String(index + 1), index === 0 ? 1199 : 1198, y + 6);
    context.fillStyle = "#F9F5EA";
    context.font = "850 25px Inter, Arial, sans-serif";
    drawWrappedCanvasText(context, step, 1243, y + 7, 300, 30);
  });

  context.fillStyle = "#F9F5EA";
  context.font = "950 30px Inter, Arial, sans-serif";
  context.fillText("One visual. One pilot.", 1185, 800);
  context.fillStyle = "#D8E1DF";
  context.font = "760 26px Inter, Arial, sans-serif";
  context.fillText("Measured results.", 1185, 842);

  outputCanvas.toBlob((blob) => {
    if (!blob) {
      setExportMessage("Screenshot export failed. Try browser capture instead.");
      return;
    }

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `breatheatrium-${isBreathe ? "breathe-mode" : "heat-trap"}-3d-visualizer.png`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`${isBreathe ? "Breathe Mode" : "Heat Trap"} 3D screenshot exported.`);
  }, "image/png");
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const sourceWidth = image instanceof HTMLCanvasElement ? image.width : width;
  const sourceHeight = image instanceof HTMLCanvasElement ? image.height : height;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const targetWidth = sourceWidth * scale;
  const targetHeight = sourceHeight * scale;
  context.drawImage(image, x + (width - targetWidth) / 2, y + (height - targetHeight) / 2, targetWidth, targetHeight);
}

function drawWrappedCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
      return;
    }

    line = testLine;
  });

  if (line) {
    context.fillText(line, x, lineY);
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function escapeSvg(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getInitialVisualizerMode(): AtriumAirflowMode {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "heat" ? "dead" : "breathe";
}
