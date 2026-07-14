#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/hero");

const portraitFilter = [
  "crop=1050:1050:1050:1850",
  "format=gray",
  "eq=contrast=1.28:brightness=0.025:gamma=0.94",
  "unsharp=3:3:0.45"
].join(",");

const profileLines = [
  { type: "header", value: "wildan@agentlab" },
  { type: "row", key: "Subject", value: "Wildan Syukri Niam" },
  { type: "row", key: "Role", value: "AI Researcher & Web3 Builder" },
  { type: "row", key: "Affiliation", value: "Telkom University" },
  { type: "row", key: "Base", value: "Bandung, Indonesia" },
  { type: "row", key: "Status", value: "Researching / Building / Shipping" },
  { type: "blank" },
  { type: "section", value: "RESEARCH.NODE" },
  { type: "row", key: "Primary", value: "AI Agents" },
  { type: "row", key: "Direction", value: "Trustworthy Autonomous Systems" },
  { type: "row", key: "Themes", value: "Multi-agent systems / agentic payments" },
  { type: "blank" },
  { type: "section", value: "BUILD.LOG" },
  { type: "row", key: "PayGate", value: "Agentic payments" },
  { type: "row", key: "Fradium", value: "Web3 trust layer" },
  { type: "row", key: "NovaAI", value: "Intelligent wallet" },
  { type: "row", key: "Quorum", value: "Agent coordination" },
  { type: "blank" },
  { type: "section", value: "GRID.LINKS" },
  { type: "row", key: "GitHub", value: "@wildanniam" },
  { type: "row", key: "Portfolio", value: "portofolio-wildan-zeta.vercel.app" },
  { type: "footer", value: "signal.locked > AI / WEB3 / AGENTS" }
];

const palettes = {
  dark: {
    backgroundStart: "#020617",
    backgroundEnd: "#11152F",
    panel: "#07111F",
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
    backgroundStart: "#F8FBFF",
    backgroundEnd: "#F5F3FF",
    panel: "#FFFFFF",
    primary: "#172554",
    muted: "#64748B",
    cyan: "#0891B2",
    blue: "#2563EB",
    violet: "#6D28D9",
    green: "#047857",
    red: "#DC2626",
    scanBlend: "multiply"
  }
};

const layouts = {
  desktop: {
    width: 1180,
    height: 610,
    outerRadius: 18,
    titlebar: { x: 3, y: 3, width: 1174, height: 34, radius: 16 },
    visualPanel: { x: 14, y: 64, width: 488, height: 468, radius: 14 },
    infoPanel: { x: 508, y: 48, width: 655, height: 500, radius: 14 },
    visualTitle: { x: 30, y: 62 },
    infoTitle: { x: 524, y: 62 },
    portrait: { columns: 88, rows: 54, x: 64, y: 102, lineHeight: 7.55, fontSize: 7.4 },
    portraitClip: { x: 24, y: 82, width: 470, height: 438, radius: 12 },
    system: { x: 528, y: 82, width: 620, lineHeight: 21.5, fontSize: 14 },
    footerY: 585
  },
  mobile: {
    width: 720,
    height: 1080,
    outerRadius: 22,
    titlebar: { x: 20, y: 20, width: 680, height: 42, radius: 14 },
    visualPanel: { x: 48, y: 94, width: 624, height: 350, radius: 14 },
    infoPanel: { x: 48, y: 470, width: 624, height: 526, radius: 14 },
    visualTitle: { x: 66, y: 116 },
    infoTitle: { x: 66, y: 492 },
    portrait: { columns: 88, rows: 44, x: 154, y: 132, lineHeight: 7.05, fontSize: 8.1 },
    portraitClip: { x: 58, y: 122, width: 604, height: 312, radius: 12 },
    system: { x: 72, y: 520, width: 574, lineHeight: 21, fontSize: 13 },
    footerY: 1045
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
    } else if ([9, 10, 13, 32].includes(value)) {
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
      "-vf", `${portraitFilter},scale=${columns}:${rows}`,
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

function createAsciiTspans({ pixels, width, height }, placement) {
  const characters = " .:-=+*#%@";
  const rows = [];

  for (let row = 0; row < height; row += 1) {
    let line = "";

    for (let column = 0; column < width; column += 1) {
      const pixel = pixels[row * width + column];
      const x = column / Math.max(width - 1, 1);
      const y = row / Math.max(height - 1, 1);
      const head = Math.exp(-2.2 * (((x - 0.57) ** 2) / 0.09 + ((y - 0.45) ** 2) / 0.15));
      const torso = Math.exp(-1.55 * (((x - 0.52) ** 2) / 0.34 + ((y - 0.94) ** 2) / 0.2));
      const subjectWeight = clamp(Math.max(head, torso), 0, 1);
      const darkness = (255 - pixel) / 255;
      const ink = clamp(darkness * (0.13 + subjectWeight * 1.02), 0, 1);
      const characterIndex = Math.round(ink * (characters.length - 1));
      line += characters[characterIndex];
    }

    rows.push(
      `<tspan x="${placement.x}" y="${(placement.y + row * placement.lineHeight).toFixed(2)}" xml:space="preserve">${escapeXml(line)}</tspan>`
    );
  }

  return rows.join("\n");
}

function buildSystemLayer({ x, y, width, lineHeight, fontSize }, colors) {
  const clips = [];
  const rows = [];

  profileLines.forEach((line, index) => {
    if (line.type === "blank") return;

    const id = `system-line-${index}`;
    const lineY = y + index * lineHeight;
    const begin = (0.68 + index * 0.105).toFixed(2);

    clips.push(
      `<clipPath id="${id}"><rect x="${x - 3}" y="${(lineY - fontSize - 2).toFixed(2)}" width="0" height="${fontSize + 8}"><animate attributeName="width" from="0" to="${width}" dur="0.36s" begin="${begin}s" fill="freeze"/></rect></clipPath>`
    );

    if (line.type === "header") {
      rows.push(`<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-head"><tspan fill="${colors.violet}">${escapeXml(line.value)}</tspan><tspan fill="${colors.muted}"> ------------------------------------------</tspan></text></g>`);
      return;
    }

    if (line.type === "section") {
      rows.push(`<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-section" fill="${colors.green}">- ${escapeXml(line.value)} -----------------------------------</text></g>`);
      return;
    }

    if (line.type === "footer") {
      rows.push(`<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-footer" fill="${colors.blue}">${escapeXml(line.value)}</text></g>`);
      return;
    }

    const dots = ".".repeat(Math.max(3, 14 - line.key.length));
    rows.push(
      `<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-row"><tspan fill="${colors.muted}">. </tspan><tspan class="system-key" fill="${colors.cyan}">${escapeXml(line.key)}</tspan><tspan fill="${colors.muted}">: ${dots} </tspan><tspan fill="${colors.primary}">${escapeXml(line.value)}</tspan></text></g>`
    );
  });

  return { clips: clips.join("\n"), rows: rows.join("\n") };
}

function createHeroSvg(mode, size, portrait) {
  const colors = palettes[mode];
  const layout = layouts[size];
  const titlebar = layout.titlebar;
  const visual = layout.visualPanel;
  const info = layout.infoPanel;
  const clip = layout.portraitClip;
  const ascii = createAsciiTspans(portrait, layout.portrait);
  const system = buildSystemLayer(layout.system, colors);
  const isDesktop = size === "desktop";
  const titleCenter = titlebar.x + titlebar.width / 2;
  const liveX = titlebar.x + titlebar.width - (isDesktop ? 138 : 94);
  const cursorY = layout.system.y + (profileLines.length - 1) * layout.system.lineHeight - 15;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="title description">
<title id="title">Wildan Syukri Niam - AI Researcher and Web3 Builder</title>
<desc id="description">An animated agent intelligence console with an ASCII portrait, research direction, featured builds, and profile links.</desc>
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.backgroundStart}"/><stop offset="1" stop-color="${colors.backgroundEnd}"/></linearGradient>
  <linearGradient id="ascii-signal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.cyan}"><animate attributeName="stop-color" values="${colors.cyan};${colors.violet};${colors.blue};${colors.cyan}" dur="9s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="${colors.violet}"><animate attributeName="stop-color" values="${colors.violet};${colors.blue};${colors.cyan};${colors.violet}" dur="9s" repeatCount="indefinite"/></stop></linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.violet}"/><stop offset="0.48" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.green}"/></linearGradient>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colors.cyan}" stop-opacity="0"/><stop offset="0.5" stop-color="${colors.cyan}" stop-opacity="0.46"/><stop offset="1" stop-color="${colors.violet}" stop-opacity="0"/></linearGradient>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${colors.cyan}" opacity="0.052"/></pattern>
  <clipPath id="portrait-clip"><rect x="${clip.x}" y="${clip.y}" width="${clip.width}" height="${clip.height}" rx="${clip.radius}"/></clipPath>
  <mask id="portrait-reveal"><rect x="${clip.x}" y="${clip.y}" width="${clip.width}" height="0" rx="${clip.radius}" fill="white"><animate attributeName="height" from="0" to="${clip.height}" dur="2.1s" begin="0.12s" fill="freeze"/></rect></mask>
  ${system.clips}
  <style>
    .mono { font-family: 'Courier New', Consolas, monospace; }
    .ascii { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.portrait.fontSize}px; letter-spacing: -0.15px; fill: url(#ascii-signal); }
    .panel-title { font-family: 'Courier New', Consolas, monospace; font-size: ${isDesktop ? 11 : 12}px; letter-spacing: 2px; fill: ${colors.blue}; opacity: 0.78; }
    .terminal-label { font-family: 'Courier New', Consolas, monospace; font-size: ${isDesktop ? 12 : 11}px; letter-spacing: 0.5px; fill: ${colors.muted}; }
    .live-label { font-family: 'Courier New', Consolas, monospace; font-size: ${isDesktop ? 10 : 9}px; letter-spacing: 1px; fill: ${colors.red}; }
    .system-head { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.system.fontSize + 2}px; font-weight: 700; }
    .system-section, .system-footer, .system-row { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.system.fontSize}px; }
    .system-section, .system-key { font-weight: 700; }
    text, tspan { white-space: pre; }
  </style>
</defs>
<rect width="${layout.width}" height="${layout.height}" rx="${layout.outerRadius}" fill="url(#background)"/>
<rect width="${layout.width}" height="${layout.height}" rx="${layout.outerRadius}" fill="url(#scanlines)"/>
<rect x="${titlebar.x}" y="${titlebar.y}" width="${titlebar.width}" height="${titlebar.height}" rx="${titlebar.radius}" fill="${colors.panel}" fill-opacity="0.84"/>
<circle cx="${titlebar.x + 21}" cy="${titlebar.y + titlebar.height / 2}" r="5" fill="#EF4444"><animate attributeName="opacity" values="1;0.55;1" dur="4s" repeatCount="indefinite"/></circle>
<circle cx="${titlebar.x + 39}" cy="${titlebar.y + titlebar.height / 2}" r="5" fill="#F59E0B"><animate attributeName="opacity" values="1;0.55;1" dur="4s" begin="0.3s" repeatCount="indefinite"/></circle>
<circle cx="${titlebar.x + 57}" cy="${titlebar.y + titlebar.height / 2}" r="5" fill="${colors.green}"><animate attributeName="opacity" values="1;0.55;1" dur="4s" begin="0.6s" repeatCount="indefinite"/></circle>
<text x="${titleCenter}" y="${titlebar.y + titlebar.height / 2 + 5}" text-anchor="middle" class="terminal-label">wildan@agentlab ~ % ./profile --live</text>
${isDesktop ? `<circle cx="${liveX}" cy="${titlebar.y + titlebar.height / 2}" r="4" fill="${colors.red}"><animate attributeName="opacity" values="1;0.15;1" dur="1.1s" repeatCount="indefinite"/></circle><text x="${liveX + 10}" y="${titlebar.y + titlebar.height / 2 + 4}" class="live-label">SCANNING</text>` : ""}
<rect x="${visual.x}" y="${visual.y}" width="${visual.width}" height="${visual.height}" rx="${visual.radius}" fill="${colors.panel}" fill-opacity="0.38" stroke="url(#border)" stroke-opacity="0.42"/>
<rect x="${info.x}" y="${info.y}" width="${info.width}" height="${info.height}" rx="${info.radius}" fill="${colors.panel}" fill-opacity="0.42" stroke="url(#border)" stroke-opacity="0.42"/>
<text x="${layout.visualTitle.x}" y="${layout.visualTitle.y}" class="panel-title">VISUAL.MAP / PORTRAIT.SIGNAL</text>
<text x="${layout.infoTitle.x}" y="${layout.infoTitle.y}" class="panel-title">SYSTEM.INFO / RESEARCH.BUILDER</text>
<g clip-path="url(#portrait-clip)" mask="url(#portrait-reveal)"><text class="ascii" fill="${colors.cyan}" font-family="'Courier New', Consolas, monospace" font-size="${layout.portrait.fontSize}px" letter-spacing="-0.15px">${ascii}</text></g>
${system.rows}
<rect x="${layout.system.x + 2}" y="${cursorY}" width="9" height="${layout.system.fontSize + 2}" fill="${colors.cyan}" opacity="0"><animate attributeName="opacity" values="0;0;1;0;1;0;1;0" keyTimes="0;0.03;0.06;0.32;0.5;0.68;0.84;1" dur="1.4s" begin="3.3s" repeatCount="indefinite"/></rect>
<text x="${layout.width / 2}" y="${layout.footerY}" text-anchor="middle" class="mono" font-size="10" letter-spacing="1.5" fill="${colors.muted}">AI AGENTS / WEB3 TRUST / AUTONOMOUS SYSTEMS</text>
<rect x="0" y="-70" width="${layout.width}" height="70" fill="url(#scan)" opacity="0.72" style="mix-blend-mode:${colors.scanBlend}"><animateTransform attributeName="transform" type="translate" from="0 -70" to="0 ${layout.height + 70}" dur="4.5s" repeatCount="indefinite"/></rect>
<rect x="3" y="3" width="${layout.width - 6}" height="${layout.height - 6}" rx="${layout.outerRadius - 2}" fill="none" stroke="url(#border)" stroke-width="2" opacity="0.76"><animate attributeName="opacity" values="0.5;0.94;0.5" dur="3.4s" repeatCount="indefinite"/></rect>
</svg>`;
}

async function main() {
  const sourcePath = getSourcePath();
  const desktopPortrait = await samplePortrait(sourcePath, layouts.desktop.portrait.columns, layouts.desktop.portrait.rows);
  const mobilePortrait = await samplePortrait(sourcePath, layouts.mobile.portrait.columns, layouts.mobile.portrait.rows);

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "agent-console-dark.svg"), createHeroSvg("dark", "desktop", desktopPortrait)),
    writeFile(resolve(outputDirectory, "agent-console-light.svg"), createHeroSvg("light", "desktop", desktopPortrait)),
    writeFile(resolve(outputDirectory, "agent-console-mobile-dark.svg"), createHeroSvg("dark", "mobile", mobilePortrait)),
    writeFile(resolve(outputDirectory, "agent-console-mobile-light.svg"), createHeroSvg("light", "mobile", mobilePortrait))
  ]);

  console.log(`Generated refined hero assets from ${basename(sourcePath)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
