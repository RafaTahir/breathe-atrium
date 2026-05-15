import { useId, useState } from "react";
import { ArrowUpRight, Flame, Snowflake, SunMedium } from "lucide-react";

export type AtriumAirflowMode = "dead" | "breathe";

type AtriumAirflowVisualizerProps = {
  className?: string;
  defaultMode?: AtriumAirflowMode;
  mode?: AtriumAirflowMode;
  onModeChange?: (mode: AtriumAirflowMode) => void;
  surface?: "card" | "bare";
  variant?: "dashboard" | "pitch";
  chrome?: "full" | "scene";
};

const coolIntakePath = "M104 570 C220 548 324 526 438 506 C560 484 642 438 705 358";
const occupiedFlowPath = "M176 538 C320 518 460 516 602 478 C704 450 776 400 826 330";
const stackFlowPath = "M710 505 C748 438 765 366 770 288 C775 215 804 154 862 104";
const exhaustPath = "M806 166 C878 126 962 96 1084 82";
const deadHeatPath = "M454 250 C436 318 440 396 402 478";
const deadHeatPathTwo = "M642 236 C680 312 684 388 708 492";
const deadPocketPath = "M262 535 C348 518 432 518 508 534";

const callouts = [
  { text: "Low-level intake", className: "left-[5%] bottom-[18%]", line: "M168 560 L246 536" },
  { text: "Occupied comfort zone", className: "left-[36%] bottom-[18%]", line: "M470 560 L528 510" },
  { text: "Double skin cavity", className: "left-[9%] top-[34%]", line: "M220 315 L335 270" },
  { text: "Shading fins", className: "left-[36%] top-[18%]", line: "M500 172 L568 196" },
  { text: "Solar-heated stack flue", className: "right-[6%] top-[31%]", line: "M972 302 L830 286" },
  { text: "High-level exhaust", className: "right-[12%] top-[14%]", line: "M1022 122 L900 156" },
];

export function AtriumAirflowVisualizer({
  className = "",
  defaultMode = "breathe",
  mode: controlledMode,
  onModeChange,
  surface = "card",
  variant = "dashboard",
  chrome = "full",
}: AtriumAirflowVisualizerProps) {
  const [internalMode, setInternalMode] = useState<AtriumAirflowMode>(defaultMode);
  const uid = useId().replace(/:/g, "");
  const mode = controlledMode ?? internalMode;
  const isBreathe = mode === "breathe";
  const showChrome = chrome === "full";
  const shellClass =
    surface === "card"
      ? "surface-card atrium-visualizer parametric-atrium w-full max-w-full min-w-0 p-5 md:p-6"
      : "atrium-visualizer parametric-atrium w-full max-w-full min-w-0 overflow-hidden border border-white/10 bg-[#05030b]/20 p-0";
  const minHeightClass = variant === "pitch" ? "min-h-[760px]" : "min-h-[620px]";
  const titleClass = variant === "pitch" ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl";

  function updateMode(nextMode: AtriumAirflowMode) {
    if (controlledMode === undefined) {
      setInternalMode(nextMode);
    }
    onModeChange?.(nextMode);
  }

  const ids = {
    glass: `${uid}-glass`,
    glassDeep: `${uid}-glass-deep`,
    roof: `${uid}-roof`,
    cyanFlow: `${uid}-cyan-flow`,
    cyanCore: `${uid}-cyan-core`,
    heatFlow: `${uid}-heat-flow`,
    solarBeam: `${uid}-solar-beam`,
    coolThermal: `${uid}-cool-thermal`,
    hotThermal: `${uid}-hot-thermal`,
    silverEdge: `${uid}-silver-edge`,
    flueGlow: `${uid}-flue-glow`,
    arrowCyan: `${uid}-arrow-cyan`,
    arrowHeat: `${uid}-arrow-heat`,
    arrowRed: `${uid}-arrow-red`,
    glow: `${uid}-glow`,
    softBlur: `${uid}-soft-blur`,
    glassNoise: `${uid}-glass-noise`,
    maskShell: `${uid}-mask-shell`,
  };

  return (
    <section className={`${shellClass} ${className}`}>
      {showChrome && (
        <div className="parametric-atrium-header">
          <div className="min-w-0">
            <p className="eyebrow">Breathing atrium visualization</p>
            <h3 className={`atrium-visualizer-title mt-2 max-w-5xl break-words font-black leading-[0.95] text-atrium-paper ${titleClass}`}>
              {isBreathe ? "A glass atrium becomes a quiet ventilation machine." : "A sealed glass volume turns sunlight into trapped heat."}
            </h3>
            <p className="body-copy mt-4 max-w-3xl text-base">
              Follow the arrows: cool air enters low, crosses the occupied zone, rises through the solar-heated flue, then exits above the roofline.
            </p>
          </div>

          <div className="atrium-mode-toggle parametric-toggle grid w-full max-w-full grid-cols-2 gap-2 p-1 sm:max-w-[460px]">
            <button
              className={`parametric-toggle-button ${!isBreathe ? "parametric-toggle-button-hot" : ""}`}
              onClick={() => updateMode("dead")}
            >
              <Flame size={16} />
              <span className="truncate">Conventional</span>
            </button>
            <button
              className={`parametric-toggle-button ${isBreathe ? "parametric-toggle-button-cool" : ""}`}
              onClick={() => updateMode("breathe")}
            >
              <Snowflake size={16} />
              <span className="truncate">BreatheAtrium</span>
            </button>
          </div>
        </div>
      )}

      <div className={`atrium-visualizer-canvas parametric-atrium-canvas relative min-w-0 overflow-hidden ${showChrome ? "mt-6" : ""} ${minHeightClass}`}>
        <div className="parametric-scene-orbit" />
        <div className="parametric-scene-haze" />
        <div className="atrium-render-sun absolute right-[8%] top-[9%] z-20">
          <SunMedium size={18} />
          <span>Solar drive</span>
        </div>

        <svg
          aria-label={`${isBreathe ? "BreatheAtrium Mode" : "Conventional Atrium"} premium 3D-style airflow model`}
          className="parametric-atrium-svg absolute inset-0 h-full w-full"
          data-atrium-scene="true"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 1200 760"
        >
          <defs>
            <linearGradient id={ids.glass} x1="16%" x2="86%" y1="4%" y2="100%">
              <stop offset="0%" stopColor="#F7FAFF" stopOpacity="0.56" />
              <stop offset="34%" stopColor="#8EF6FF" stopOpacity="0.19" />
              <stop offset="72%" stopColor="#7888FF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#111827" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id={ids.glassDeep} x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#DCE8EF" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#20F0D0" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#0B1020" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id={ids.roof} x1="28%" x2="88%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#F6FAFF" stopOpacity="0.62" />
              <stop offset="44%" stopColor="#B8FBFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8F7CFF" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id={ids.silverEdge} x1="0%" x2="100%">
              <stop offset="0%" stopColor="#F4F8FF" stopOpacity="0.86" />
              <stop offset="48%" stopColor="#20F0D0" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#B8C5D0" stopOpacity="0.62" />
            </linearGradient>
            <linearGradient id={ids.cyanFlow} x1="0%" x2="100%">
              <stop offset="0%" stopColor="#20F0D0" stopOpacity="0" />
              <stop offset="34%" stopColor="#6FF7FF" stopOpacity="0.92" />
              <stop offset="72%" stopColor="#20F0D0" stopOpacity="0.66" />
              <stop offset="100%" stopColor="#20F0D0" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={ids.cyanCore} x1="0%" x2="100%">
              <stop offset="0%" stopColor="#EAFDFF" stopOpacity="0.2" />
              <stop offset="55%" stopColor="#EAFDFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#20F0D0" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id={ids.heatFlow} x1="0%" x2="100%">
              <stop offset="0%" stopColor="#FFB86B" stopOpacity="0" />
              <stop offset="42%" stopColor="#FFD79A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF6A3D" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id={ids.solarBeam} x1="84%" x2="36%" y1="0%" y2="75%">
              <stop offset="0%" stopColor="#F8EFCB" stopOpacity="0.5" />
              <stop offset="52%" stopColor="#B8F7FF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#F8EFCB" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={ids.coolThermal} cx="48%" cy="55%" r="58%">
              <stop offset="0%" stopColor="#20F0D0" stopOpacity="0.52" />
              <stop offset="58%" stopColor="#20F0D0" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#20F0D0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={ids.hotThermal} cx="49%" cy="35%" r="62%">
              <stop offset="0%" stopColor="#FFB86B" stopOpacity="0.64" />
              <stop offset="46%" stopColor="#FF6A3D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6A3D" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={ids.flueGlow} cx="52%" cy="50%" r="58%">
              <stop offset="0%" stopColor="#20F0D0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#20F0D0" stopOpacity="0" />
            </radialGradient>
            <filter id={ids.glow} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feColorMatrix
                in="blur"
                result="glow"
                type="matrix"
                values="0 0 0 0 0.12 0 0 0 0 0.94 0 0 0 0 0.82 0 0 0 0.62 0"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={ids.softBlur}>
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <filter id={ids.glassNoise}>
              <feTurbulence baseFrequency="0.012 0.022" numOctaves="2" seed="7" type="fractalNoise" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA slope="0.08" type="linear" />
              </feComponentTransfer>
            </filter>
            <marker id={ids.arrowCyan} markerHeight="14" markerWidth="18" orient="auto" refX="16" refY="7" viewBox="0 0 18 14">
              <path d="M1 1 L17 7 L1 13 L5.2 7 Z" fill="#B8FBFF" />
            </marker>
            <marker id={ids.arrowHeat} markerHeight="14" markerWidth="18" orient="auto" refX="16" refY="7" viewBox="0 0 18 14">
              <path d="M1 1 L17 7 L1 13 L5.2 7 Z" fill="#FFD79A" />
            </marker>
            <marker id={ids.arrowRed} markerHeight="14" markerWidth="18" orient="auto" refX="16" refY="7" viewBox="0 0 18 14">
              <path d="M1 1 L17 7 L1 13 L5.2 7 Z" fill="#FF8A3D" />
            </marker>
            <mask id={ids.maskShell}>
              <rect width="1200" height="760" fill="black" />
              <path
                d="M190 590 C220 440 274 294 354 174 C486 118 646 106 792 150 C862 286 906 414 930 540 C694 612 438 628 190 590 Z"
                fill="white"
              />
            </mask>
          </defs>

          <rect width="1200" height="760" fill="rgba(2,3,8,0.2)" />
          <path className="render-solar-beam" d="M770 -24 L1145 52 L825 468 L478 392 Z" fill={`url(#${ids.solarBeam})`} />
          <circle className="render-solar-core" cx="1018" cy="94" r="52" fill="#F7FAFF" opacity="0.88" />
          <circle cx="1018" cy="94" r="116" fill="#20F0D0" filter={`url(#${ids.softBlur})`} opacity="0.16" />

          <g className="render-floor">
            <ellipse cx="585" cy="660" rx="475" ry="76" fill="#000000" opacity="0.46" />
            <ellipse className="floor-reflection" cx="590" cy="636" rx="414" ry="58" fill={isBreathe ? "#20F0D0" : "#FF8A3D"} opacity={isBreathe ? "0.15" : "0.09"} />
            <path d="M130 620 C304 562 534 552 1018 508 L1092 558 C790 650 424 682 114 648 Z" fill="#050813" opacity="0.78" />
            <path d="M130 620 C304 562 534 552 1018 508 L1092 558 C790 650 424 682 114 648 Z" fill="none" stroke={`url(#${ids.silverEdge})`} strokeOpacity="0.5" strokeWidth="2" />
            <path className="render-floor-grid" d="M206 616 C420 595 662 568 1010 526" />
            <path className="render-floor-grid" d="M270 648 C476 610 694 578 1050 540" />
            <path className="render-floor-grid" d="M278 581 C338 604 392 626 442 654" />
            <path className="render-floor-grid" d="M520 558 C574 584 642 610 706 634" />
            <path className="render-floor-grid" d="M748 538 C810 562 884 586 962 606" />
          </g>

          <g className="atrium-architecture render-architecture">
            <path
              className="render-back-skin"
              d="M268 574 C296 430 344 296 414 204 C520 158 668 142 792 164 C852 292 890 414 916 536 C710 590 492 612 268 574 Z"
              fill={`url(#${ids.glassDeep})`}
              stroke="#DCE8EF"
              strokeOpacity="0.2"
              strokeWidth="1.4"
            />
            <path
              className="atrium-outer-skin render-front-skin"
              d="M190 590 C220 440 274 294 354 174 C486 118 646 106 792 150 C862 286 906 414 930 540 C694 612 438 628 190 590 Z"
              fill={`url(#${ids.glass})`}
              stroke={`url(#${ids.silverEdge})`}
              strokeWidth="2.5"
            />
            <path
              className="atrium-roof render-roof"
              d="M354 174 C470 70 664 64 792 150 C738 178 534 198 414 204 C386 196 366 188 354 174 Z"
              fill={`url(#${ids.roof})`}
              stroke="#F4F8FF"
              strokeOpacity="0.54"
              strokeWidth="2"
            />
            <path
              className="render-side-skin"
              d="M792 150 C864 276 912 414 930 540 L916 536 C890 414 852 292 792 164 Z"
              fill="#20F0D0"
              opacity={isBreathe ? "0.16" : "0.07"}
              stroke="#B8FBFF"
              strokeOpacity={isBreathe ? "0.44" : "0.2"}
              strokeWidth="1.7"
            />
            <path
              className="render-double-skin"
              d="M228 574 C256 432 312 304 382 198 C394 202 405 204 414 204 C344 296 296 430 268 574 C254 574 242 574 228 574 Z"
              fill="#B8FBFF"
              opacity={isBreathe ? "0.14" : "0.06"}
            />
            <path
              className="stack-flue render-stack-flue"
              d="M774 160 C846 194 894 256 908 342 C920 418 922 488 930 540 L836 528 C824 428 812 298 774 160 Z"
              fill="#20F0D0"
              opacity={isBreathe ? "0.2" : "0.08"}
              stroke="#9CFDFF"
              strokeOpacity={isBreathe ? "0.64" : "0.22"}
              strokeWidth="2"
            />
            <ellipse cx="854" cy="336" rx="70" ry="192" fill={`url(#${ids.flueGlow})`} opacity={isBreathe ? "0.64" : "0.18"} />
            <g className="render-spines">
              <path d="M472 184 C438 308 402 454 366 594" />
              <path d="M606 158 C604 300 610 454 628 584" />
              <path d="M738 176 C770 304 802 430 836 528" />
              <path d="M274 358 C452 316 668 300 882 342" />
              <path d="M242 462 C430 430 690 410 916 452" />
            </g>
            <g className="shading-fins render-shading-fins" opacity="0.82">
              <path d="M406 196 C506 142 664 132 772 158" />
              <path d="M382 246 C498 206 668 202 810 232" />
              <path d="M352 302 C500 268 704 268 844 308" />
              <path d="M322 362 C490 336 718 336 870 378" />
            </g>
            <g className="render-inlet">
              <path d="M138 570 C168 550 210 544 250 548 L240 594 C194 598 154 590 128 576 Z" fill="#20F0D0" opacity={isBreathe ? "0.28" : "0.08"} />
              <path d="M138 570 C168 550 210 544 250 548" fill="none" stroke="#B8FBFF" strokeOpacity={isBreathe ? "0.8" : "0.22"} strokeWidth="2" />
            </g>
            <g className="render-water-wall">
              <path d="M300 470 C332 460 360 458 388 462 L370 548 C340 550 310 548 282 540 Z" fill="#20F0D0" opacity={isBreathe ? "0.16" : "0.05"} />
              <path d="M316 480 C342 476 360 476 380 480" stroke="#B8FBFF" strokeOpacity="0.36" strokeWidth="1.5" />
              <path d="M306 504 C332 500 354 500 374 504" stroke="#B8FBFF" strokeOpacity="0.28" strokeWidth="1.5" />
            </g>
            <rect width="1200" height="760" filter={`url(#${ids.glassNoise})`} mask={`url(#${ids.maskShell})`} opacity="0.9" />
          </g>

          <g className={isBreathe ? "thermal-volume thermal-volume-cool" : "thermal-volume thermal-volume-hot"} mask={`url(#${ids.maskShell})`}>
            <ellipse cx="548" cy="505" rx="280" ry="92" fill={`url(#${isBreathe ? ids.coolThermal : ids.hotThermal})`} opacity={isBreathe ? "0.82" : "0.26"} />
            <ellipse cx="650" cy="322" rx="248" ry="146" fill={`url(#${isBreathe ? ids.coolThermal : ids.hotThermal})`} opacity={isBreathe ? "0.36" : "0.94"} />
            <ellipse cx="794" cy="252" rx="132" ry="178" fill={`url(#${ids.hotThermal})`} opacity={isBreathe ? "0.34" : "0.8"} />
          </g>

          {isBreathe ? (
            <g className="breathing-simulation">
              <path className="flow-ribbon flow-ribbon-wide" d={coolIntakePath} stroke={`url(#${ids.cyanFlow})`} strokeLinecap="round" strokeWidth="34" />
              <path className="flow-ribbon flow-ribbon-primary" d={occupiedFlowPath} stroke={`url(#${ids.cyanFlow})`} strokeLinecap="round" strokeWidth="27" />
              <path className="flow-ribbon flow-ribbon-secondary" d={stackFlowPath} stroke={`url(#${ids.cyanFlow})`} strokeLinecap="round" strokeWidth="24" />
              <path className="flow-ribbon heat-exhaust-ribbon" d={exhaustPath} stroke={`url(#${ids.heatFlow})`} strokeLinecap="round" strokeWidth="23" />
              <path className="direction-arrow direction-arrow-cool" d={coolIntakePath} markerEnd={`url(#${ids.arrowCyan})`} />
              <path className="direction-arrow direction-arrow-cool direction-arrow-delay" d={occupiedFlowPath} markerEnd={`url(#${ids.arrowCyan})`} />
              <path className="direction-arrow direction-arrow-cool" d={stackFlowPath} markerEnd={`url(#${ids.arrowCyan})`} />
              <path className="direction-arrow direction-arrow-heat" d={exhaustPath} markerEnd={`url(#${ids.arrowHeat})`} />
              <g className="flow-arrowheads">
                <path d="M312 522 l28 -13 l-9 28 z" />
                <path d="M624 438 l26 -20 l-2 32 z" />
                <path d="M766 288 l18 -28 l10 31 z" />
                <path className="flow-arrowhead-hot" d="M956 108 l32 -6 l-20 25 z" />
              </g>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                <circle className={`flow-particle flow-particle-${item + 1}`} fill="#B8FBFF" key={item} r={item % 3 === 0 ? 5.5 : 3.8}>
                  <animateMotion begin={`${item * -0.72}s`} dur={`${5.4 + item * 0.18}s`} path={item % 2 === 0 ? coolIntakePath : occupiedFlowPath} repeatCount="indefinite" />
                </circle>
              ))}
              {[0, 1, 2, 3].map((item) => (
                <circle className={`stack-particle stack-particle-${item + 1}`} fill="#D7FF3F" key={item} r="4.5">
                  <animateMotion begin={`${item * -0.82}s`} dur="4.9s" path={stackFlowPath} repeatCount="indefinite" />
                </circle>
              ))}
              {[0, 1, 2].map((item) => (
                <circle className={`exhaust-particle exhaust-particle-${item + 1}`} fill="#FFD79A" key={item} r="4.5">
                  <animateMotion begin={`${item * -0.9}s`} dur="4.2s" path={exhaustPath} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          ) : (
            <g className="stagnant-simulation">
              <path className="heat-fall" d={deadHeatPath} stroke={`url(#${ids.heatFlow})`} strokeLinecap="round" strokeWidth="24" />
              <path className="heat-fall heat-fall-delay" d={deadHeatPathTwo} stroke={`url(#${ids.heatFlow})`} strokeLinecap="round" strokeWidth="22" />
              <path className="weak-flow" d={deadPocketPath} stroke="#20F0D0" strokeLinecap="round" strokeWidth="20" opacity="0.2" />
              <path className="direction-arrow direction-arrow-red" d={deadHeatPath} markerEnd={`url(#${ids.arrowRed})`} />
              <path className="direction-arrow direction-arrow-red direction-arrow-delay" d={deadHeatPathTwo} markerEnd={`url(#${ids.arrowRed})`} />
              {[0, 1, 2, 3, 4].map((item) => (
                <circle className={`heat-particle heat-particle-${item + 1}`} fill="#FFB86B" key={item} r="5">
                  <animateMotion begin={`${item * -0.76}s`} dur="4.8s" path={item % 2 === 0 ? deadHeatPath : deadHeatPathTwo} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}

          <g className="render-callout-lines">
            {callouts.map((label) => (
              <path d={label.line} key={label.text} />
            ))}
          </g>
        </svg>

        <div className="absolute inset-0 z-10">
          {callouts.map((label) => (
            <div className={`parametric-callout absolute hidden sm:block ${label.className}`} key={label.text}>
              {label.text}
            </div>
          ))}
        </div>

        <div className="parametric-scene-caption">
          <ArrowUpRight size={16} className={isBreathe ? "text-[#20f0d0]" : "text-[#ff8a3d]"} />
          {isBreathe ? "Directional airflow arrows show intake, cross-flow, stack lift, and high-level exhaust." : "Heat arrows fall back into the occupied volume while airflow remains weak."}
        </div>
      </div>

      {showChrome && (
        <div className="parametric-atrium-legend mt-4 grid gap-2 sm:grid-cols-3">
          {callouts.map((label) => (
            <span className="parametric-legend-pill" key={label.text}>
              {label.text}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
