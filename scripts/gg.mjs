// gg.svg: the footer, an end-of-match banner that points to the portfolio.

import { C, HUD, esc, svg } from './lib.mjs';

const W = 1000;
const H = 170;

export function ggSvg(config, data) {
  const mvp = data.repos[0];
  const defs = `
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#172a47"/><stop offset="0.5" stop-color="#0c0f14"/><stop offset="1" stop-color="#3a2d12"/></linearGradient>
<linearGradient id="gg" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
<stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="#fff"/><stop offset="0.5" stop-color="#e4ae39"/><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff"/>
<animate attributeName="x1" values="-1;1" dur="4s" repeatCount="indefinite"/><animate attributeName="x2" values="0;2" dur="4s" repeatCount="indefinite"/>
</linearGradient>`;
  const style = `
.gg { font: italic 800 64px ${HUD}; letter-spacing: 4px; }
.cta { font: 700 17px ${HUD}; letter-spacing: 1px; fill: #fff; }
.sub { font: 600 11px ${HUD}; letter-spacing: 2px; fill: ${C.dim}; }
.bar { animation: bar 3s ease-in-out infinite alternate; }
@keyframes bar { from { opacity: 0.35; } to { opacity: 1; } }`;
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#fff" stroke-opacity="0.08"/>
<rect x="0" y="0" width="${W}" height="3" fill="${C.ct}" class="bar"/>
<rect x="${W / 2}" y="0" width="${W / 2}" height="3" fill="${C.t}" class="bar"/>
<text x="${W / 2}" y="84" text-anchor="middle" class="gg" fill="url(#gg)">GG WP</text>
<text x="${W / 2}" y="118" text-anchor="middle" class="cta">Queue up for the full match → ${esc(config.site)}</text>
<text x="${W / 2}" y="146" text-anchor="middle" class="sub">MVP THIS ROUND: ${esc(mvp.name.toUpperCase())} · EVERYTHING ABOVE REFRESHES DAILY FROM MY GITHUB</text>`;
  return svg(W, H, `GG WP. Visit ${config.site} for the full portfolio`, defs, style, body);
}
