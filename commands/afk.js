const storage = require('../storage');

module.exports = {
  async handle(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'on' || sub === 'off') {
      await storage.update('afk', { enabled: sub === 'on' });
      if (sub === 'on') {
        const data = await storage.get();
        client.user.setStatus(data.afk.status || 'idle');
      } else {
        client.user.setStatus('online');
      }
      return message.reply(`\`afk ${sub}\``);
    }

    if (sub === 'msg') {
      const msg = args.slice(1).join(' ');
      if (!msg) return message.reply('`usage: .afk msg <text>`');
      await storage.update('afk', { message: msg });
      return message.reply('`afk message set`');
    }

    if (sub === 'status') {
      const status = args[1]?.toLowerCase();
      if (!['idle', 'dnd'].includes(status)) return message.reply('`usage: .afk status <idle/dnd>`');
      await storage.update('afk', { status });
      return message.reply(`\`afk status set to ${status}\``);
    }

    if (sub === 'whitelist') {
      const userId = args[1]?.replace(/[<@!>]/g, '');
      if (!userId) return message.reply('`usage: .afk whitelist <@user>`');
      const data = await storage.get();
      const list = data.afk.whitelist || [];
      if (list.includes(userId)) {
        await storage.update('afk', { whitelist: list.filter(id => id !== userId) });
        return message.reply(`\`removed ${userId} from afk whitelist\``);
      }
      await storage.update('afk', { whitelist: [...list, userId] });
      return message.reply(`\`added ${userId} to afk whitelist\``);
    }

    if (sub === 'log') {
      const data = await storage.get();
      const log = data.afk.log || [];
      if (!log.length) return message.reply('`no pings while afk`');
      const out = log.slice(-10).map(l => `\`${l.username} in ${l.place}: ${l.content}\``).join('\n');
      await storage.update('afk', { log: [] });
      return message.reply(out);
    }

    return message.reply('`usage: .afk on/off | .afk msg <text> | .afk status <idle/dnd> | .afk whitelist <@user> | .afk log`');
  },

  async onMention(message, client) {
    const data = await storage.get();
    if (!data.afk.enabled) return;
    if (message.author.id === client.user.id) return;
    if (data.afk.whitelist?.includes(message.author.id)) return;

    const log = data.afk.log || [];
    log.push({
      username: message.author.username,
      place: message.guild ? message.guild.name : 'DM',
      content: message.content.slice(0, 100),
      timestamp: Date.now()
    });
    await storage.update('afk', { log: log.slice(-50) });

    try {
      await message.reply(`\`${data.afk.message}\``);
    } catch {}
  }
};
