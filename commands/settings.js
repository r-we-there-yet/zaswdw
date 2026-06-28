const storage = require('../storage');
const axios = require('axios');

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'prefix') {
      const newPrefix = args[1];
      if (!newPrefix) return message.reply('`usage: .prefix <new>`');
      await storage.set('prefix', newPrefix);
      return message.reply(`\`prefix changed to ${newPrefix}\``);
    }

    if (cmd === 'status') {
      const status = args[1]?.toLowerCase();
      const valid = ['online', 'idle', 'dnd', 'invisible'];
      if (!valid.includes(status)) return message.reply('`usage: .status <online/idle/dnd/invisible>`');
      client.user.setStatus(status);
      return message.reply(`\`status set to ${status}\``);
    }

    if (cmd === 'setavatar') {
      const attachment = message.attachments.first();
      if (!attachment) return message.reply('`attach an image with this command`');
      try {
        await client.user.setAvatar(attachment.url);
        return message.reply('`avatar updated`');
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'setusername') {
      const name = args.slice(1).join(' ');
      if (!name) return message.reply('`usage: .setusername <text>`');
      try {
        await client.user.setUsername(name);
        return message.reply(`\`username changed to ${name}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'ping') {
      return message.reply(`\`${client.ws.ping}ms\``);
    }

    if (cmd === 'uptime') {
      const ms = client.uptime;
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000) % 60;
      const h = Math.floor(ms / 3600000) % 24;
      const d = Math.floor(ms / 86400000);
      return message.reply(`\`uptime: ${d}d ${h}h ${m}m ${s}s\``);
    }

    if (cmd === 'restart') {
      await message.reply('`restarting...`');
      process.exit(0); // Render auto-restarts
    }

    if (cmd === 'boostinfo') {
      try {
        const res = await axios.get(
          'https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots',
          { headers: { Authorization: client.token } }
        );
        if (!res.data.length) return message.reply('`no active boosts`');
        const out = res.data.map(s => `\`slot ${s.id}: ${s.subscription_id ? 'boosting' : 'available'}\``).join('\n');
        return message.reply(out);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }
  }
};
