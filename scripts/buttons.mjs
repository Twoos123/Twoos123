// btn-*.svg: CS2 menu-style buttons for the README's links. Each is its own image because a
// README image can only link to one place.

import { C, HUD, esc, svg } from './lib.mjs';

const W = 200;
const H = 56;

const ICONS = {
  portfolio: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12H21M12 3C9 6 9 18 12 21M12 3C15 6 15 18 12 21" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  resume: '<path d="M6 2.5H14L19 7.5V21.5H6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 2.5V7.5H19M9 12H16M9 15.5H16M9 19H13" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V17M8 7.2V7.3M11.5 17V10.5M11.5 13.2C11.5 11.5 12.8 10.4 14.2 10.4C15.7 10.4 16.5 11.4 16.5 13V17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  email: '<rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 6.5L12 13L21 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
};

function button(kind, label, sub, accent) {
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2029"/><stop offset="1" stop-color="#0d1117"/></linearGradient>`;
  const style = `
.label { font: 800 14px ${HUD}; letter-spacing: 1.8px; fill: #fff; }
.sub { font: 600 10.5px ${HUD}; letter-spacing: 0.4px; fill: ${C.dim}; }
.glow { animation: glow 2.8s ease-in-out infinite alternate; }
@keyframes glow { from { opacity: 0.55; } to { opacity: 1; } }`;
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" fill="none" stroke="#fff" stroke-opacity="0.12"/>
<rect x="0" y="0" width="4" height="${H}" fill="${accent}" class="glow"/>
<g transform="translate(18 16)" style="color:${accent}">${ICONS[kind]}</g>
<text x="54" y="26" class="label">${esc(label)}</text>
<text x="54" y="42" class="sub">${esc(sub)}</text>`;
  return svg(W, H, label, defs, style, body, 6);
}

export function buttonSvgs(config) {
  return {
    'btn-portfolio.svg': button('portfolio', 'PORTFOLIO', config.site, C.ct),
    'btn-resume.svg': button('resume', 'RESUME', 'PDF · Google Drive', '#e4ae39'),
    'btn-linkedin.svg': button('linkedin', 'LINKEDIN', config.links.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com/, '').replace(/\/$/, ''), '#0a66c2'),
    'btn-email.svg': button('email', 'EMAIL', config.links.email, C.t),
  };
}
