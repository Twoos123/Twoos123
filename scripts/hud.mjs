// hud.svg: the header, a hero banner over a real screenshot of Mirage from mid window. My name
// leads, with this year's live GitHub numbers under it; the killfeed and radar sit quietly at
// the edges, and in the archway a T keeps walking into a headshot.

import { readFileSync } from 'node:fs';
import { C, HUD, esc, r1, svg, textWidth, weaponFor } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const H = 420;
const LEFT = 56;

// Images are embedded, because GitHub shows the SVG as an <img>, which can't load anything else.
const IMAGES = new URL('../images/', import.meta.url);
const dataUri = (file, type) => `data:${type};base64,${readFileSync(new URL(file, IMAGES)).toString('base64')}`;

// The backdrop is Valve's 1920x1080 screenshot from mid window. images/mirage.jpg is the 1200px
// wide crop from 0,266, which puts the archway right of the text; fromShot() turns the
// screenshot's pixels into the banner's.
const SHOT = { x: 0, y: 266, width: 1200 };
const S = W / SHOT.width;
const fromShot = (x, y) => [r1((x - SHOT.x) * S), r1((y - SHOT.y) * S)];

const scene = () => `<image href="${dataUri('mirage.jpg', 'image/jpeg')}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`;

// The T who stood in the archway (images/mirage-t.png, cut out of the screenshot: 29x84 from
// 744,546, head at 755,554), so he can strafe and go down. The group sits on his head.
function target(icons) {
  const [hx, hy] = fromShot(755, 554);
  const [sx, sy] = fromShot(744, 546);
  return `
<g transform="translate(${hx} ${hy})">
<g class="agent"><image href="${dataUri('mirage-t.png', 'image/png')}" x="${r1(sx - hx)}" y="${r1(sy - hy)}" width="${r1(29 * S)}" height="${r1(84 * S)}"/></g>
<g class="crosshair">
<g stroke="#000" stroke-width="3.6" stroke-opacity="0.55"><path d="M-11 0H-4M4 0H11M0 -11V-4M0 4V11"/></g>
<g stroke="#46f04a" stroke-width="1.8"><path d="M-11 0H-4M4 0H11M0 -11V-4M0 4V11"/></g>
<circle r="1.2" fill="#46f04a"/>
</g>
<g class="hitmarker" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M-10 -10L-5 -5M10 -10L5 -5M-10 10L-5 5M10 10L5 5"/></g>
<g class="hs">${icons.use('headshot', -11, -48, 22, C.red)}</g>
</g>`;
}

// The radar is CS2's own Mirage overview (images/mirage-radar.jpg: the playable 880px square of
// the 1024px original, from 100,80). Places below are in the original's pixels; the routes
// were traced along its floor so nobody walks through a wall.
const RADAR = 124;
const onRadar = ([x, y]) => [r1(((x - 100) * RADAR) / 880), r1(((y - 80) * RADAR) / 880)];
const ROUTES = [
  [[324, 708], [324, 484], [264, 416], [260, 344], [228, 288]], // CT spawn to B, through short and market
  [[324, 708], [324, 752], [364, 792], [536, 800], [556, 780]], // CT spawn to A
  [[468, 640], [492, 660], [492, 716], [556, 780]], // jungle down to A
];
const SITES = { A: [556, 780], B: [228, 288] };
const YOU = [448, 456]; // in mid window, where the screenshot was taken, looking east down mid
const ENEMY = [680, 500]; // the T in the archway, spotted at top mid

function radar() {
  const teammates = ROUTES.map((route, i) => {
    const points = route.map(onRadar);
    const length = points.slice(1).reduce((sum, p, j) => sum + Math.hypot(p[0] - points[j][0], p[1] - points[j][1]), 0);
    // There and back at about 10px a second, each teammate part way along at the first frame.
    const dur = r1((2 * length) / 10);
    return `<circle r="2.8" fill="${C.ct}" stroke="#0b0f14" stroke-width="0.8"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M${points.map((p) => p.join(' ')).join('L')}" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" begin="-${r1(dur * (0.2 + i * 0.25))}s"/></circle>`;
  }).join('');
  const sites = Object.entries(SITES)
    .map(([name, at]) => {
      const [x, y] = onRadar(at);
      return `<text x="${x}" y="${r1(y + 4)}" text-anchor="middle" class="site">${name}</text>`;
    })
    .join('');
  const [ex, ey] = onRadar(ENEMY);
  const [yx, yy] = onRadar(YOU);
  return `
<g transform="translate(${W - 24 - RADAR} ${H - 24 - RADAR})">
<rect width="${RADAR}" height="${RADAR}" rx="6" fill="#0d1116"/>
<g clip-path="url(#radarclip)">
<image href="${dataUri('mirage-radar.jpg', 'image/jpeg')}" width="${RADAR}" height="${RADAR}"/>
${sites}
${teammates}
<circle cx="${ex}" cy="${ey}" r="2.8" fill="${C.red}" stroke="#0b0f14" stroke-width="0.8" class="spotted"/>
<g transform="translate(${yx} ${yy})"><path d="M0 -5.5L4 4.6L0 2.4L-4 4.6Z" fill="#fff" stroke="#0b0f14" stroke-width="0.7" class="you"/></g>
</g>
<rect x="0.5" y="0.5" width="${RADAR - 1}" height="${RADAR - 1}" rx="6" fill="none" stroke="#fff" stroke-opacity="0.22"/>
</g>`;
}

// What each kind of GitHub activity looks like in the killfeed.
const KILLS = {
  push: (repo) => ({ weapon: weaponFor(repo && repo.language), mods: [] }),
  merge: () => ({ weapon: 'm4a1_silencer', mods: ['headshot'] }),
  pr: () => ({ weapon: 'usp_silencer', mods: [] }),
  create: () => ({ weapon: 'knife_karambit', mods: [] }),
  release: () => ({ weapon: 'awp', mods: ['noscope', 'headshot'] }),
  issue: () => ({ weapon: 'deagle', mods: ['penetrate'] }),
};

function killfeed(config, data, icons) {
  let y = 24;
  return data.feed
    .slice(0, 3)
    .map((entry, i) => {
      const you = config.login;
      const { weapon, mods } = KILLS[entry.kind](data.repos.find((r) => r.name === entry.repo));
      const detail = entry.count ? `×${entry.count}` : entry.detail || '';
      const youW = textWidth(you, 13, 0.55);
      const targetW = textWidth(entry.repo, 13, 0.55);
      const detailW = detail ? textWidth(detail, 11, 0.55) + 8 : 0;
      const weaponW = icons.width(weapon, 16);
      const modsW = mods.length * 18;
      const w = r1(10 + youW + 8 + weaponW + (modsW ? modsW + 4 : 0) + 8 + targetW + detailW + 10);
      const x = r1(W - 24 - w);
      let cx = x + 10;
      const parts = [];
      parts.push(`<text x="${r1(cx)}" y="${y + 17.5}" class="kf-you">${esc(you)}</text>`);
      cx += youW + 8;
      parts.push(icons.use(weapon, cx, y + 5, 16, '#e8ebef'));
      cx += weaponW + 4;
      for (const mod of mods) {
        parts.push(icons.use(mod, cx, y + 5, 16, '#e8ebef'));
        cx += 18;
      }
      cx += 8;
      parts.push(`<text x="${r1(cx)}" y="${y + 17.5}" class="kf-target">${esc(entry.repo)}</text>`);
      cx += targetW + 8;
      if (detail) parts.push(`<text x="${r1(cx)}" y="${y + 17}" class="kf-detail">${esc(detail)}</text>`);
      const row = `<g class="kill" style="animation-delay:${r1(i * 0.7)}s"><rect x="${x}" y="${y}" width="${w}" height="26" rx="3" fill="#000" fill-opacity="0.55" stroke="${C.red}" stroke-opacity="0.85" stroke-width="1.5"/>${parts.join('')}</g>`;
      y += 32;
      return row;
    })
    .join('\n');
}

// The hero: who's being spectated, my name, and the taglines taking turns under it.
function hero(config) {
  const lines = config.taglines;
  const cycle = lines.length * 4;
  const share = 100 / lines.length;
  const taglines = lines.map((line, i) => `<text x="${LEFT}" y="232" class="tagline t${i}" style="animation-delay:${i * 4 - 0.6}s">${esc(line)}</text>`).join('');
  return {
    css: `@keyframes line { 0% { opacity: 0; } ${r1(share * 0.1)}% { opacity: 1; } ${r1(share * 0.9)}% { opacity: 1; } ${r1(share)}% { opacity: 0; } 100% { opacity: 0; } }
.tagline { font: 500 21px ${HUD}; fill: #dfe5ec; opacity: 0; animation: line ${cycle}s linear infinite both; }`,
    body: `
<text x="${LEFT}" y="112" class="eyebrow">SPECTATING · <tspan fill="${C.ct}">${esc(config.login)}</tspan></text>
<text x="${LEFT - 4}" y="194" class="name" filter="url(#lift)">${esc(config.name.toUpperCase())}</text>
${taglines}`,
  };
}

// This year's numbers, in one row under the name.
function stats(data) {
  return [
    [data.total.toLocaleString('en-US'), 'CONTRIBUTIONS', C.money],
    [data.current, 'DAY STREAK', C.t],
    [data.thisWeek, 'THIS WEEK', C.ct],
  ]
    .map(([value, label, color], i) => `<g transform="translate(${LEFT + i * 146} 262)">
<rect width="134" height="60" rx="4" fill="#000" fill-opacity="0.5" stroke="#fff" stroke-opacity="0.12"/>
<rect width="134" height="3" rx="1.5" fill="${color}"/>
<text x="14" y="35" class="stat">${value}</text>
<text x="14" y="50" class="statlabel">${label}</text>
</g>`)
    .join('\n');
}

export function hudSvg(config, data) {
  const icons = iconSet();
  const intro = hero(config);
  const defs = `
<linearGradient id="shadeleft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.86"/><stop offset="0.34" stop-color="#000" stop-opacity="0.62"/><stop offset="0.58" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="shadetop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.4"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="shadebottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></linearGradient>
<radialGradient id="vignette" cx="0.5" cy="0.48" r="0.72"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
<filter id="lift" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000" flood-opacity="0.75"/></filter>
<clipPath id="radarclip"><rect width="${RADAR}" height="${RADAR}" rx="6"/></clipPath>`;

  const style = `
.site { font: 800 12px ${HUD}; fill: #fff; fill-opacity: 0.85; stroke: #0b0f14; stroke-width: 2.6; stroke-opacity: 0.7; paint-order: stroke; }
.spotted { animation: blink 1.2s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.15; } }
.you { transform-box: fill-box; transform-origin: center; animation: look 6s ease-in-out infinite alternate; }
@keyframes look { from { transform: rotate(70deg); } to { transform: rotate(110deg); } }
.kill { animation: kill 16s ease-out infinite; }
@keyframes kill { 0%, 70% { opacity: 1; transform: translateX(0); } 78%, 86% { opacity: 0; transform: translateX(26px); } 90%, 100% { opacity: 1; transform: translateX(0); } }
.kf-you { font: 700 13px ${HUD}; fill: ${C.ctText}; }
.kf-target { font: 700 13px ${HUD}; fill: ${C.tText}; }
.kf-detail { font: 600 11px ${HUD}; fill: ${C.dim}; }
.eyebrow { font: 700 12px ${HUD}; letter-spacing: 3.2px; fill: #aeb8c3; }
.name { font: 700 88px ${HUD}; letter-spacing: 1px; fill: #fff; }
.stat { font: 700 26px ${HUD}; fill: #fff; }
.statlabel { font: 700 10px ${HUD}; letter-spacing: 1.6px; fill: ${C.dim}; }
.caption { font: 600 11px ${HUD}; letter-spacing: 0.6px; fill: #fff; fill-opacity: 0.45; }
/* Every 6s the T strafes in front of the archway, the crosshair catches up: headshot. */
.agent { transform-box: fill-box; transform-origin: 50% 100%; animation: agent 6s ease-in-out infinite; }
@keyframes agent { 0% { transform: translateX(0); opacity: 1; } 18% { transform: translateX(-14px); opacity: 1; } 40% { transform: translateX(12px); opacity: 1; } 45% { transform: translateX(12px) rotate(0deg); opacity: 1; } 55% { transform: translateX(16px) rotate(-80deg); opacity: 0; } 72% { transform: translateX(0); opacity: 0; } 84% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(0); opacity: 1; } }
.crosshair { animation: aim 6s ease-in-out infinite; }
@keyframes aim { 0% { transform: translate(-16px, 7px); } 18% { transform: translate(-21px, 4px); } 38% { transform: translate(7px, 1px); } 44% { transform: translate(12px, 0); } 45.5% { transform: translate(12px, -9px); } 52% { transform: translate(12px, 0); } 80% { transform: translate(-11px, 8px); } 100% { transform: translate(-16px, 7px); } }
.hitmarker { opacity: 0; animation: hit 6s linear infinite; }
@keyframes hit { 0%, 44% { opacity: 0; transform: translate(12px, 0) scale(0.8); } 45% { opacity: 1; transform: translate(12px, 0) scale(1); } 52% { opacity: 0; transform: translate(12px, 0) scale(1.3); } 100% { opacity: 0; transform: translate(12px, 0) scale(1.3); } }
.hs { opacity: 0; animation: hs 6s ease-out infinite; }
@keyframes hs { 0%, 45% { opacity: 0; transform: translate(12px, 0); } 47% { opacity: 1; transform: translate(12px, 0); } 62% { opacity: 0; transform: translate(12px, -22px); } 100% { opacity: 0; transform: translate(12px, -22px); } }
${intro.css}
@media (prefers-reduced-motion: reduce) { .kill, .t0 { opacity: 1; } }`;

  const body = `
<rect width="${W}" height="${H}" fill="#0b0d10"/>
${scene()}
${target(icons)}
<rect width="${W}" height="${H}" fill="#000" fill-opacity="0.12"/>
<rect width="${W}" height="${H}" fill="url(#shadeleft)"/>
<rect width="${W}" height="${H}" fill="url(#shadetop)"/>
<rect width="${W}" height="${H}" fill="url(#shadebottom)"/>
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
${intro.body}
${stats(data)}
<text x="${LEFT}" y="352" class="caption">Live from my GitHub · last 12 months · redrawn daily</text>
${killfeed(config, data, icons)}
${radar()}`;

  return svg(W, H, `${config.name}: software engineer. My GitHub as a Counter-Strike 2 banner over Mirage, with this year's contributions, my streak and my latest activity as the killfeed`, defs + icons.defs(), style, body);
}
