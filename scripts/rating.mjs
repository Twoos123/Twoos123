// rating.svg: a year of contributions as a CS Rating: a Premier-style rating badge coloured by
// its band (see premier() in lib.mjs), a rating graph in the same colour, and end-of-match
// style stat tiles.

import { C, HUD, PREMIER, RATING_PER_CONTRIBUTION, esc, premier, r1, smooth, svg, textWidth } from './lib.mjs';

const W = 1000;
const H = 360;

// A colour mixed toward white, for the badge's number (the game brightens it the same way).
function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0].map((shift) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * amount).toString(16).padStart(2, '0')).join('')}`;
}

// The rating split as the game shows it: thousands large, ",XXX" smaller.
function ratingParts(rating) {
  const major = Math.floor(rating / 1000);
  return major ? [String(major), `,${String(rating % 1000).padStart(3, '0')}`] : ['', String(rating)];
}

export function ratingSvg(config, data) {
  const band = premier(data.total);
  const tier = band.color;
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
    ['TOP LANGUAGE', top ? top.name : '—', top ? `${Math.round(top.share * 100)}%` : ''],
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
<linearGradient id="wash" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${tier}" stop-opacity="0.6"/><stop offset="1" stop-color="${tier}" stop-opacity="0.12"/></linearGradient>
<filter id="numshadow" x="-10%" y="-20%" width="120%" height="140%"><feDropShadow dx="1.5" dy="1.5" stdDeviation="0.6" flood-color="#000" flood-opacity="0.9"/></filter>
<clipPath id="barclip"><rect x="30" y="322" width="940" height="6" rx="3"/></clipPath>`;

  const style = `
.eyebrow { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.rating { font-family: ${HUD}; font-style: italic; font-weight: 800; }
.major { font-size: 46px; letter-spacing: 0.5px; }
.minor { font-size: 32px; letter-spacing: 1px; }
.band { font: 800 11px ${HUD}; letter-spacing: 2.4px; }
.platelabel { font: 700 10px ${HUD}; letter-spacing: 1.6px; fill: ${C.dim}; }
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

  // The badge: a slanted plate washed in the band's colour, three stripes at its leading edge,
  // and the rating in the band's colour, brightened.
  const [major, minor] = ratingParts(band.rating);
  const stripes = [0.95, 0.65, 0.4].map((opacity, i) => `<path d="M${46 + i * 11} 66H${53 + i * 11}L${37 + i * 11} 136H${30 + i * 11}Z" fill="${tier}" fill-opacity="${opacity}"/>`).join('');
  // The bands as a ladder, with a marker for how far through this one I am.
  const ladder = PREMIER.map((b, i) => `<rect x="${30 + i * 33}" y="194" width="30" height="5" rx="1.5" fill="${b.color}" fill-opacity="${i === band.tier ? 1 : i < band.tier ? 0.45 : 0.15}"/>`).join('');
  const markerX = r1(30 + band.tier * 33 + band.progress * 30);
  const next = band.next ? `${band.next.contributions} MORE TO <tspan fill="${band.next.color}">${band.next.name.toUpperCase()}</tspan>` : 'TOP BAND';
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">CS RATING · LAST 12 MONTHS</text>
<g class="plate">
<path d="M50 72H256L240 142H34Z" fill="#000" fill-opacity="0.4"/>
<path d="M46 66H252L236 136H30Z" fill="#0d1117"/>
<path d="M46 66H252L236 136H30Z" fill="url(#wash)" stroke="${tier}" stroke-opacity="0.55" stroke-width="1.2"/>
${stripes}
<text x="226" y="118" text-anchor="end" class="rating" fill="${lighten(tier, 0.35)}" filter="url(#numshadow)"><tspan class="major">${esc(major)}</tspan><tspan class="minor">${esc(minor)}</tspan></text>
<text x="30" y="164" class="band" fill="${tier}">${esc(band.name.toUpperCase())}</text>
<text x="30" y="182" class="platelabel">${data.total.toLocaleString('en-US')} CONTRIBUTIONS × ${RATING_PER_CONTRIBUTION}</text>
${ladder}
<path d="M${markerX - 4} 208L${markerX} 202L${markerX + 4} 208Z" fill="#fff"/>
<text x="30" y="226" class="platelabel" fill-opacity="0.8">${next}</text>
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

  const alt = `${data.total} contributions in the last year as a CS Premier rating of ${band.rating.toLocaleString('en-US')} (${band.name} band), with a graph of my contributions week by week, my streaks, my best day, my pull requests and my top languages.`;
  return { svg: svg(W, H, alt, defs, style, body), alt };
}

