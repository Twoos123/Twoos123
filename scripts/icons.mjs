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

function load(name) {
  if (cache.has(name)) return cache.get(name);
  let text = readFileSync(new URL(`${name}.svg`, DIR), 'utf8')
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
    // White parts take the colour given to each use of the icon.
    .replace(/(fill|stroke)="(#fff|#ffffff|white)"/gi, '$1="currentColor"');
  if (SOLID.has(name)) inner = inner.replace(/fill="none"/g, 'fill="currentColor"').replace(/stroke="#[0-9a-f]{3,6}"/gi, 'stroke="currentColor"');
  // Whitespace only: the coordinates keep their precision, because the outlines are drawn
  // in thousands of tiny relative steps and any rounding drifts them out of shape.
  inner = inner.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

  // Symbols nested inside the icon move out next to it.
  const nested = [];
  inner = inner.replace(/<symbol[\s\S]*?<\/symbol>/g, (s) => {
    nested.push(s);
    return '';
  });
  const icon = { viewBox, inner, nested: nested.join(''), ratio: vw / vh };
  cache.set(name, icon);
  return icon;
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
