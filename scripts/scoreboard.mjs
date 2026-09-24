// scoreboard.svg: my repos as the Tab scoreboard. Two teams by language, kills = commits,
// assists = stars, ping = days since the last push, and the top scorer is MVP.

import { C, HUD, esc, svg } from './lib.mjs';
import { iconSet } from './icons.mjs';

const W = 1000;
const WEB = new Set(['TypeScript', 'JavaScript', 'HTML', 'CSS', 'SCSS', 'Vue', 'Svelte', 'Astro']);
const ROW = 32;
const PER_TEAM = 5;

const score = (repo) => repo.commits + 25 * repo.stars;

function team(icons, logo, repos, x, y, title, color, text, bar) {
  const rows = repos
    .map((repo, i) => {
      const top = y + 46 + i * ROW;
      const mvp = i === 0;
      return `<g>
<rect x="${x}" y="${top}" width="940" height="${ROW - 3}" fill="${mvp ? color : '#fff'}" fill-opacity="${mvp ? 0.14 : i % 2 ? 0.025 : 0.05}"/>
<rect x="${x}" y="${top}" width="3" height="${ROW - 3}" fill="${color}"/>
<circle cx="${x + 22}" cy="${top + 14.5}" r="5" fill="${repo.color}"/>
<text x="${x + 38}" y="${top + 19.5}" class="player">${esc(repo.name)}</text>
<text x="${x + 380}" y="${top + 19.5}" class="lang">${esc(repo.language)}</text>
<text x="${x + 590}" y="${top + 19.5}" text-anchor="end" class="num">${repo.commits}</text>
<text x="${x + 670}" y="${top + 19.5}" text-anchor="end" class="num">${repo.stars}</text>
<text x="${x + 760}" y="${top + 19.5}" text-anchor="end" class="num dim">${repo.days}d</text>
${mvp ? `<text x="${x + 830}" y="${top + 20}" text-anchor="middle" class="mvp">★</text>` : ''}
<text x="${x + 925}" y="${top + 19.5}" text-anchor="end" class="num strong">${score(repo)}</text>
</g>`;
    })
    .join('\n');
  const total = repos.reduce((sum, r) => sum + r.commits, 0);
  return `
<rect x="${x}" y="${y}" width="940" height="38" fill="url(#${bar})"/>
${icons.use(logo, x + 8, y + 5, 28)}
<text x="${x + 46}" y="${y + 25}" class="team" fill="${text}">${title}</text>
<text x="${x + 925}" y="${y + 27}" text-anchor="end" class="teamscore" fill="${text}">${total}</text>
<text x="${x + 870}" y="${y + 24}" text-anchor="end" class="small" fill="${text}">COMMITS</text>
${rows}`;
}

export function scoreboardSvg(config, data) {
  const icons = iconSet();
  const ranked = [...data.repos].sort((a, b) => score(b) - score(a));
  const web = ranked.filter((r) => WEB.has(r.language)).slice(0, PER_TEAM);
  const systems = ranked.filter((r) => !WEB.has(r.language)).slice(0, PER_TEAM);
  const yWeb = 92;
  const ySys = yWeb + 46 + web.length * ROW + 22;
  const H = ySys + 46 + systems.length * ROW + 48;

  const defs = `
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11161d"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
<linearGradient id="ctbar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2d4c7c"/><stop offset="1" stop-color="#2d4c7c" stop-opacity="0.15"/></linearGradient>
<linearGradient id="tbar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b5424"/><stop offset="1" stop-color="#6b5424" stop-opacity="0.15"/></linearGradient>`;

  const style = `
.map { font: 700 26px ${HUD}; fill: #fff; letter-spacing: 1px; }
.mapsub { font: 700 10px ${HUD}; letter-spacing: 2.4px; fill: ${C.dim}; }
.head { font: 700 10px ${HUD}; letter-spacing: 1.8px; fill: ${C.dim}; }
.team { font: 700 15px ${HUD}; letter-spacing: 2px; }
.teamscore { font: 700 24px ${HUD}; }
.small { font: 700 9px ${HUD}; letter-spacing: 1.6px; opacity: 0.8; }
.player { font: 700 15px ${HUD}; fill: ${C.white}; }
.lang { font: 600 12px ${HUD}; fill: ${C.dim}; }
.num { font: 700 15px ${HUD}; fill: #d7dde4; }
.num.dim { fill: ${C.dim}; }
.num.strong { fill: #fff; }
.mvp { font: 700 17px ${HUD}; fill: #e4ae39; transform-box: fill-box; transform-origin: center; animation: mvp 2.4s ease-in-out infinite alternate; }
@keyframes mvp { from { opacity: 0.6; transform: scale(0.9); } to { opacity: 1; transform: scale(1.15); } }
.legend { font: 600 10px ${HUD}; letter-spacing: 1px; fill: #fff; fill-opacity: 0.4; }
`;

  const cols = (y) => `
<text x="68" y="${y}" class="head">REPO</text>
<text x="410" y="${y}" class="head">LANGUAGE</text>
<text x="620" y="${y}" text-anchor="end" class="head">K</text>
<text x="700" y="${y}" text-anchor="end" class="head">A</text>
<text x="790" y="${y}" text-anchor="end" class="head">PING</text>
<text x="860" y="${y}" text-anchor="middle" class="head">MVP</text>
<text x="955" y="${y}" text-anchor="end" class="head">SCORE</text>`;

  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="46" class="map">de_github</text>
<text x="30" y="66" class="mapsub">SCOREBOARD · ${data.publicRepos} PUBLIC REPOS · TOP ${PER_TEAM} PER TEAM</text>
${cols(84)}
${team(icons, 'ct_logo', web, 30, yWeb, 'COUNTER-TERRORISTS · WEB', C.ct, C.ctText, 'ctbar')}
${team(icons, 't_logo', systems, 30, ySys, 'TERRORISTS · SYSTEMS &amp; DATA', C.t, C.tText, 'tbar')}
<text x="30" y="${H - 18}" class="legend">K = COMMITS · A = STARS · PING = DAYS SINCE LAST PUSH · SCORE = K + 25 × A</text>`;

  return svg(W, H, `${config.name}'s repositories as a scoreboard: commits, stars and days since the last push`, defs + icons.defs(), style, body);
}
