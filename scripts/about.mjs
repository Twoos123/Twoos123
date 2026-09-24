// about.svg: the "about me" as a player card. Player info (education plus the portfolio's
// "currently" rows), a match history of my roles with the company logos, and a matchmaking
// bar for what I'm looking for (the portfolio's "incoming" experience entry). All of it comes
// from the portfolio's content, so editing it on asadbinali.com updates this too.

import { C, HUD, esc, svg } from './lib.mjs';
import { iconSet, registerIcon } from './icons.mjs';

const W = 1000;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// The end of a "May 2026 - Aug 2026" or "Apr 2024 - Present" period, as a Date (or null).
function periodEnd(period) {
  const end = String(period).split(/\s[-–]\s/).pop().trim().toLowerCase();
  if (end.startsWith('present')) return new Date(8.64e15);
  const [month, year] = end.split(/\s+/);
  const m = MONTHS.indexOf(month.slice(0, 3));
  return m === -1 || !year ? null : new Date(Date.UTC(Number(year), m + 1, 0));
}

// Fits text to a width by trimming it with an ellipsis.
function fit(text, width, size, factor = 0.52) {
  const max = Math.floor(width / (size * factor));
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function aboutSvg(config, data) {
  const icons = iconSet();
  const { experience, currently, logos } = data.site;
  // Ids must stay plain: they end up in url(#...) references inside the logos.
  const logoName = (file) => `logo-${file.replace(/[^a-z0-9]/gi, '_')}`;
  for (const [file, text] of Object.entries(logos)) registerIcon(logoName(file), text);
  const now = new Date(`${data.today}T00:00:00Z`);

  // Player info: education, the "currently" rows, and the first volunteer role as my clan.
  const clan = experience.find((e) => e.kind === 'volunteer');
  const info = [
    ['EDUCATION', config.education],
    ...currently.map((row) => [row.label.toUpperCase(), row.value]),
    ...(clan ? [['CLAN', `${clan.org} · ${clan.role}`]] : []),
  ];
  const infoRows = info
    .map(([label, value], i) => {
      const y = 170 + i * 34;
      return `<g><rect x="30" y="${y - 20}" width="470" height="28" rx="3" fill="#fff" fill-opacity="${i % 2 ? 0.02 : 0.045}"/><text x="42" y="${y - 1}" class="label">${esc(label)}</text><text x="128" y="${y}" class="value">${esc(fit(value, 364, 13, 0.5))}</text></g>`;
    })
    .join('\n');

  // Match history: work roles, newest first, with the role in progress marked live.
  const jobs = experience.filter((e) => e.kind === 'work').slice(0, 6);
  const matchRows = jobs
    .map((job, i) => {
      const y = 150 + i * 50;
      const file = (job.logo || '').split('?')[0];
      const end = periodEnd(job.period);
      const live = end && end >= now;
      let logo = '';
      // Logos drawn in white (for dark backgrounds, like 8x8's) get a dark tile.
      const whiteLogo = file && logos[file] && /fill="(#fff|#ffffff|white)"/i.test(logos[file].replace(/<mask[\s\S]*?<\/mask>/g, ''));
      if (file && logos[file]) {
        // As large as fits a 40x28 box, centred in the tile.
        const name = logoName(file);
        const ratio = icons.width(name, 1);
        const h = Math.min(28, 40 / ratio);
        logo = icons.use(name, 550 - (h * ratio) / 2, y + 22 - h / 2, h, '#fff');
      }
      const chip = live
        ? `<g transform="translate(922 ${y + 22})"><rect width="46" height="18" rx="3" fill="${C.red}" fill-opacity="0.18" stroke="${C.red}" stroke-opacity="0.8"/><circle cx="10" cy="9" r="3" fill="${C.red}" class="live"/><text x="17" y="13.2" class="chip" fill="#ffb3ad">LIVE</text></g>`
        : `<g transform="translate(944 ${y + 22})"><rect width="24" height="18" rx="3" fill="#3ecf6e" fill-opacity="0.16" stroke="#3ecf6e" stroke-opacity="0.7"/><text x="12" y="13.2" text-anchor="middle" class="chip" fill="#8ff0ac">W</text></g>`;
      return `<g>
<rect x="520" y="${y}" width="450" height="44" rx="4" fill="#fff" fill-opacity="${live ? 0.07 : 0.035}" stroke="#fff" stroke-opacity="${live ? 0.14 : 0.05}"/>
<rect x="526" y="${y + 4}" width="48" height="36" rx="4" fill="${whiteLogo ? '#1f2630' : '#f2f4f7'}" stroke="#fff" stroke-opacity="${whiteLogo ? 0.15 : 0}"/>
${logo}
<text x="586" y="${y + 19}" class="org">${esc(job.org)}</text>
<text x="586" y="${y + 36}" class="role">${esc(fit(job.role, 300, 11.5))}</text>
<text x="966" y="${y + 16}" text-anchor="end" class="period">${esc(job.period)}</text>
${chip}
</g>`;
    })
    .join('\n');

  const contentBottom = Math.max(170 + info.length * 34 - 14, 150 + jobs.length * 50);
  const incoming = experience.find((e) => e.kind === 'incoming');
  const barY = contentBottom + 18;
  const H = (incoming ? barY + 76 : contentBottom) + 26;

  // The matchmaking bar: spinner, what I'm looking for, and a search timer that ticks up. The
  // seconds roll inside a clip that ends well short of the bar's edge, since GitHub's font may
  // run wider than ours.
  const seconds = Array.from({ length: 60 }, (_, i) => `<text x="918" y="${barY + 44 + i * 28}" class="timer">${String(i).padStart(2, '0')}</text>`).join('');
  const searching = incoming
    ? `<g>
<rect x="30" y="${barY}" width="940" height="76" rx="6" fill="url(#search)" stroke="#3ecf6e" stroke-opacity="0.45"/>
<rect x="30" y="${barY}" width="4" height="76" rx="2" fill="#3ecf6e"/>
<g transform="translate(66 ${barY + 38})"><circle r="13" fill="none" stroke="#3ecf6e" stroke-opacity="0.2" stroke-width="3"/><circle r="13" fill="none" stroke="#3ecf6e" stroke-width="3" stroke-dasharray="22 60" stroke-linecap="round" class="spin"/></g>
<text x="96" y="${barY + 25}" class="searching">SEARCHING FOR A TEAM<tspan class="dots">…</tspan></text>
<text x="96" y="${barY + 47}" class="want">${esc(incoming.role)}</text>
<text x="96" y="${barY + 66}" class="where">${esc(fit(`${incoming.period} · ${incoming.location}`, 720, 12))}</text>
<text x="916" y="${barY + 44}" text-anchor="end" class="timer">00:</text>
<g clip-path="url(#timerclip)"><g class="tick">${seconds}</g></g>
</g>`
    : '';

  const defs = `
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11161d"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
<linearGradient id="search" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#143522"/><stop offset="1" stop-color="#0c1a12"/></linearGradient>
<clipPath id="timerclip"><rect x="916" y="${barY + 20}" width="36" height="32"/></clipPath>`;

  const style = `
.eyebrow { font: 700 11px ${HUD}; letter-spacing: 3px; fill: ${C.dim}; }
.heading { font: 700 26px ${HUD}; fill: #fff; letter-spacing: 0.5px; }
.section { font: 700 10px ${HUD}; letter-spacing: 2.4px; fill: ${C.dim}; }
.label { font: 700 9.5px ${HUD}; letter-spacing: 1.6px; fill: ${C.dim}; }
.value { font: 600 13px ${HUD}; fill: #fff; }
.org { font: 700 14px ${HUD}; fill: #fff; }
.role { font: 600 11.5px ${HUD}; fill: ${C.dim}; }
.period { font: 600 11px ${HUD}; fill: ${C.dim}; }
.chip { font: 800 10px ${HUD}; letter-spacing: 1px; }
.live { animation: live 1.2s ease-in-out infinite alternate; }
@keyframes live { from { opacity: 0.35; } to { opacity: 1; } }
.searching { font: 800 11px ${HUD}; letter-spacing: 2.4px; fill: #7ee89a; }
.dots { animation: dots 1.4s steps(2) infinite; }
@keyframes dots { 50% { opacity: 0; } }
.want { font: 700 16px ${HUD}; fill: #fff; }
.where { font: 600 12px ${HUD}; fill: #b9d9c3; }
.spin { transform-box: fill-box; transform-origin: center; animation: spin 1.1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.timer { font: 700 22px ${HUD}; fill: #d9f7e2; }
.tick { animation: tick 60s steps(60) infinite; }
@keyframes tick { to { transform: translateY(-1680px); } }`;

  // The banner above already says who I am, so the card goes straight to the details.
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<text x="30" y="40" class="eyebrow">PLAYER CARD</text>
<text x="30" y="70" class="heading">About me</text>
<text x="30" y="132" class="section">PLAYER INFO</text>
<text x="520" y="132" class="section">MATCH HISTORY</text>
${infoRows}
${matchRows}
${searching}`;

  const alt = [
    `${config.name}. ${config.education}.`,
    ...currently.map((row) => `${row.label}: ${row.value}.`),
    incoming ? `Looking for: ${incoming.role}, ${incoming.period}, ${incoming.location}.` : '',
    `Experience: ${jobs.map((j) => `${j.org} (${j.role}, ${j.period})`).join('; ')}.`,
  ].join(' ');
  return { svg: svg(W, H, alt, defs + icons.defs(), style, body), alt };
}
