const axios = require('axios');

const BASE_URL = 'https://api.github.com';
const FILE = 'tex.json';

function getHeaders() {
  return {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': '7.axc_1'
  };
}

function defaultData() {
  return {
    prefix: '.',
    autoreact: { enabled: false, emoji: null, userId: null, channelId: null },
    autoreply: { enabled: false, message: null, userId: null, channelId: null, delay: 0 },
    copycat: { enabled: false, userId: null, limit: null, count: 0 },
    afk: { enabled: false, message: 'I am AFK.', status: 'idle', whitelist: [], log: [] },
    spy: [],
    keywords: [],
    nitrosnipe: { enabled: false, log: [] },
    rpc: { enabled: false, current: null, presets: {} },
    spam: { active: false },
    faketype: { active: false, channelId: null },
    vstay: { enabled: false, channelId: null },
    dmforward: { enabled: false, webhook: null },
    ghostlog: { enabled: false },
    schedule: []
  };
}

let cache = null;
let cacheSha = null;

function repoUrl() {
  return `${BASE_URL}/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${FILE}`;
}

async function get() {
  if (cache) return cache;
  try {
    const res = await axios.get(repoUrl(), { headers: getHeaders() });
    const content = Buffer.from(res.data.content, 'base64').toString('utf8');
    cache = JSON.parse(content);
    cacheSha = res.data.sha;
  } catch (e) {
    if (e.response?.status === 404) {
      console.log('[storage] tex.json not found, creating...');
      cache = defaultData();
      cacheSha = null;
      await save();
    } else {
      console.error('[storage] read error:', e.message);
      cache = defaultData();
    }
  }
  return cache;
}

async function save() {
  try {
    const content = Buffer.from(JSON.stringify(cache, null, 2)).toString('base64');
    const body = { message: 'tex: update', content };
    if (cacheSha) body.sha = cacheSha;
    const res = await axios.put(repoUrl(), body, { headers: getHeaders() });
    cacheSha = res.data.content.sha;
  } catch (e) {
    console.error('[storage] write error:', e.message);
  }
}

async function update(key, partial) {
  await get();
  cache[key] = { ...cache[key], ...partial };
  await save();
}

async function set(key, value) {
  await get();
  cache[key] = value;
  await save();
}

module.exports = { get, set, update, save };
