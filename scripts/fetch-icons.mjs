// Copies the CS2 icons the profile uses into icons/, from Juknum/counter-strike-icons (SVGs
// extracted from the game's files) at a pinned commit, so the daily refresh never depends
// on that repo. Run again, with a newer COMMIT, to update them:
//   node scripts/fetch-icons.mjs
// The icons are the property of Valve Corporation; see icons/SOURCE.md.

import { mkdir, writeFile } from 'node:fs/promises';

const REPO = 'Juknum/counter-strike-icons';
const COMMIT = 'd4c2d8cad26f8fd3eba09b104ef10f26748ff629';
const BASE = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/cs2/panorama/images`;

const EQUIPMENT = [
  'ak47', 'awp', 'm4a1_silencer', 'm4a1', 'deagle', 'ssg08', 'aug', 'usp_silencer', 'galilar', 'famas',
  'mp9', 'mac10', 'p90', 'ump45', 'glock', 'p250', 'mp7', 'fiveseven', 'cz75a',
  'nova', 'xm1014', 'mag7', 'negev', 'm249', 'sawedoff', 'knife_karambit',
];
const FILES = {
  ...Object.fromEntries(EQUIPMENT.map((name) => [name, `icons/equipment/${name}.svg`])),
  headshot: 'hud/deathnotice/icon_headshot.svg',
  penetrate: 'hud/deathnotice/penetrate.svg',
  noscope: 'hud/deathnotice/noscope.svg',
  health_cross: 'hud/health_cross.svg',
  armor_helmet: 'hud/armor_helmet.svg',
  ct_logo: 'icons/ct_logo.svg',
  t_logo: 'icons/t_logo.svg',
  agent_t: 'econ/characters/local_agent_t.svg',
};

const out = new URL('../icons/', import.meta.url);
await mkdir(out, { recursive: true });
for (const [name, path] of Object.entries(FILES)) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  const text = await res.text();
  if (!text.includes('<svg')) throw new Error(`${path}: not an SVG`);
  await writeFile(new URL(`${name}.svg`, out), text);
}
await writeFile(
  new URL('SOURCE.md', out),
  `# CS2 icons

These SVGs are Counter-Strike 2 game assets, the property of **Valve Corporation**, used here
for a non-commercial, community profile. They were extracted from the game's files by
[${REPO}](https://github.com/${REPO}) (commit \`${COMMIT.slice(0, 7)}\`) and copied by
\`scripts/fetch-icons.mjs\`. Counter-Strike® is a registered trademark of Valve Corporation.
`
);
console.log(`Copied ${Object.keys(FILES).length} icons from ${REPO}@${COMMIT.slice(0, 7)}.`);
