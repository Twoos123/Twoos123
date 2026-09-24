// The real CS2 icons in icons/ (see scripts/fetch-icons.mjs), embedded into the generated
// SVGs as <symbol>s: an SVG shown as an <img> can't load other files.
//
//   const icons = iconSet();
//   body += icons.use('ak47', x, y, 24, '#fff');   // 24px tall, white
//   defs += icons.defs();                          // only the icons that were used

import { readFileSync } from 'node:fs';

const DIR = new URL('../icons/', import.meta.url);
const cache = new Map();
// Icons drawn in the game as outlines, used here as solid silhouettes.
const SOLID = new Set(['agent_t']);

// Adds an SVG from elsewhere (e.g. a company logo fetched from the portfolio) under `name`.
export function registerIcon(name, text) {
  cache.set(name, parse(name, text));
}

function load(name) {
  if (!cache.has(name)) cache.set(name, parse(name, readFileSync(new URL(`${name}.svg`, DIR), 'utf8')));
  return cache.get(name);
}

function parse(name, source) {
  let text = source
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '');
  const root = text.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  if (!root) throw new Error(`${name}.svg: no <svg> element`);
  const attrs = root[1];
  let viewBox = (attrs.match(/viewBox="([^"]+)"/) || [])[1];
  if (!viewBox) {
    const w = parseFloat((attrs.match(/width="([\d.]+)/) || [])[1]);
    const h = parseFloat((attrs.match(/height="([\d.]+)/) || [])[1]);
    viewBox = `0 0 ${w} ${h}`;
  }
  const [, , vw, vh] = viewBox.split(/[\s,]+/).map(Number);

  const prefix = `i-${name}-`;
  let inner = root[2]
    .replace(/\s(enable-background|xml:space|version|clip-rule)="[^"]*"/g, '')
    // Unique ids, so two icons (or two copies) never clash.
    .replace(/\sid="([^"]+)"/g, ` id="${prefix}$1"`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, `href="#${prefix}$2"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    // White parts take the colour given to each use of the icon (but not inside masks,
    // where white means "visible").
    .replace(/<mask[\s\S]*?<\/mask>|(fill|stroke)="(#fff|#ffffff|white)"/gi, (m, attr) => (attr ? `${attr}="currentColor"` : m));
  if (SOLID.has(name)) inner = inner.replace(/fill="none"/g, 'fill="currentColor"').replace(/stroke="#[0-9a-f]{3,6}"/gi, 'stroke="currentColor"');
  inner = inner.replace(/\sd="([^"]+)"/g, (m, d) => ` d="${compactPath(d, digits(vw, vh))}"`);
  inner = inner.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

  // Symbols nested inside the icon move out next to it.
  const nested = [];
  inner = inner.replace(/<symbol[\s\S]*?<\/symbol>/g, (s) => {
    nested.push(s);
    return '';
  });
  return { viewBox, inner, nested: nested.join(''), ratio: vw / vh };
}

// Decimals worth keeping for an icon: steps of about a thousandth of its size (one decimal
// for the weapons' ~90-unit boxes), well under a pixel at the sizes they're drawn here.
const digits = (vw, vh) => Math.max(0, Math.min(3, Math.ceil(Math.log10(1000 / Math.max(vw, vh, 1)) - 1)));

// Rewrites a path with fewer decimals. The icons are drawn in thousands of tiny relative
// steps, so each point is rounded from its exact absolute position and written relative to
// the previous *rounded* point: the rounding never adds up and drifts the outline. Paths with
// arcs (whose flags need their own parsing) are left as they are.
function compactPath(d, places) {
  if (/[aA]/.test(d)) return d;
  const tokens = d.match(/[MmLlHhVvCcSsQqTtZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
  const f = 10 ** places;
  const q = (n) => Math.round(n * f) / f;
  const fmt = (n) => {
    const s = String(q(n) || 0);
    return s.replace(/^(-?)0\./, '$1.');
  };
  let i = 0;
  let cmd = '';
  let cx = 0, cy = 0, sx = 0, sy = 0; // the exact current point and subpath start
  let ex = 0, ey = 0, esx = 0, esy = 0; // the same, as written (rounded)
  let out = '';
  let last = '';
  const write = (letter, nums) => {
    let s = letter === last && letter !== 'm' ? '' : letter;
    nums.forEach((n, k) => {
      const t = fmt(n);
      s += (k === 0 && s) || t.startsWith('-') ? t : ` ${t}`;
    });
    out += s;
    last = letter;
  };
  const isCmd = (t) => /^[A-Za-z]$/.test(t);
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++];
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'Z') {
      [cx, cy, ex, ey] = [sx, sy, esx, esy];
      out += 'z';
      last = 'z';
      continue;
    }
    const [ox, oy] = [cx, cy];
    const point = () => {
      const x = num();
      const y = num();
      return rel ? [x + ox, y + oy] : [x, y];
    };
    let pts;
    if (C === 'H') pts = [[rel ? num() + ox : num(), oy]];
    else if (C === 'V') pts = [[ox, rel ? num() + oy : num()]];
    else pts = Array.from({ length: { M: 1, L: 1, T: 1, S: 2, Q: 2, C: 3 }[C] }, point);
    const [ax, ay] = [ex, ey];
    const rounded = pts.map(([x, y]) => [q(x), q(y)]);
    const [endX, endY] = rounded[rounded.length - 1];
    if (C === 'H') write('h', [endX - ax]);
    else if (C === 'V') write('v', [endY - ay]);
    else write(C === 'M' ? 'm' : C.toLowerCase(), rounded.flatMap(([x, y]) => [x - ax, y - ay]));
    [cx, cy] = pts[pts.length - 1];
    [ex, ey] = [endX, endY];
    if (C === 'M') [sx, sy, esx, esy] = [cx, cy, ex, ey];
  }
  return out;
}

export function iconSet() {
  const used = new Set();
  const r1 = (n) => Math.round(n * 10) / 10;
  return {
    width: (name, height) => height * load(name).ratio,
    use(name, x, y, height, color = '#fff', attrs = '') {
      const icon = load(name);
      used.add(name);
      return `<use href="#i-${name}" x="${r1(x)}" y="${r1(y)}" width="${r1(height * icon.ratio)}" height="${r1(height)}" style="color:${color}" ${attrs}/>`;
    },
    defs() {
      return [...used]
        .map((name) => {
          const icon = load(name);
          return `${icon.nested}<symbol id="i-${name}" viewBox="${icon.viewBox}">${icon.inner}</symbol>`;
        })
        .join('\n');
    },
  };
}
