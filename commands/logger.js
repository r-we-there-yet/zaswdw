const storage = require('../storage');

const snipeCache = new Map(); // channelId -> { content, author, timestamp }
const editSnipeCache = new Map();

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();
    const sub = args[1]?.toLowerCase();

    if (cmd === 'spy') {
      if (sub === 'off') {
        const userId = args[2]?.replace(/[<@!>]/g, '');
        if (!userId) return message.reply('`usage: .spy off <@user>`');
        const data = await storage.get();
        await storage.set('spy', data.spy.filter(id => id !== userId));
        return message.reply(`\`stopped spying on ${userId}\``);
      }
      if (sub === 'list') {
        const data = await storage.get();
        if (!data.spy.length) return message.reply('`not spying on anyone`');
        return message.reply(data.spy.map(id => `\`${id}\``).join('\n'));
      }
      const userId = args[1]?.replace(/[<@!>]/g, '');
      if (!userId) return message.reply('`usage: .spy <@user>`');
      const data = await storage.get();
      if (!data.spy.includes(userId)) {
        await storage.set('spy', [...data.spy, userId]);
      }
      return message.reply(`\`spying on ${userId}\``);
    }

    if (cmd === 'snipe') {
      const cached = snipeCache.get(message.channel.id);
      if (!cached) return message.reply('`nothing to snipe`');
      return message.reply(`\`${cached.author}: ${cached.content}\``);
    }

    if (cmd === 'editsnipe') {
      const cached = editSnipeCache.get(message.channel.id);
      if (!cached) return message.reply('`nothing to snipe`');
      return message.reply(`\`${cached.author} edited: ${cached.before} -> ${cached.after}\``);
    }

    if (cmd === 'keyword') {
      if (sub === 'add') {
        const word = args.slice(2).join(' ').toLowerCase();
        if (!word) return message.reply('`usage: .keyword add <word>`');
        const data = await storage.get();
        if (!data.keywords.includes(word)) await storage.set('keywords', [...data.keywords, word]);
        return message.reply(`\`keyword added: ${word}\``);
      }
      if (sub === 'remove') {
        const word = args.slice(2).join(' ').toLowerCase();
        const data = await storage.get();
        await storage.set('keywords', data.keywords.filter(k => k !== word));
        return message.reply(`\`keyword removed: ${word}\``);
      }
      if (sub === 'list') {
        const data = await storage.get();
        if (!data.keywords.length) return message.reply('`no keywords set`');
        return message.reply(data.keywords.map(k => `\`${k}\``).join('\n'));
      }
    }

    if (cmd === 'ghostlog') {
      if (!sub) return message.reply('`usage: .ghostlog <on/off>`');
      await storage.update('ghostlog', { enabled: sub === 'on' });
      return message.reply(`\`ghostlog ${sub}\``);
    }

    if (cmd === 'dmforward') {
      if (sub === 'on') {
        const webhook = args[2];
        if (!webhook) return message.reply('`usage: .dmforward on <webhook_url>`');
        await storage.update('dmforward', { enabled: true, webhook });
        return message.reply('`dm forwarding on`');
      }
      if (sub === 'off') {
        await storage.update('dmforward', { enabled: false });
        return message.reply('`dm forwarding off`');
      }
    }

    if (cmd === 'dmlog') {
      return message.reply('`check your dm forward webhook for logs`');
    }
  },

  async onMessageDelete(message) {
    if (!message.content || !message.author) return;
    snipeCache.set(message.channel.id, {
      content: message.content.slice(0, 500),
      author: message.author.username,
      timestamp: Date.now()
    });
  },

  async onMessageUpdate(oldMsg, newMsg) {
    if (!oldMsg.content || !newMsg.content) return;
    editSnipeCache.set(oldMsg.channel.id, {
      before: oldMsg.content.slice(0, 200),
      after: newMsg.content.slice(0, 200),
      author: oldMsg.author?.username
    });
  },

  async onMessage(message, client) {
    const data = await storage.get();

    // spy notification
    if (data.spy.includes(message.author.id)) {
      try {
        const mainUser = await client.users.fetch(process.env.MAIN_ID);
        const dmChannel = await mainUser.createDM();
        await dmChannel.send(`\`spy: ${message.author.username} in ${message.guild?.name || 'DM'}: ${message.content.slice(0, 200)}\``);
      } catch {}
    }

    // keyword notification
    if (data.keywords.length && message.author.id !== client.user.id) {
      const content = message.content.toLowerCase();
      for (const kw of data.keywords) {
        if (content.includes(kw)) {
          try {
            const mainUser = await client.users.fetch(process.env.MAIN_ID);
            const dmChannel = await mainUser.createDM();
            await dmChannel.send(`\`keyword "${kw}" by ${message.author.username} in ${message.guild?.name || 'DM'}: ${message.content.slice(0, 200)}\``);
          } catch {}
          break;
        }
      }
    }

    // dm forward
    if (!message.guild && message.author.id !== client.user.id && data.dmforward.enabled && data.dmforward.webhook) {
      try {
        const axios = require('axios');
        await axios.post(data.dmforward.webhook, {
          content: `\`DM from ${message.author.username}: ${message.content.slice(0, 500)}\``
        });
      } catch {}
    }

    // ghostlog - detect if someone pinged then deleted
    if (data.ghostlog.enabled) {
      // handled via onMessageDelete + snipeCache cross-reference
    }
  },

  async onGhostPing(message, client) {
    const data = await storage.get();
    if (!data.ghostlog.enabled) return;
    if (!message.mentions?.users?.has(client.user.id)) return;
    try {
      const mainUser = await client.users.fetch(process.env.MAIN_ID);
      const dmChannel = await mainUser.createDM();
      await dmChannel.send(`\`ghost ping by ${message.author?.username} in ${message.guild?.name || 'DM'}: ${message.content?.slice(0, 200)}\``);
    } catch {}
  }
};
