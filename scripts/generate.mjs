// Draws the profile's animated SVGs from live GitHub data, CS2 style:
//   assets/hud.svg         header: an in-game HUD; the killfeed is my latest GitHub activity
//   assets/scoreboard.svg  my repos as the Tab scoreboard
//   assets/inventory.svg   my stack as weapon skins, with a case opening
//   assets/rating.svg      a year of contributions as a rating graph
//   assets/gg.svg          footer
//
// Run daily by .github/workflows/refresh.yml. Locally:
//   GITHUB_TOKEN=$(gh auth token) node scripts/generate.mjs
// No dependencies: Node 20+.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadData } from './data.mjs';
import { hudSvg } from './hud.mjs';
import { scoreboardSvg } from './scoreboard.mjs';
import { inventorySvg } from './inventory.mjs';
import { ratingSvg } from './rating.mjs';
import { ggSvg } from './gg.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('profile.config.json', root), 'utf8'));

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Set GITHUB_TOKEN (Actions provides it; locally use GITHUB_TOKEN=$(gh auth token)).');

const data = await loadData(config, token);
const out = new URL('assets/', root);
await mkdir(out, { recursive: true });
const files = {
  'hud.svg': hudSvg(config, data),
  'scoreboard.svg': scoreboardSvg(config, data),
  'inventory.svg': inventorySvg(config),
  'rating.svg': ratingSvg(config, data),
  'gg.svg': ggSvg(config),
};
for (const [name, content] of Object.entries(files)) await writeFile(new URL(name, out), content);
console.log(`Drew ${Object.keys(files).length} SVGs: ${data.total} contributions, ${data.feed.length} killfeed entries, ${data.repos.length} repos.`);
