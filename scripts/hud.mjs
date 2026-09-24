// hud.svg: the header, drawn as an in-game HUD over a hazy doorway. The killfeed, score,
// money and ammo are all live GitHub numbers.

import { C, HUD, esc, r1, svg, textWidth, weaponFor } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const H = 440;

function isoWeek(dateText) {
  const d = new Date(`${dateText}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// The blurred backdrop: a corridor opening onto a lit archway.
const SCENE = `
<g filter="url(#dof)">
<rect width="${W}" height="200" fill="url(#sky)"/>
<rect x="560" y="138" width="300" height="194" fill="url(#farwall)"/>
<path d="M660 332V236A50 50 0 0 1 760 236V332Z" fill="url(#doorlight)"/>
<path d="M660 332V236A50 50 0 0 1 760 236V332" fill="none" stroke="#6b5a45" stroke-width="5"/>
<polygon points="0,64 560,138 560,332 0,${H}" fill="url(#wall)"/>
<polygon points="${W},52 860,138 860,332 ${W},${H}" fill="url(#wallR)"/>
<polygon points="0,${H} 560,332 860,332 ${W},${H}" fill="url(#floor)"/>
<g stroke="#2e2215" stroke-width="3" fill="#5c4630"><rect x="372" y="268" width="66" height="66"/><rect x="392" y="226" width="44" height="42"/><rect x="884" y="300" width="56" height="56"/></g>
<g stroke="#2e2215" stroke-width="2" opacity="0.8"><path d="M372 268l66 66M438 268l-66 66M884 300l56 56M940 300l-56 56"/></g>
<ellipse cx="710" cy="300" rx="190" ry="100" fill="url(#doorglow)"/>
</g>`;

// A T agent crossing the doorway, and the crosshair that keeps finding his head. The agent
// is drawn 76px tall with his feet on the doorway floor and his head at (0, -32).
const target = (icons) => `
<g transform="translate(710 300)">
<g class="agent">${icons.use('agent_t', -36.1, -41.6, 76, '#15120f')}</g>
<g class="crosshair">
<g stroke="#000" stroke-width="4" stroke-opacity="0.55"><path d="M-14 0H-5M5 0H14M0 -14V-5M0 5V14"/></g>
<g stroke="#46f04a" stroke-width="2"><path d="M-14 0H-5M5 0H14M0 -14V-5M0 5V14"/></g>
<circle r="1.4" fill="#46f04a"/>
</g>
<g class="hitmarker" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M-12 -12L-6 -6M12 -12L6 -6M-12 12L-6 6M12 12L6 6"/></g>
<g class="hs">${icons.use('headshot', -12, -84, 24, C.red)}</g>
</g>`;

function radar() {
  const teammates = [
    ['M40 72L40 24L96 30', 9],
    ['M24 112L64 104L72 70', 11],
    ['M110 44L112 92L80 118', 8],
  ]
    .map(([path, dur], i) => `<circle r="3.6" fill="${C.ct}" stroke="#0b0f14" stroke-width="1"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${path}" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" begin="-${i * 2}s"/></circle>`)
    .join('');
  return `
<g transform="translate(18 18)">
<rect width="146" height="146" rx="6" fill="#0b0f14" fill-opacity="0.82" stroke="#fff" stroke-opacity="0.18"/>
<g clip-path="url(#radarclip)">
<g fill="#2c3138"><rect x="14" y="62" width="118" height="22"/><rect x="30" y="10" width="22" height="126"/><rect x="88" y="16" width="46" height="40"/><rect x="10" y="98" width="46" height="36"/><rect x="100" y="84" width="22" height="50"/></g>
<text x="111" y="42" class="site">A</text><text x="33" y="122" class="site">B</text>
${teammates}
<circle cx="112" cy="36" r="3.6" fill="${C.red}" class="spotted"/>
<g transform="translate(73 73)"><path d="M0 -7L5 6L0 3L-5 6Z" fill="#fff" class="you"/></g>
</g>
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

  const pills = [
    { text: config.gaming.badge, level: config.gaming.level },
    { text: config.gaming.rank },
    { text: `${data.publicRepos} PUBLIC REPOS` },
  ];
  let x = 36;
  const badges = pills
    .map((p) => {
      const icon = p.level ? 26 : 0;
      const w = r1(textWidth(p.text, 11, 0.62) + 22 + icon);
      const out = `<g transform="translate(${r1(x)} 360)"><rect width="${w}" height="26" rx="13" fill="#000" fill-opacity="0.5" stroke="${p.level ? '#ff5500' : '#fff'}" stroke-opacity="${p.level ? 0.8 : 0.22}"/>${
        p.level ? `<circle cx="14" cy="13" r="9.5" fill="url(#level)"/><text x="14" y="17" text-anchor="middle" class="lvl">${p.level}</text>` : ''
      }<text x="${11 + icon}" y="17.5" class="pill">${esc(p.text)}</text></g>`;
      x += w + 8;
      return out;
    })
    .join('');

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
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141b24"/><stop offset="1" stop-color="#3a414b"/></linearGradient>
<linearGradient id="farwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#584b3b"/><stop offset="1" stop-color="#3d342a"/></linearGradient>
<linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#231e19"/><stop offset="1" stop-color="#40372c"/></linearGradient>
<linearGradient id="wallR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#1f1a16"/><stop offset="1" stop-color="#3a3128"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#524737"/><stop offset="1" stop-color="#241f19"/></linearGradient>
<linearGradient id="doorlight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d3a0"/><stop offset="1" stop-color="#b08555"/></linearGradient>
<radialGradient id="doorglow"><stop offset="0" stop-color="#f7b96a" stop-opacity="0.32"/><stop offset="1" stop-color="#f7b96a" stop-opacity="0"/></radialGradient>
<radialGradient id="vignette" cx="0.5" cy="0.48" r="0.72"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.82"/></radialGradient>
<linearGradient id="ctbox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4c7c"/><stop offset="1" stop-color="#172a47"/></linearGradient>
<linearGradient id="tbox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5424"/><stop offset="1" stop-color="#3a2d12"/></linearGradient>
<linearGradient id="level" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a1a"/><stop offset="1" stop-color="#e2150c"/></linearGradient>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#fff" fill-opacity="0.035"/></pattern>
<filter id="dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.8"/></filter>
<filter id="lift" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.7"/></filter>
<clipPath id="radarclip"><rect width="146" height="146" rx="6"/></clipPath>
<clipPath id="clockclip"><rect x="496" y="18" width="34" height="32"/></clipPath>`;

  const style = `
.site { font: 700 12px ${HUD}; fill: ${C.t}; }
.spotted { animation: blink 1.2s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.15; } }
.you { transform-box: fill-box; transform-origin: center; animation: look 6s ease-in-out infinite alternate; }
@keyframes look { from { transform: rotate(-35deg); } to { transform: rotate(40deg); } }
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
.lvl { font: 800 11px ${HUD}; fill: #fff; }
.hp { font: 700 30px ${HUD}; fill: ${C.white}; }
.weapon { font: 700 12px ${HUD}; letter-spacing: 1px; fill: ${C.dim}; }
.ammo { font: 700 30px ${HUD}; fill: ${C.white}; }
.reserve { font: 700 16px ${HUD}; fill: ${C.dim}; }
.caption { font: 600 10px ${HUD}; letter-spacing: 1px; fill: #fff; fill-opacity: 0.4; }
/* Every 6s the agent strafes across the doorway, the crosshair catches up: headshot. */
.agent { transform-box: fill-box; transform-origin: 50% 100%; animation: agent 6s ease-in-out infinite; }
@keyframes agent { 0% { transform: translateX(-34px); opacity: 1; } 42% { transform: translateX(30px); opacity: 1; } 46% { transform: translateX(30px) rotate(0deg); opacity: 1; } 56% { transform: translateX(34px) rotate(-78deg); opacity: 0; } 76% { transform: translateX(-34px); opacity: 0; } 82% { transform: translateX(-34px); opacity: 1; } 100% { transform: translateX(-34px); opacity: 1; } }
.crosshair { animation: aim 6s ease-in-out infinite; }
@keyframes aim { 0% { transform: translate(-12px, -26px); } 38% { transform: translate(24px, -28px); } 44% { transform: translate(30px, -32px); } 46% { transform: translate(30px, -41px); } 52% { transform: translate(30px, -32px); } 80% { transform: translate(-20px, -24px); } 100% { transform: translate(-12px, -26px); } }
.hitmarker { opacity: 0; animation: hit 6s linear infinite; }
@keyframes hit { 0%, 44% { opacity: 0; transform: translate(30px, -32px) scale(0.8); } 45% { opacity: 1; transform: translate(30px, -32px) scale(1); } 52% { opacity: 0; transform: translate(30px, -32px) scale(1.3); } 100% { opacity: 0; transform: translate(30px, -32px) scale(1.3); } }
.hs { opacity: 0; animation: hs 6s ease-out infinite; }
@keyframes hs { 0%, 45% { opacity: 0; transform: translate(30px, 0); } 47% { opacity: 1; transform: translate(30px, 0); } 62% { opacity: 0; transform: translate(30px, -26px); } 100% { opacity: 0; transform: translate(30px, -26px); } }
${card.css}
@media (prefers-reduced-motion: reduce) { .kill, .t0 { opacity: 1; } }`;

  const body = `
<rect width="${W}" height="${H}" fill="#0b0d10"/>
${SCENE}
${target(icons)}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
<rect width="${W}" height="${H}" fill="url(#scan)"/>
${radar()}
<text x="20" y="192" class="money">$${data.total.toLocaleString('en-US')}</text>
<text x="20" y="207" class="moneylabel">CONTRIBUTIONS · 12 MO</text>
${scoreBar(data)}
${killfeed(config, data, icons)}
${card.body}
${bottomHud(data, icons)}`;

  return svg(W, H, `${config.name}'s GitHub, drawn as a Counter-Strike 2 HUD: the killfeed is my latest GitHub activity`, defs + icons.defs(), style, body);
}
