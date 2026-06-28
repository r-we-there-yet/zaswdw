require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const http = require('http');
const storage = require('./storage');
const handler = require('./handler');
const presence = require('./commands/presence');
const typing = require('./commands/typing');
const voice = require('./commands/voice');
const logger = require('./commands/logger');

const client = new Client({
  checkUpdate: false,
  readyStatus: false,
  patchVoice: true
});

client.on('ready', async () => {
  console.log(`[tex] logged in as ${client.user.tag}`);

  const data = await storage.get();

  // restore presence
  if (data.rpc.enabled && data.rpc.current) {
    await presence.setPresence(client, data.rpc.current);
    console.log('[tex] presence restored');
  }

  // restore faketype
  if (data.faketype.active && data.faketype.channelId) {
    typing.restoreFaketype(client, data.faketype.channelId);
    console.log('[tex] faketype restored');
  }

  // restore vstay
  if (data.vstay.enabled && data.vstay.channelId) {
    voice.restoreVstay(client, data.vstay.channelId);
    console.log('[tex] vstay restored');
  }

  // restore status
  if (data.afk.enabled) {
    client.user.setStatus(data.afk.status || 'idle');
  }
});

client.on('messageCreate', async (message) => {
  try {
    await handler.onMessage(message, client);
  } catch (e) {
    console.error('[tex] messageCreate error:', e.message);
  }
});

client.on('messageDelete', async (message) => {
  try {
    await logger.onMessageDelete(message);
    // ghost ping check
    if (message.mentions?.users?.has(client.user.id)) {
      await logger.onGhostPing(message, client);
    }
  } catch {}
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
  try {
    await logger.onMessageUpdate(oldMsg, newMsg);
  } catch {}
});

// keep-alive server for Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('tex alive');
}).listen(PORT, () => {
  console.log(`[tex] keep-alive server on port ${PORT}`);
});

// self ping every 12 minutes
if (process.env.RENDER_URL) {
  setInterval(async () => {
    try {
      const fetch = require('node-fetch');
      await fetch(process.env.RENDER_URL);
      console.log('[tex] self ping ok');
    } catch (e) {
      console.error('[tex] self ping failed:', e.message);
    }
  }, 12 * 60 * 1000);
}

client.login(process.env.ALT_TOKEN);
