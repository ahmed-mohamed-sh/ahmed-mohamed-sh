#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/hero");
const cropFilter = "crop=1180:1450:1100:1500,format=gray,eq=contrast=1.65:brightness=-0.05";

const profileRows = [
  ["Subject", "Wildan Syukri Niam"],
  ["Role", "AI Researcher & Web3 Builder"],
  ["Affiliation", "Telkom University / Bandung, Indonesia"],
  ["Research", "AI Agents & Trustworthy Autonomous Systems"],
  ["Focus", "Web3 Trust / On-chain Intelligence"],
  ["Building", "PayGate / Fradium / NovaAI / Quorum"],
  ["Status", "Researching / Building / Shipping"]
];

const palettes = {
  dark: {
    backgroundStart: "#050816",
    backgroundEnd: "#130A2C",
    panel: "#0B1120",
    panelOpacity: "0.58",
    primary: "#E5E7EB",
    muted: "#64748B",
    cyan: "#22D3EE",
    blue: "#38BDF8",
    violet: "#7C3AED",
    green: "#10B981",
    red: "#F87171",
    scanBlend: "screen"
  },
  light: {
    backgroundStart: "#EEF6FF",
    backgroundEnd: "#F5F3FF",
    panel: "#FFFFFF",
    panelOpacity: "0.72",
    primary: "#172554",
    muted: "#64748B",
    cyan: "#0891B2",
    blue: "#2563EB",
    violet: "#6D28D9",
    green: "#059669",
    red: "#DC2626",
    scanBlend: "multiply"
  }
};

function getSourcePath() {
  const sourceIndex = process.argv.indexOf("--source");
  if (sourceIndex === -1 || !process.argv[sourceIndex + 1]) {
    throw new Error("Usage: node scripts/generate-agent-hero.mjs --source /absolute/path/to/portrait.jpg");
  }

  return resolve(process.argv[sourceIndex + 1]);
}

function readToken(buffer, offset) {
  let index = offset;

  while (index < buffer.length) {
    const value = buffer[index];
    if (value === 35) {
      while (index < buffer.length && buffer[index] !== 10) index += 1;
    } else if (value === 9 || value === 10 || value === 13 || value === 32) {
      index += 1;
    } else {
      break;
    }
  }

  const start = index;
  while (index < buffer.length && ![9, 10, 13, 32].includes(buffer[index])) index += 1;

  return { value: buffer.subarray(start, index).toString("ascii"), offset: index };
}

function parsePgm(buffer) {
  const magic = readToken(buffer, 0);
  const width = readToken(buffer, magic.offset);
  const height = readToken(buffer, width.offset);
  const maxValue = readToken(buffer, height.offset);

  if (magic.value !== "P5" || Number(maxValue.value) !== 255) {
    throw new Error("Expected an 8-bit binary PGM image from ffmpeg.");
  }

  let pixelOffset = maxValue.offset;
  while (pixelOffset < buffer.length && [9, 10, 13, 32].includes(buffer[pixelOffset])) pixelOffset += 1;

  const pixelCount = Number(width.value) * Number(height.value);
  const pixels = buffer.subarray(pixelOffset, pixelOffset + pixelCount);

  if (pixels.length !== pixelCount) {
    throw new Error("PGM image data was incomplete.");
  }

  return { width: Number(width.value), height: Number(height.value), pixels };
}

async function samplePortrait(sourcePath, columns, rows) {
  const { stdout } = await execFileAsync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", sourcePath,
      "-vf", `${cropFilter},scale=${columns}:${rows}`,
      "-frames:v", "1",
      "-f", "image2pipe",
      "-vcodec", "pgm",
      "pipe:1"
    ],
    { encoding: "buffer", maxBuffer: 4 * 1024 * 1024 }
  );

  return parsePgm(stdout);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function createAsciiTspans({ pixels, width, height }, x, y, lineHeight) {
  const characters = " .,:;irsXA253hMHGS#9B&@";
  const rows = [];

  for (let row = 0; row < height; row += 1) {
    let line = "";

    for (let column = 0; column < width; column += 1) {
      const pixel = pixels[row * width + column];
      const normalizedX = column / Math.max(width - 1, 1);
      const normalizedY = row / Math.max(height - 1, 1);
      const subjectFocus = Math.exp(
        -1.85 * (
          ((normalizedX - 0.53) ** 2) / 0.28 +
          ((normalizedY - 0.60) ** 2) / 0.34
        )
      );
      const darkness = (255 - pixel) / 255;
      const ink = clamp(darkness * 1.18 + subjectFocus * 0.16 - 0.11, 0, 1);
      const characterIndex = Math.round(ink * (characters.length - 1));
      line += subjectFocus < 0.18 && ink < 0.32 ? " " : characters[characterIndex];
    }

    rows.push(`<tspan x="${x}" y="${(y + row * lineHeight).toFixed(2)}" xml:space="preserve">${escapeXml(line)}</tspan>`);
  }

  return rows.join("\n");
}

function buildSystemRows({ x, y, width, rowHeight, fontSize, colors }) {
  const clips = [];
  const rows = [];

  profileRows.forEach(([label, value], index) => {
    const id = `system-row-${index}`;
    const start = (0.72 + index * 0.17).toFixed(2);
    const rowY = y + index * rowHeight;
    const dots = ".".repeat(Math.max(3, 14 - label.length));

    clips.push(
      `<clipPath id="${id}"><rect x="${x - 4}" y="${rowY - fontSize}" width="0" height="${fontSize + 12}"><animate attributeName="width" from="0" to="${width}" dur="0.42s" begin="${start}s" fill="freeze"/></rect></clipPath>`
    );

  rows.push(
    `<g clip-path="url(#${id})"><text x="${x}" y="${rowY}" class="system-row"><tspan class="system-label" fill="${colors.cyan}">${escapeXml(label)}</tspan><tspan class="system-dots" fill="${colors.muted}">${escapeXml(dots)} </tspan><tspan class="system-value" fill="${colors.primary}">${escapeXml(value)}</tspan></text></g>`
  );
  });

  return { clips: clips.join("\n"), rows: rows.join("\n") };
}

function createDesktopSvg(mode, portrait) {
  const colors = palettes[mode];
  const system = buildSystemRows({ x: 584, y: 182, width: 540, rowHeight: 47, fontSize: 14, colors });
  const ascii = createAsciiTspans(portrait, 68, 178, 4.65);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650" viewBox="0 0 1200 650" role="img" aria-labelledby="title description">
<title id="title">Wildan Syukri Niam - AI Researcher and Web3 Builder</title>
<desc id="description">An animated agent intelligence console with an ASCII portrait and research profile.</desc>
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colors.backgroundStart}"/>
    <stop offset="1" stop-color="${colors.backgroundEnd}"/>
  </linearGradient>
  <linearGradient id="signal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colors.cyan}"><animate attributeName="stop-color" values="${colors.cyan};${colors.violet};${colors.blue};${colors.cyan}" dur="10s" repeatCount="indefinite"/></stop>
    <stop offset="1" stop-color="${colors.violet}"><animate attributeName="stop-color" values="${colors.violet};${colors.blue};${colors.cyan};${colors.violet}" dur="10s" repeatCount="indefinite"/></stop>
  </linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${colors.violet}"/>
    <stop offset="0.48" stop-color="${colors.cyan}"/>
    <stop offset="1" stop-color="${colors.green}"/>
  </linearGradient>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${colors.cyan}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="${colors.cyan}" stop-opacity="0.04"/>
    <stop offset="0.5" stop-color="${colors.cyan}" stop-opacity="0.52"/>
    <stop offset="0.55" stop-color="${colors.cyan}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${colors.violet}" stop-opacity="0"/>
  </linearGradient>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${colors.cyan}" opacity="0.055"/></pattern>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="portrait-clip"><rect x="52" y="142" width="438" height="432" rx="14"/></clipPath>
  <mask id="portrait-reveal"><rect x="52" y="142" width="438" height="0" rx="14" fill="white"><animate attributeName="height" from="0" to="432" dur="2.35s" begin="0.15s" fill="freeze"/></rect></mask>
  ${system.clips}
  <style>
    .terminal { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .ascii { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 7.6px; letter-spacing: -0.22px; fill: url(#signal); }
    .panel-title { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; letter-spacing: 2px; fill: ${colors.blue}; opacity: 0.82; }
    .terminal-label { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; letter-spacing: 0.6px; fill: ${colors.muted}; }
    .system-row { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; }
    .system-label { fill: ${colors.cyan}; font-weight: 700; }
    .system-dots { fill: ${colors.muted}; }
    .system-value { fill: ${colors.primary}; }
    .footer-label { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; letter-spacing: 1.7px; fill: ${colors.muted}; }
  </style>
</defs>
<rect width="1200" height="650" rx="24" fill="url(#background)"/>
<rect width="1200" height="650" rx="24" fill="url(#scanlines)"/>
<rect x="20" y="20" width="1160" height="44" rx="14" fill="${colors.panel}" fill-opacity="0.78" stroke="url(#border)" stroke-opacity="0.35"/>
<circle cx="44" cy="42" r="5" fill="#EF4444"><animate attributeName="opacity" values="1;0.55;1" dur="4s" repeatCount="indefinite"/></circle>
<circle cx="62" cy="42" r="5" fill="#F59E0B"><animate attributeName="opacity" values="1;0.55;1" dur="4s" begin="0.25s" repeatCount="indefinite"/></circle>
<circle cx="80" cy="42" r="5" fill="${colors.green}"><animate attributeName="opacity" values="1;0.55;1" dur="4s" begin="0.5s" repeatCount="indefinite"/></circle>
<text x="600" y="47" text-anchor="middle" class="terminal-label">wildan@agentlab:~$ ./profile --live</text>
<circle cx="1040" cy="42" r="4" fill="${colors.red}"><animate attributeName="opacity" values="1;0.16;1" dur="1.35s" repeatCount="indefinite"/></circle>
<text x="1053" y="46" class="terminal-label" fill="${colors.red}">SIGNAL: LIVE</text>
<rect x="36" y="112" width="480" height="482" rx="16" fill="${colors.panel}" fill-opacity="${colors.panelOpacity}" stroke="url(#border)" stroke-opacity="0.42"/>
<rect x="540" y="86" width="624" height="508" rx="16" fill="${colors.panel}" fill-opacity="${colors.panelOpacity}" stroke="url(#border)" stroke-opacity="0.42"/>
<text x="54" y="133" class="panel-title">AGENT.MESH</text>
<text x="560" y="108" class="panel-title">SYSTEM.INTEL</text>
<g opacity="0.28" fill="none" stroke="${colors.blue}" stroke-width="1.2">
  <path d="M90 244 L168 194 L260 236 L350 188 L438 248"/>
  <path d="M110 432 L206 360 L312 404 L420 338 L470 414"/>
  <path d="M132 288 L276 318 L408 266"/>
</g>
<g fill="${colors.cyan}" filter="url(#glow)">
  <circle cx="90" cy="244" r="3"><animate attributeName="opacity" values="0.25;1;0.25" dur="3.6s" repeatCount="indefinite"/></circle>
  <circle cx="260" cy="236" r="3"><animate attributeName="opacity" values="0.25;1;0.25" dur="3.6s" begin="0.8s" repeatCount="indefinite"/></circle>
  <circle cx="438" cy="248" r="3"><animate attributeName="opacity" values="0.25;1;0.25" dur="3.6s" begin="1.6s" repeatCount="indefinite"/></circle>
  <circle cx="206" cy="360" r="3"><animate attributeName="opacity" values="0.25;1;0.25" dur="3.6s" begin="2.2s" repeatCount="indefinite"/></circle>
  <circle cx="420" cy="338" r="3"><animate attributeName="opacity" values="0.25;1;0.25" dur="3.6s" begin="2.8s" repeatCount="indefinite"/></circle>
</g>
<g clip-path="url(#portrait-clip)" mask="url(#portrait-reveal)"><text class="ascii" fill="${colors.cyan}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="7.6px" letter-spacing="-0.22px">${ascii}</text></g>
<text x="584" y="138" class="terminal" font-size="20" font-weight="700" fill="${colors.violet}">wildan@agents</text>
<text x="584" y="154" class="terminal-label">research profile / autonomous systems index</text>
${system.rows}
<rect x="584" y="528" width="10" height="18" fill="${colors.cyan}" opacity="0"><animate attributeName="opacity" values="0;0;1;0;1;0;1;0" keyTimes="0;0.04;0.08;0.34;0.52;0.7;0.86;1" dur="1.5s" begin="3.7s" repeatCount="indefinite"/></rect>
<line x1="52" y1="612" x2="1148" y2="612" stroke="url(#border)" stroke-opacity="0.38"/>
<text x="600" y="635" text-anchor="middle" class="footer-label">AI AGENTS / WEB3 TRUST / AUTONOMOUS SOFTWARE</text>
<rect x="0" y="-80" width="1200" height="86" fill="url(#scan)" opacity="0.84" style="mix-blend-mode:${colors.scanBlend}"><animateTransform attributeName="transform" type="translate" from="0 -80" to="0 730" dur="5.6s" repeatCount="indefinite"/></rect>
<rect x="3" y="3" width="1194" height="644" rx="21" fill="none" stroke="url(#border)" stroke-width="2" opacity="0.68"><animate attributeName="opacity" values="0.42;0.9;0.42" dur="4s" repeatCount="indefinite"/></rect>
</svg>`;
}

function createMobileSvg(mode, portrait) {
  const colors = palettes[mode];
  const system = buildSystemRows({ x: 72, y: 518, width: 574, rowHeight: 47, fontSize: 14, colors });
  const ascii = createAsciiTspans(portrait, 70, 130, 4.35);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="920" viewBox="0 0 720 920" role="img" aria-labelledby="title description">
<title id="title">Wildan Syukri Niam - AI Researcher and Web3 Builder</title>
<desc id="description">A compact animated agent intelligence console with an ASCII portrait and research profile.</desc>
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.backgroundStart}"/><stop offset="1" stop-color="${colors.backgroundEnd}"/></linearGradient>
  <linearGradient id="signal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.cyan}"><animate attributeName="stop-color" values="${colors.cyan};${colors.violet};${colors.blue};${colors.cyan}" dur="10s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="${colors.violet}"><animate attributeName="stop-color" values="${colors.violet};${colors.blue};${colors.cyan};${colors.violet}" dur="10s" repeatCount="indefinite"/></stop></linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.violet}"/><stop offset="0.48" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.green}"/></linearGradient>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colors.cyan}" stop-opacity="0"/><stop offset="0.5" stop-color="${colors.cyan}" stop-opacity="0.42"/><stop offset="1" stop-color="${colors.violet}" stop-opacity="0"/></linearGradient>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${colors.cyan}" opacity="0.05"/></pattern>
  <clipPath id="portrait-clip"><rect x="48" y="122" width="624" height="322" rx="16"/></clipPath>
  <mask id="portrait-reveal"><rect x="48" y="122" width="624" height="0" rx="16" fill="white"><animate attributeName="height" from="0" to="322" dur="2.2s" begin="0.15s" fill="freeze"/></rect></mask>
  ${system.clips}
  <style>
    .terminal { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .ascii { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 8.4px; letter-spacing: -0.2px; fill: url(#signal); }
    .panel-title { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; letter-spacing: 1.7px; fill: ${colors.blue}; opacity: 0.82; }
    .terminal-label { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; fill: ${colors.muted}; }
    .system-row { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; }
    .system-label { fill: ${colors.cyan}; font-weight: 700; }
    .system-dots { fill: ${colors.muted}; }
    .system-value { fill: ${colors.primary}; }
  </style>
</defs>
<rect width="720" height="920" rx="24" fill="url(#background)"/>
<rect width="720" height="920" rx="24" fill="url(#scanlines)"/>
<rect x="20" y="20" width="680" height="42" rx="14" fill="${colors.panel}" fill-opacity="0.78" stroke="url(#border)" stroke-opacity="0.35"/>
<circle cx="42" cy="41" r="5" fill="#EF4444"/><circle cx="60" cy="41" r="5" fill="#F59E0B"/><circle cx="78" cy="41" r="5" fill="${colors.green}"/>
<text x="360" y="46" text-anchor="middle" class="terminal-label">wildan@agentlab:~$ ./profile --live</text>
<rect x="48" y="96" width="624" height="356" rx="16" fill="${colors.panel}" fill-opacity="${colors.panelOpacity}" stroke="url(#border)" stroke-opacity="0.42"/>
<text x="64" y="116" class="panel-title">AGENT.MESH / PORTRAIT.SIGNAL</text>
<g opacity="0.24" fill="none" stroke="${colors.blue}" stroke-width="1.2"><path d="M94 222 L208 168 L358 242 L502 176 L626 236"/><path d="M122 370 L262 312 L404 374 L578 304"/></g>
<g fill="${colors.cyan}"><circle cx="94" cy="222" r="3"><animate attributeName="opacity" values="0.3;1;0.3" dur="3.6s" repeatCount="indefinite"/></circle><circle cx="358" cy="242" r="3"><animate attributeName="opacity" values="0.3;1;0.3" dur="3.6s" begin="1.1s" repeatCount="indefinite"/></circle><circle cx="626" cy="236" r="3"><animate attributeName="opacity" values="0.3;1;0.3" dur="3.6s" begin="2.2s" repeatCount="indefinite"/></circle></g>
<g clip-path="url(#portrait-clip)" mask="url(#portrait-reveal)"><text class="ascii" fill="${colors.cyan}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="8.4px" letter-spacing="-0.2px">${ascii}</text></g>
<rect x="48" y="474" width="624" height="372" rx="16" fill="${colors.panel}" fill-opacity="${colors.panelOpacity}" stroke="url(#border)" stroke-opacity="0.42"/>
<text x="66" y="496" class="panel-title">SYSTEM.INTEL</text>
${system.rows}
<text x="360" y="884" text-anchor="middle" class="terminal" font-size="11" letter-spacing="1.3" fill="${colors.muted}">AI AGENTS / WEB3 TRUST / AUTONOMOUS SOFTWARE</text>
<rect x="0" y="-80" width="720" height="86" fill="url(#scan)" opacity="0.72" style="mix-blend-mode:${colors.scanBlend}"><animateTransform attributeName="transform" type="translate" from="0 -80" to="0 1000" dur="5.6s" repeatCount="indefinite"/></rect>
<rect x="3" y="3" width="714" height="914" rx="21" fill="none" stroke="url(#border)" stroke-width="2" opacity="0.68"><animate attributeName="opacity" values="0.42;0.9;0.42" dur="4s" repeatCount="indefinite"/></rect>
</svg>`;
}

async function main() {
  const sourcePath = getSourcePath();
  const desktopPortrait = await samplePortrait(sourcePath, 90, 88);
  const mobilePortrait = await samplePortrait(sourcePath, 70, 60);

  await mkdir(outputDirectory, { recursive: true });

  await Promise.all([
    writeFile(resolve(outputDirectory, "agent-console-dark.svg"), createDesktopSvg("dark", desktopPortrait)),
    writeFile(resolve(outputDirectory, "agent-console-light.svg"), createDesktopSvg("light", desktopPortrait)),
    writeFile(resolve(outputDirectory, "agent-console-mobile-dark.svg"), createMobileSvg("dark", mobilePortrait)),
    writeFile(resolve(outputDirectory, "agent-console-mobile-light.svg"), createMobileSvg("light", mobilePortrait))
  ]);

  console.log(`Generated hero assets from ${basename(sourcePath)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
