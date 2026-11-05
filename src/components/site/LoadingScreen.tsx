import type { CSSProperties } from "react";

/**
 * The GetLaunch PH loading screen (same emblem and wordmark as getlaunchph.com).
 * It's part of the static HTML so it shows before any script runs; `Providers`
 * marks `html[data-splash="done"]` once the page is ready and the CSS fades it out.
 * Styles live in globals.css under "GetLaunch PH loading screen".
 */
const HEX =
  "M24 2.6 43 13.5c1.2.7 2 2 2 3.4v14.2c0 1.4-.8 2.7-2 3.4L24 45.4 5 34.5a4 4 0 0 1-2-3.4V16.9c0-1.4.8-2.7 2-3.4L24 2.6Z";
const BRANCHES = [
  ["lm-trunk", "M24 38.2V15.8"],
  ["lm-left", "M24 32.8h-9.5v-9.1"],
  ["lm-right", "M24 29.7h9.8v-7"],
] as const;
const NODES = [
  [24, 12.2],
  [14.5, 20.2],
  [33.8, 19.2],
] as const;
const WORD = "GetLaunch";

const letterIndex = (i: number) => ({ "--i": i }) as CSSProperties;

function Emblem() {
  return (
    <div className="loading-emblem" aria-hidden="true">
      <span className="lm-halo" />
      <span className="lm-shadow" />
      <span className="lm-orbit">
        <span className="lm-orbit-arc" />
      </span>
      <svg viewBox="0 0 48 48">
        <defs>
          <clipPath id="lm-hex-clip">
            <path d={HEX} />
          </clipPath>
          <linearGradient id="lm-sheen-gradient" x1="0" y1="0" x2="1" y2="0.35">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="lm-hex-fill" d={HEX} fill="currentColor" />
        <path className="lm-hex-line" d={HEX} pathLength={1} />
        <g className="lm-ink">
          {BRANCHES.map(([cls, d]) => (
            <path key={`line-${cls}`} className={`lm-line ${cls}`} d={d} pathLength={1} />
          ))}
          {BRANCHES.map(([cls, d]) => (
            <path key={`pulse-${cls}`} className={`lm-pulse ${cls}`} d={d} pathLength={1} />
          ))}
          {NODES.map(([cx, cy], i) => (
            <circle key={i} className={`lm-node lm-node-${i + 1}`} cx={cx} cy={cy} r={4.5} />
          ))}
          <rect className="lm-base" x={19.4} y={35.8} width={9.2} height={6.3} rx={1.9} />
        </g>
        <g clipPath="url(#lm-hex-clip)">
          <rect
            className="lm-sheen"
            x={0}
            y={0}
            width={14}
            height={48}
            fill="url(#lm-sheen-gradient)"
          />
        </g>
      </svg>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="gl-splash" role="status" aria-live="polite">
      <div className="loading-stage">
        <Emblem />
        <p className="loading-wordmark" aria-hidden="true">
          {[...WORD].map((ch, i) => (
            <span key={i} className="lm-letter" style={letterIndex(i)}>
              {ch}
            </span>
          ))}
          <span className="lm-letter lm-letter-accent" style={letterIndex(WORD.length + 1)}>
            PH
          </span>
        </p>
        <p className="loading-caption">Preparing your workspace</p>
        <span className="sr-only">Loading QR Studio by GetLaunch PH</span>
      </div>
    </div>
  );
}
