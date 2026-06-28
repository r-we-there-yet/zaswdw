const storage = require('./storage');
const presence = require('./commands/presence');
const auto = require('./commands/auto');
const typing = require('./commands/typing');
const afk = require('./commands/afk');
const cleanup = require('./commands/cleanup');
const logger = require('./commands/logger');
const nitro = require('./commands/nitro');
const spam = require('./commands/spam');
const voice = require('./commands/voice');
const social = require('./commands/social');
const server = require('./commands/server');
const fun = require('./commands/fun');
const settings = require('./commands/settings');
const menu = require('./menu');

const MAIN_ID = process.env.MAIN_ID;

module.exports = {
  async onMessage(message, client) {
    // background listeners (no auth check)
    await auto.onMessage(message, client);
    await nitro.onMessage(message, client);
    await logger.onMessage(message, client);

    // afk mention check
    if (message.mentions?.users?.has(client.user.id)) {
      await afk.onMention(message, client);
    }

    // auth check — only main can run commands
    if (message.author.id !== MAIN_ID) return;

    const data = await storage.get();
    const prefix = data.prefix || '.';

    if (!message.content.startsWith(prefix)) return;

    const raw = message.content.slice(prefix.length).trim();
    const args = raw.split(/\s+/);
    const cmd = args[0]?.toLowerCase();

    if (!cmd) return;

    // menu pagination
    const menuMatch = cmd.match(/^menu(\d*)$/);
    if (menuMatch) {
      const pageNum = menuMatch[1] ? parseInt(menuMatch[1]) : 1;
      return menu.handle(message, pageNum);
    }

    // route commands
    try {
      if (['rpc'].includes(cmd)) return presence.handle(message, args, client);
      if (['autoreact', 'autoreply', 'copycat'].includes(cmd)) return auto.handle(message, args, client);
      if (['faketype', 'typeloop', 'slowtype'].includes(cmd)) return typing.handle(message, args, client);
      if (['afk'].includes(cmd)) return afk.handle(message, args, client);
      if (['purge', 'nuke', 'delpinned'].includes(cmd)) return cleanup.handle(message, args, client);
      if (['spy', 'snipe', 'editsnipe', 'keyword', 'ghostlog', 'dmforward', 'dmlog'].includes(cmd)) return logger.handle(message, args, client);
      if (['nitrosnipe', 'boostinfo'].includes(cmd)) return settings.handle(message, [cmd, ...args.slice(1)], client) || nitro.handle(message, args.slice(1), client);
      if (['spam', 'ghostping', 'massghost', 'tts', 'embed', 'schedule', 'impersonate', 'massdm'].includes(cmd)) return spam.handle(message, args, client);
      if (['vjoin', 'vleave', 'vmute', 'vdeafen', 'vstay', 'vloop'].includes(cmd)) return voice.handle(message, args, client);
      if (['userinfo', 'avatar', 'banner', 'mutuals', 'friend', 'block', 'unblock', 'massfriend'].includes(cmd)) return social.handle(message, args, client);
      if (['servers', 'serverleave', 'massleave', 'inviteinfo', 'joinserver', 'serverinfo', 'membercount', 'roles', 'perms'].includes(cmd)) return server.handle(message, args, client);
      if (['shrug', 'lenny', 'tableflip', 'unflip', 'invisible', 'mock', 'reverse', 'big', 'zalgo', 'clap', 'spoiler', 'ascii', 'greentext', 'copypasta'].includes(cmd)) return fun.handle(message, args, client);
      if (['prefix', 'status', 'setavatar', 'setusername', 'ping', 'uptime', 'restart', 'boostinfo'].includes(cmd)) return settings.handle(message, args, client);
      if (cmd === 'nitrosnipe') return nitro.handle(message, args.slice(1), client);
    } catch (e) {
      console.error(`[handler] error in ${cmd}:`, e.message);
      try { await message.reply(`\`error: ${e.message}\``); } catch {}
    }
  },

  async onMessageDelete(message) {
    await logger.onMessageDelete(message);
    await logger.onGhostPing(message, null); // ghost ping handled separately in index
  },

  async onMessageUpdate(oldMsg, newMsg) {
    await logger.onMessageUpdate(oldMsg, newMsg);
  }
};
