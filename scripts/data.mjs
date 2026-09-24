// Live data for the profile: repositories, the contribution calendar and recent public
// activity (for the killfeed) from GitHub, plus my experience, "currently" rows, resume link
// and company logos from the portfolio's content, so edits made on asadbinali.com show up
// here too.

const QUERY = `query($login: String!) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes {
        name
        stargazerCount
        pushedAt
        isArchived
        primaryLanguage { name color }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
        defaultBranchRef { target { ... on Commit { history { totalCount } } } }
      }
    }
    contributionsCollection {
      totalPullRequestContributions
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
    }
  }
}`;

const headers = (token) => ({ Authorization: `bearer ${token}`, 'User-Agent': 'profile-hud', Accept: 'application/vnd.github+json' });

async function graphql(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub GraphQL: ${res.status} ${JSON.stringify(json.errors || json.message)}`);
  return json.data.user;
}

async function events(login, token) {
  const res = await fetch(`https://api.github.com/users/${login}/events/public?per_page=100`, { headers: headers(token) });
  if (!res.ok) return [];
  return res.json();
}

// Recent activity as killfeed entries, newest first, with one push entry per repo.
function killfeed(list, login) {
  const out = [];
  for (const e of list) {
    const repo = e.repo.name.startsWith(`${login}/`) ? e.repo.name.slice(login.length + 1) : e.repo.name;
    const p = e.payload || {};
    let entry = null;
    if (e.type === 'PushEvent') {
      const commits = p.size ?? p.distinct_size ?? (Array.isArray(p.commits) ? p.commits.length : null);
      // One push entry per repo (GitHub no longer reports commit counts, so pushes can't
      // be summed into one "×N" line anyway); older pushes add to the newest one's count.
      const earlier = out.find((x) => x.kind === 'push' && x.repo === repo);
      if (earlier) {
        if (commits != null) earlier.count = (earlier.count || 0) + commits;
        continue;
      }
      entry = { kind: 'push', repo, count: commits };
    } else if (e.type === 'PullRequestEvent' && p.action === 'closed' && p.pull_request?.merged) {
      entry = { kind: 'merge', repo, detail: `PR #${p.number ?? p.pull_request.number}` };
    } else if (e.type === 'PullRequestEvent' && p.action === 'opened') {
      entry = { kind: 'pr', repo, detail: `PR #${p.number ?? p.pull_request?.number}` };
    } else if (e.type === 'CreateEvent' && p.ref_type === 'repository') {
      entry = { kind: 'create', repo, detail: 'new repo' };
    } else if (e.type === 'ReleaseEvent') {
      entry = { kind: 'release', repo, detail: p.release?.tag_name || 'release' };
    } else if (e.type === 'IssuesEvent' && p.action === 'closed') {
      entry = { kind: 'issue', repo, detail: `issue #${p.issue?.number}` };
    }
    if (entry) out.push(entry);
    if (out.length >= 6) break;
  }
  return out.slice(0, 5);
}

// The portfolio's content files and logos, read from its public repo.
async function siteContent({ repo, dir }) {
  const get = async (path) => {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/${dir}/${path}`);
    if (!res.ok) throw new Error(`${repo}/${dir}/${path}: ${res.status}`);
    return res;
  };
  const [experience, about, resume] = await Promise.all(['experience', 'about', 'resume'].map((name) => get(`src/content/${name}.json`).then((r) => r.json())));
  const logos = {};
  for (const entry of experience.entries) {
    const file = (entry.logo || '').split('?')[0];
    if (file && !logos[file]) logos[file] = await (await get(`public${file}`)).text();
  }
  return { experience: experience.entries, currently: about.currently.rows, resumeUrl: resume.links.view, logos };
}

export async function loadData(config, token) {
  const [user, activity, site] = await Promise.all([graphql(config.login, token), events(config.login, token), siteContent(config.siteContent)]);
  const hidden = new Set(config.hideRepos || []);
  const now = Date.now();
  const repos = user.repositories.nodes
    .filter((r) => !r.isArchived && !hidden.has(r.name) && r.primaryLanguage)
    .map((r) => ({
      name: r.name,
      stars: r.stargazerCount,
      commits: r.defaultBranchRef?.target?.history?.totalCount ?? 0,
      days: Math.max(0, Math.floor((now - Date.parse(r.pushedAt)) / 86400000)),
      language: r.primaryLanguage.name,
      color: r.primaryLanguage.color || '#8b949e',
      languages: r.languages.edges,
    }));

  const bytes = new Map();
  for (const repo of repos) {
    for (const { size, node } of repo.languages) {
      const entry = bytes.get(node.name) || { name: node.name, color: node.color || '#8b949e', size: 0 };
      entry.size += size;
      bytes.set(node.name, entry);
    }
  }
  const totalBytes = [...bytes.values()].reduce((sum, l) => sum + l.size, 0) || 1;
  const languages = [...bytes.values()].sort((a, b) => b.size - a.size).slice(0, 6).map((l) => ({ ...l, share: l.size / totalBytes }));

  const calendar = user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const weeks = calendar.weeks.map((w) => ({ start: w.contributionDays[0].date, count: w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0) }));
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // The current streak may end today or, if nothing has happened yet today, yesterday.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current += 1;
    else if (i === days.length - 1) continue;
    else break;
  }
  const busiest = days.reduce((best, d) => (d.contributionCount > best.contributionCount ? d : best), days[0]);

  let feed = killfeed(activity, config.login);
  // Nothing public lately: fall back to the most recently pushed repos.
  if (!feed.length) feed = repos.slice(0, 4).map((r) => ({ kind: 'push', repo: r.name, count: null }));

  return {
    repos,
    publicRepos: user.repositories.totalCount,
    languages,
    weeks,
    total: calendar.totalContributions,
    thisWeek: days.slice(-7).reduce((sum, d) => sum + d.contributionCount, 0),
    longest,
    current,
    busiest,
    pullRequests: user.contributionsCollection.totalPullRequestContributions,
    feed,
    today: days[days.length - 1].date,
    site,
  };
}
