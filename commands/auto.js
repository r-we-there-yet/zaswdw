const storage = require('../storage');

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();
    const sub = args[1]?.toLowerCase();

    // AUTOREACT
    if (cmd === 'autoreact') {
      if (!sub) return message.reply('`usage: .autoreact <on/off> | .autoreact emoji <emoji> | .autoreact user <@user> | .autoreact channel <#channel>`');

      if (sub === 'on' || sub === 'off') {
        await storage.update('autoreact', { enabled: sub === 'on' });
        return message.reply(`\`autoreact ${sub}\``);
      }

      if (sub === 'emoji') {
        const emoji = args[2];
        if (!emoji) return message.reply('`usage: .autoreact emoji <emoji>`');
        await storage.update('autoreact', { emoji });
        return message.reply(`\`autoreact emoji set to ${emoji}\``);
      }

      if (sub === 'user') {
        const userId = args[2]?.replace(/[<@!>]/g, '');
        if (!userId) return message.reply('`usage: .autoreact user <@user>`');
        await storage.update('autoreact', { userId });
        return message.reply(`\`autoreact targeting user ${userId}\``);
      }

      if (sub === 'channel') {
        const channelId = args[2]?.replace(/[<#>]/g, '');
        if (!channelId) return message.reply('`usage: .autoreact channel <#channel>`');
        await storage.update('autoreact', { channelId });
        return message.reply(`\`autoreact targeting channel ${channelId}\``);
      }

      if (sub === 'clear') {
        await storage.update('autoreact', { userId: null, channelId: null });
        return message.reply('`autoreact filters cleared`');
      }
    }

    // AUTOREPLY
    if (cmd === 'autoreply') {
      if (!sub) return message.reply('`usage: .autoreply <on/off> | .autoreply msg <text> | .autoreply user <@user> | .autoreply channel <#channel> | .autoreply delay <seconds>`');

      if (sub === 'on' || sub === 'off') {
        await storage.update('autoreply', { enabled: sub === 'on' });
        return message.reply(`\`autoreply ${sub}\``);
      }

      if (sub === 'msg') {
        const msg = args.slice(2).join(' ');
        if (!msg) return message.reply('`usage: .autoreply msg <text>`');
        await storage.update('autoreply', { message: msg });
        return message.reply(`\`autoreply message set\``);
      }

      if (sub === 'user') {
        const userId = args[2]?.replace(/[<@!>]/g, '');
        if (!userId) return message.reply('`usage: .autoreply user <@user>`');
        await storage.update('autoreply', { userId });
        return message.reply(`\`autoreply targeting user ${userId}\``);
      }

      if (sub === 'channel') {
        const channelId = args[2]?.replace(/[<#>]/g, '');
        if (!channelId) return message.reply('`usage: .autoreply channel <#channel>`');
        await storage.update('autoreply', { channelId });
        return message.reply(`\`autoreply targeting channel ${channelId}\``);
      }

      if (sub === 'delay') {
        const delay = parseInt(args[2]);
        if (isNaN(delay)) return message.reply('`usage: .autoreply delay <seconds>`');
        await storage.update('autoreply', { delay: delay * 1000 });
        return message.reply(`\`autoreply delay set to ${delay}s\``);
      }

      if (sub === 'clear') {
        await storage.update('autoreply', { userId: null, channelId: null });
        return message.reply('`autoreply filters cleared`');
      }
    }

    // COPYCAT
    if (cmd === 'copycat') {
      if (!sub) return message.reply('`usage: .copycat <on/off> <@user> | .copycat limit <n>`');

      if (sub === 'on') {
        const userId = args[2]?.replace(/[<@!>]/g, '');
        if (!userId) return message.reply('`usage: .copycat on <@user>`');
        await storage.update('copycat', { enabled: true, userId, count: 0 });
        return message.reply(`\`copycat on for user ${userId}\``);
      }

      if (sub === 'off') {
        await storage.update('copycat', { enabled: false, userId: null, count: 0 });
        return message.reply('`copycat off`');
      }

      if (sub === 'limit') {
        const limit = parseInt(args[2]);
        if (isNaN(limit)) return message.reply('`usage: .copycat limit <n>`');
        await storage.update('copycat', { limit });
        return message.reply(`\`copycat limit set to ${limit}\``);
      }
    }
  },

  async onMessage(message, client) {
    const data = await storage.get();

    // autoreact
    if (data.autoreact.enabled && data.autoreact.emoji) {
      const userMatch = !data.autoreact.userId || message.author.id === data.autoreact.userId;
      const channelMatch = !data.autoreact.channelId || message.channel.id === data.autoreact.channelId;
      if (userMatch && channelMatch && message.author.id !== client.user.id) {
        try { await message.react(data.autoreact.emoji); } catch {}
      }
    }

    // autoreply
    if (data.autoreply.enabled && data.autoreply.message) {
      const userMatch = !data.autoreply.userId || message.author.id === data.autoreply.userId;
      const channelMatch = !data.autoreply.channelId || message.channel.id === data.autoreply.channelId;
      if (userMatch && channelMatch && message.author.id !== client.user.id) {
        setTimeout(async () => {
          try { await message.reply(data.autoreply.message); } catch {}
        }, data.autoreply.delay || 0);
      }
    }

    // copycat
    if (data.copycat.enabled && data.copycat.userId && message.author.id === data.copycat.userId) {
      if (data.copycat.limit && data.copycat.count >= data.copycat.limit) {
        await storage.update('copycat', { enabled: false, count: 0 });
        return;
      }
      try {
        await message.channel.send(message.content);
        await storage.update('copycat', { count: (data.copycat.count || 0) + 1 });
      } catch {}
    }
  }
};
