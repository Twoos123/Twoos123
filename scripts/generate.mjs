// Draws the profile's animated SVGs from live GitHub data, CS2 style:
//   assets/hud.svg         header: an in-game HUD; the killfeed is my latest GitHub activity
//   assets/btn-*.svg       CS2-style link buttons (portfolio, resume, LinkedIn, email)
//   assets/about.svg       my experience as match history, from the portfolio's content
//   assets/loadout.svg     a case opening and my top skills as weapon skins (knives for my
//                          top languages)
//   assets/inventory.svg   every skill (the README keeps it folded away)
//   assets/rating.svg      a year of contributions as a CS Premier rating and graph
//   assets/scoreboard.svg  my repos as the Tab scoreboard (folded away too)
//   README.md              from README.template.md, with the resume link and the images'
//                          descriptions filled in
//
// Run daily by .github/workflows/refresh.yml. Locally:
//   GITHUB_TOKEN=$(gh auth token) node scripts/generate.mjs
// No dependencies: Node 20+.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadData } from './data.mjs';
import { hudSvg } from './hud.mjs';
import { buttonSvgs } from './buttons.mjs';
import { aboutSvg } from './about.mjs';
import { scoreboardSvg } from './scoreboard.mjs';
import { inventorySvg, loadoutSvg } from './inventory.mjs';
import { ratingSvg } from './rating.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('profile.config.json', root), 'utf8'));

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Set GITHUB_TOKEN (Actions provides it; locally use GITHUB_TOKEN=$(gh auth token)).');

const data = await loadData(config, token);
const out = new URL('assets/', root);
await mkdir(out, { recursive: true });
const about = aboutSvg(config, data);
const loadout = loadoutSvg(config, data);
const inventory = inventorySvg(config, data);
const rating = ratingSvg(config, data);
const files = {
  'hud.svg': hudSvg(config, data),
  ...buttonSvgs(config),
  'about.svg': about.svg,
  'loadout.svg': loadout.svg,
  'inventory.svg': inventory.svg,
  'rating.svg': rating.svg,
  'scoreboard.svg': scoreboardSvg(config, data),
};
for (const [name, content] of Object.entries(files)) await writeFile(new URL(name, out), content);

// The README, with the values that come from the portfolio filled in.
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const readme = (await readFile(new URL('README.template.md', root), 'utf8'))
  .replaceAll('{{resume_url}}', data.site.resumeUrl)
  .replaceAll('{{about_alt}}', escAttr(about.alt))
  .replaceAll('{{loadout_alt}}', escAttr(loadout.alt))
  .replaceAll('{{inventory_alt}}', escAttr(inventory.alt))
  .replaceAll('{{skill_count}}', String(inventory.count))
  .replaceAll('{{rating_alt}}', escAttr(rating.alt));
await writeFile(new URL('README.md', root), readme);
console.log(`Drew ${Object.keys(files).length} SVGs: ${data.total} contributions, ${data.feed.length} killfeed entries, ${data.repos.length} repos.`);
