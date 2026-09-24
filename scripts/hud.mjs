// hud.svg: the header, drawn as an in-game HUD over a real screenshot of Mirage from mid
// window. The killfeed, score, money and ammo are all live GitHub numbers.

import { readFileSync } from 'node:fs';
import { C, HUD, esc, r1, svg, textWidth, weaponFor } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const H = 440;

// Images are embedded, because GitHub shows the SVG as an <img>, which can't load anything else.
const IMAGES = new URL('../images/', import.meta.url);
const dataUri = (file, type) => `data:${type};base64,${readFileSync(new URL(file, IMAGES)).toString('base64')}`;

function isoWeek(dateText) {
  const d = new Date(`${dateText}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// The backdrop: Valve's own screenshot of Mirage, looking out of mid window (images/mirage.jpg,
// cropped from 0,170 of the 1920px original at 1640px wide).
const scene = () => `<image href="${dataUri('mirage.jpg', 'image/jpeg')}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`;

// The T who stood in the archway in that screenshot, cut out (images/mirage-t.png) so he can
// strafe and go down. The group sits on his head; the sprite starts exactly where he stood.
const target = (icons) => `
<g transform="translate(460.4 234.1)">
<g class="agent"><image href="${dataUri('mirage-t.png', 'image/png')}" x="-6.7" y="-4.8" width="17.7" height="51.2"/></g>
<g class="crosshair">
<g stroke="#000" stroke-width="3.6" stroke-opacity="0.55"><path d="M-10 0H-3.5M3.5 0H10M0 -10V-3.5M0 3.5V10"/></g>
<g stroke="#46f04a" stroke-width="1.8"><path d="M-10 0H-3.5M3.5 0H10M0 -10V-3.5M0 3.5V10"/></g>
<circle r="1.2" fill="#46f04a"/>
</g>
<g class="hitmarker" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M-9 -9L-4.5 -4.5M9 -9L4.5 -4.5M-9 9L-4.5 4.5M9 9L4.5 4.5"/></g>
<g class="hs">${icons.use('headshot', -10, -40, 20, C.red)}</g>
</g>`;

// The radar is CS2's own Mirage overview (images/mirage-radar.jpg: the playable 880px square of
// the 1024px original, from 100,80). Places below are in the original's pixels; the routes
// were traced along its floor so nobody walks through a wall.
const RADAR = 156;
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
    // There and back at about 12px a second, each teammate part way along at the first frame.
    const dur = r1((2 * length) / 12);
    return `<circle r="3.4" fill="${C.ct}" stroke="#0b0f14" stroke-width="1"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M${points.map((p) => p.join(' ')).join('L')}" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" begin="-${r1(dur * (0.2 + i * 0.25))}s"/></circle>`;
  }).join('');
  const sites = Object.entries(SITES)
    .map(([name, at]) => {
      const [x, y] = onRadar(at);
      return `<text x="${x}" y="${r1(y + 5)}" text-anchor="middle" class="site">${name}</text>`;
    })
    .join('');
  const [ex, ey] = onRadar(ENEMY);
  const [yx, yy] = onRadar(YOU);
  return `
<g transform="translate(18 18)">
<rect width="${RADAR}" height="${RADAR}" rx="6" fill="#0d1116"/>
<g clip-path="url(#radarclip)">
<image href="${dataUri('mirage-radar.jpg', 'image/jpeg')}" width="${RADAR}" height="${RADAR}"/>
${sites}
${teammates}
<circle cx="${ex}" cy="${ey}" r="3.4" fill="${C.red}" stroke="#0b0f14" stroke-width="1" class="spotted"/>
<g transform="translate(${yx} ${yy})"><path d="M0 -6.5L4.6 5.5L0 2.8L-4.6 5.5Z" fill="#fff" stroke="#0b0f14" stroke-width="0.8" class="you"/></g>
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
  let y = 16;
  return data.feed
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
      const x = r1(982 - w);
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
      const row = `<g class="kill" style="animation-delay:${r1(i * 0.7)}s"><rect x="${x}" y="${y}" width="${w}" height="26" rx="3" fill="#000" fill-opacity="0.55" stroke="${C.red}" stroke-width="1.5"/>${parts.join('')}</g>`;
      y += 32;
      return row;
    })
    .join('\n');
}

function scoreBar(data) {
  const seconds = Array.from({ length: 56 }, (_, i) => `<text x="497" y="${42 + i * 28}" class="clock">${String(55 - i).padStart(2, '0')}</text>`).join('');
  return `
<g>
<rect x="372" y="12" width="84" height="46" rx="3" fill="url(#ctbox)"/><rect x="372" y="12" width="84" height="3" fill="${C.ct}"/>
<text x="414" y="45" text-anchor="middle" class="score">${data.thisWeek}</text>
<text x="414" y="73" text-anchor="middle" class="scorelabel" fill="${C.ctText}">THIS WEEK</text>
<rect x="460" y="12" width="80" height="46" rx="3" fill="#0b0f14" fill-opacity="0.88"/>
<text x="496" y="42" text-anchor="end" class="clock">1:</text>
<g clip-path="url(#clockclip)"><g class="tick">${seconds}</g></g>
<text x="500" y="73" text-anchor="middle" class="scorelabel" fill="${C.dim}">ROUND ${isoWeek(data.today)}</text>
<rect x="544" y="12" width="84" height="46" rx="3" fill="url(#tbox)"/><rect x="544" y="12" width="84" height="3" fill="${C.t}"/>
<text x="586" y="45" text-anchor="middle" class="score">${data.current}</text>
<text x="586" y="73" text-anchor="middle" class="scorelabel" fill="${C.tText}">DAY STREAK</text>
</g>`;
}

function playerCard(config, data) {
  const lines = config.taglines;
  const cycle = lines.length * 4;
  const share = 100 / lines.length;
  const taglines = lines.map((line, i) => `<text x="36" y="342" class="tagline t${i}" style="animation-delay:${i * 4 - 0.6}s">${esc(line)}</text>`).join('');

  const reposText = `${data.publicRepos} PUBLIC REPOS`;
  const reposW = r1(textWidth(reposText, 11, 0.62) + 22);
  const badges = `<g transform="translate(36 360)"><rect width="${reposW}" height="26" rx="13" fill="#000" fill-opacity="0.5" stroke="#fff" stroke-opacity="0.22"/><text x="11" y="17.5" class="pill">${esc(reposText)}</text></g>`;

  return {
    css: `@keyframes line { 0% { opacity: 0; } ${r1(share * 0.1)}% { opacity: 1; } ${r1(share * 0.9)}% { opacity: 1; } ${r1(share)}% { opacity: 0; } 100% { opacity: 0; } }
.tagline { font: 500 18px ${HUD}; fill: #d7dde4; opacity: 0; animation: line ${cycle}s linear infinite both; }`,
    body: `
<text x="36" y="252" class="eyebrow">SPECTATING · <tspan fill="${C.ct}">${esc(config.login)}</tspan></text>
<text x="34" y="310" class="name" filter="url(#lift)">${esc(config.name.toUpperCase())}</text>
${taglines}
${badges}`,
  };
}

function bottomHud(data, icons) {
  const weapon = data.repos[0];
  const reserve = `/ ${weapon.stars}★`;
  const reserveW = textWidth(reserve, 16, 0.55);
  return `
<g transform="translate(36 404)">
${icons.use('health_cross', 0, 2, 24, C.white)}
<text x="30" y="24" class="hp">100</text>
${icons.use('armor_helmet', 104, 0, 28, C.white)}
<text x="136" y="24" class="hp">100</text>
</g>
${icons.use(weaponFor(weapon.language), r1(982 - icons.width(weaponFor(weapon.language), 30)), 354, 30, '#e8ebef')}
<text x="982" y="398" text-anchor="end" class="weapon">${esc(weapon.name)}</text>
<text x="${r1(982 - reserveW - 6)}" y="430" text-anchor="end" class="ammo">${weapon.commits}</text>
<text x="982" y="430" text-anchor="end" class="reserve">${esc(reserve)}</text>
<text x="${W / 2}" y="430" text-anchor="middle" class="caption">live GitHub data · updated daily</text>`;
}

export function hudSvg(config, data) {
  const icons = iconSet();
  const card = playerCard(config, data);
  const defs = `
<linearGradient id="shadeleft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.78"/><stop offset="0.36" stop-color="#000" stop-opacity="0.5"/><stop offset="0.62" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="shadetop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.28" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="shadebottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient>
<radialGradient id="vignette" cx="0.5" cy="0.48" r="0.72"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
<linearGradient id="ctbox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4c7c"/><stop offset="1" stop-color="#172a47"/></linearGradient>
<linearGradient id="tbox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5424"/><stop offset="1" stop-color="#3a2d12"/></linearGradient>
<filter id="lift" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.7"/></filter>
<clipPath id="radarclip"><rect width="${RADAR}" height="${RADAR}" rx="6"/></clipPath>
<clipPath id="clockclip"><rect x="496" y="18" width="34" height="32"/></clipPath>`;

  const style = `
.site { font: 800 14px ${HUD}; fill: #fff; fill-opacity: 0.85; stroke: #0b0f14; stroke-width: 3; stroke-opacity: 0.7; paint-order: stroke; }
.spotted { animation: blink 1.2s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.15; } }
.you { transform-box: fill-box; transform-origin: center; animation: look 6s ease-in-out infinite alternate; }
@keyframes look { from { transform: rotate(70deg); } to { transform: rotate(110deg); } }
.money { font: 700 26px ${HUD}; fill: ${C.money}; }
.moneylabel { font: 600 9px ${HUD}; letter-spacing: 1.6px; fill: ${C.dim}; }
.score { font: 700 28px ${HUD}; fill: #fff; }
.scorelabel { font: 700 9px ${HUD}; letter-spacing: 1.6px; }
.clock { font: 700 24px ${HUD}; fill: #fff; }
.tick { animation: tick 55s steps(55) infinite; }
@keyframes tick { to { transform: translateY(-1540px); } }
.kill { animation: kill 16s ease-out infinite; }
@keyframes kill { 0%, 70% { opacity: 1; transform: translateX(0); } 78%, 86% { opacity: 0; transform: translateX(26px); } 90%, 100% { opacity: 1; transform: translateX(0); } }
.kf-you { font: 700 13px ${HUD}; fill: ${C.ctText}; }
.kf-target { font: 700 13px ${HUD}; fill: ${C.tText}; }
.kf-detail { font: 600 11px ${HUD}; fill: ${C.dim}; }
.eyebrow { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.name { font: 700 66px ${HUD}; letter-spacing: 1px; fill: #fff; }
.pill { font: 700 11px ${HUD}; letter-spacing: 1.2px; fill: #e8ebef; }
.hp { font: 700 30px ${HUD}; fill: ${C.white}; }
.weapon { font: 700 12px ${HUD}; letter-spacing: 1px; fill: ${C.dim}; }
.ammo { font: 700 30px ${HUD}; fill: ${C.white}; }
.reserve { font: 700 16px ${HUD}; fill: ${C.dim}; }
.caption { font: 600 10px ${HUD}; letter-spacing: 1px; fill: #fff; fill-opacity: 0.4; }
/* Every 6s the T strafes in front of the archway, the crosshair catches up: headshot. */
.agent { transform-box: fill-box; transform-origin: 50% 100%; animation: agent 6s ease-in-out infinite; }
@keyframes agent { 0% { transform: translateX(0); opacity: 1; } 18% { transform: translateX(-10px); opacity: 1; } 40% { transform: translateX(9px); opacity: 1; } 45% { transform: translateX(9px) rotate(0deg); opacity: 1; } 55% { transform: translateX(12px) rotate(-80deg); opacity: 0; } 72% { transform: translateX(0); opacity: 0; } 84% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(0); opacity: 1; } }
.crosshair { animation: aim 6s ease-in-out infinite; }
@keyframes aim { 0% { transform: translate(-12px, 5px); } 18% { transform: translate(-16px, 3px); } 38% { transform: translate(5px, 1px); } 44% { transform: translate(9px, 0); } 45.5% { transform: translate(9px, -7px); } 52% { transform: translate(9px, 0); } 80% { transform: translate(-8px, 6px); } 100% { transform: translate(-12px, 5px); } }
.hitmarker { opacity: 0; animation: hit 6s linear infinite; }
@keyframes hit { 0%, 44% { opacity: 0; transform: translate(9px, 0) scale(0.8); } 45% { opacity: 1; transform: translate(9px, 0) scale(1); } 52% { opacity: 0; transform: translate(9px, 0) scale(1.3); } 100% { opacity: 0; transform: translate(9px, 0) scale(1.3); } }
.hs { opacity: 0; animation: hs 6s ease-out infinite; }
@keyframes hs { 0%, 45% { opacity: 0; transform: translate(9px, 0); } 47% { opacity: 1; transform: translate(9px, 0); } 62% { opacity: 0; transform: translate(9px, -18px); } 100% { opacity: 0; transform: translate(9px, -18px); } }
${card.css}
@media (prefers-reduced-motion: reduce) { .kill, .t0 { opacity: 1; } }`;

  const body = `
<rect width="${W}" height="${H}" fill="#0b0d10"/>
${scene()}
${target(icons)}
<rect width="${W}" height="${H}" fill="#000" fill-opacity="0.2"/>
<rect width="${W}" height="${H}" fill="url(#shadeleft)"/>
<rect width="${W}" height="${H}" fill="url(#shadetop)"/>
<rect width="${W}" height="${H}" fill="url(#shadebottom)"/>
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
${radar()}
<text x="20" y="200" class="money">$${data.total.toLocaleString('en-US')}</text>
<text x="20" y="215" class="moneylabel">CONTRIBUTIONS · 12 MO</text>
${scoreBar(data)}
${killfeed(config, data, icons)}
${card.body}
${bottomHud(data, icons)}`;

  return svg(W, H, `${config.name}'s GitHub, drawn as a Counter-Strike 2 HUD: the killfeed is my latest GitHub activity`, defs + icons.defs(), style, body);
}
