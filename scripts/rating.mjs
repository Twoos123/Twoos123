// rating.svg: a year of contributions as a rating graph, with a tier-coloured plate for
// the total and end-of-match style stat tiles.

import { C, HUD, esc, r1, smooth, svg, textWidth } from './lib.mjs';

const W = 1000;
const H = 360;
// Plate colour by yearly contributions, in the style of competitive rating tiers.
const TIERS = [
  [250, '#b0c3d9'],
  [500, '#8cc6ff'],
  [1000, '#4b69ff'],
  [1500, '#8847ff'],
  [2000, '#d32ce6'],
  [3000, '#eb4b4b'],
  [Infinity, '#e4ae39'],
];

export function ratingSvg(config, data) {
  const tier = TIERS.find(([limit]) => data.total < limit)[1];
  const X0 = 300;
  const X1 = 966;
  const Y0 = 58;
  const Y1 = 208;
  const max = Math.max(...data.weeks.map((w) => w.count), 1);
  const points = data.weeks.map((w, i) => [X0 + ((X1 - X0) * i) / Math.max(data.weeks.length - 1, 1), Y1 - ((Y1 - Y0) * w.count) / max]);
  const line = smooth(points);
  const dots = points
    .filter((_, i) => i % 4 === 3 || i === points.length - 1)
    .map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="3" fill="${tier}"/>`)
    .join('');
  const [lx, ly] = points[points.length - 1];
  const grid = [0, 0.5, 1]
    .map((k) => {
      const y = r1(Y1 - (Y1 - Y0) * k);
      return `<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" class="grid"/><text x="${X0 - 8}" y="${y + 3}" text-anchor="end" class="axis">${Math.round(max * k)}</text>`;
    })
    .join('');
  const months = [];
  let lastMonth = -1;
  data.weeks.forEach((w, i) => {
    const month = new Date(`${w.start}T00:00:00Z`).getUTCMonth();
    if (month !== lastMonth && i > 0) months.push(`<text x="${r1(points[i][0])}" y="${Y1 + 16}" class="axis">${'JFMAMJJASOND'[month]}</text>`);
    lastMonth = month;
  });

  const busiest = new Date(`${data.busiest.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const top = data.languages[0];
  const tiles = [
    ['CURRENT STREAK', `${data.current}`, 'days'],
    ['LONGEST STREAK', `${data.longest}`, 'days'],
    ['BEST DAY', `${data.busiest.contributionCount}`, busiest],
    ['PULL REQUESTS', `${data.pullRequests}`, 'this year'],
    ['TOP LANGUAGE', top ? top.name : '—', top ? `${Math.round(top.share * 100)}% of code` : ''],
  ]
    .map(([label, value, sub], i) => {
      const x = 30 + i * 190;
      return `<g transform="translate(${x} 244)"><rect width="178" height="62" rx="4" fill="#fff" fill-opacity="0.04" stroke="#fff" stroke-opacity="0.07"/><text x="12" y="19" class="tlabel">${label}</text><text x="12" y="47" class="tvalue">${esc(value)}</text><text x="${r1(16 + textWidth(value, 22, 0.55))}" y="47" class="tsub">${esc(sub)}</text></g>`;
    })
    .join('');

  let bx = 30;
  const bar = data.languages
    .map((l) => {
      const w = Math.max(940 * l.share, 3);
      const seg = `<rect x="${r1(bx)}" y="322" width="${r1(w)}" height="6" fill="${l.color}"/>`;
      bx += w;
      return seg;
    })
    .join('');
  let kx = 30;
  const key = data.languages
    .map((l) => {
      const label = `${l.name} ${Math.round(l.share * 100)}%`;
      const out = `<circle cx="${kx + 4}" cy="343" r="3.5" fill="${l.color}"/><text x="${kx + 12}" y="347" class="lang">${esc(label)}</text>`;
      kx += textWidth(label, 11, 0.55) + 28;
      return out;
    })
    .join('');

  const defs = `
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11161d"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
<linearGradient id="area" x1="0" y1="${Y0}" x2="0" y2="${Y1}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${tier}" stop-opacity="0.35"/><stop offset="1" stop-color="${tier}" stop-opacity="0"/></linearGradient>
<linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tier}"/><stop offset="1" stop-color="${tier}" stop-opacity="0.55"/></linearGradient>
<clipPath id="barclip"><rect x="30" y="322" width="940" height="6" rx="3"/></clipPath>`;

  const style = `
.eyebrow { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.rating { font: italic 800 46px ${HUD}; fill: #fff; letter-spacing: 1px; }
.platelabel { font: 700 10px ${HUD}; letter-spacing: 2px; fill: ${C.dim}; }
.grid { stroke: #fff; stroke-opacity: 0.06; }
.axis { font: 600 10px ${HUD}; fill: ${C.dim}; fill-opacity: 0.8; }
.tlabel { font: 700 9px ${HUD}; letter-spacing: 1.6px; fill: ${C.dim}; }
.tvalue { font: 700 22px ${HUD}; fill: #fff; }
.tsub { font: 600 11px ${HUD}; fill: ${C.dim}; }
.lang { font: 600 11px ${HUD}; fill: #c7ced6; }
.now { transform-box: fill-box; transform-origin: center; animation: now 1.6s ease-in-out infinite; }
@keyframes now { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.8); opacity: 0; } }
.replay { animation: replay 7s linear infinite; }
@keyframes replay { 0% { opacity: 0; } 4%, 88% { opacity: 1; } 96%, 100% { opacity: 0; } }`;

  const value = data.total.toLocaleString('en-US');
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">RATING · LAST 12 MONTHS</text>
<g class="plate">
<path d="M46 76H236L222 146H32Z" fill="#000" fill-opacity="0.35"/>
<path d="M42 70H232L218 140H28Z" fill="url(#plate)"/>
<path d="M42 70H60L46 140H28Z" fill="#fff" fill-opacity="0.18"/>
<text x="130" y="122" text-anchor="middle" class="rating">${esc(value)}</text>
<text x="30" y="168" class="platelabel">CONTRIBUTIONS</text>
<text x="30" y="186" class="platelabel" fill-opacity="0.7">${data.thisWeek} THIS WEEK</text>
</g>
${grid}
${months.join('')}
<path d="${line}L${X1} ${Y1}L${X0} ${Y1}Z" fill="url(#area)" class="fill"/>
<path d="${line}" fill="none" stroke="${tier}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<g class="dots">${dots}<circle cx="${r1(lx)}" cy="${r1(ly)}" r="6" fill="none" stroke="${tier}" stroke-width="2" class="now"/></g>
<g class="replay"><circle r="4.5" fill="#fff"><animateMotion dur="7s" repeatCount="indefinite" path="${line}"/></circle><circle r="10" fill="${tier}" fill-opacity="0.35"><animateMotion dur="7s" repeatCount="indefinite" path="${line}"/></circle></g>
${tiles}
<g clip-path="url(#barclip)">${bar}</g>
${key}`;

  return svg(W, H, `${data.total} contributions in the last year, drawn as a rating graph`, defs, style, body);
}

