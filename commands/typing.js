const storage = require('../storage');

let faketypeInterval = null;

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();
    const sub = args[1]?.toLowerCase();

    // FAKETYPE
    if (cmd === 'faketype') {
      if (sub === 'stop') {
        if (faketypeInterval) {
          clearInterval(faketypeInterval);
          faketypeInterval = null;
        }
        await storage.update('faketype', { active: false, channelId: null });
        return message.reply('`faketype stopped`');
      }

      const channelId = args[1]?.replace(/[<#>]/g, '') || message.channel.id;
      const target = client.channels.cache.get(channelId);
      if (!target) return message.reply('`channel not found`');

      if (faketypeInterval) clearInterval(faketypeInterval);
      await storage.update('faketype', { active: true, channelId });

      faketypeInterval = setInterval(async () => {
        try { await target.sendTyping(); } catch {}
      }, 8000);

      await target.sendTyping();
      return message.reply(`\`faketype active in ${target.name || 'channel'}\``);
    }

    // TYPELOOP
    if (cmd === 'typeloop') {
      const channelId = args[1]?.replace(/[<#>]/g, '') || message.channel.id;
      const target = client.channels.cache.get(channelId);
      if (!target) return message.reply('`channel not found`');

      if (faketypeInterval) clearInterval(faketypeInterval);

      faketypeInterval = setInterval(async () => {
        try { await target.sendTyping(); } catch {}
      }, 5000);

      await target.sendTyping();
      return message.reply(`\`typeloop active in ${target.name || 'channel'}\``);
    }

    // SLOWTYPE
    if (cmd === 'slowtype') {
      const text = args.slice(1).join(' ');
      if (!text) return message.reply('`usage: .slowtype <text>`');

      let built = '';
      for (const char of text) {
        built += char;
        try {
          await message.channel.send(built);
          await new Promise(r => setTimeout(r, 300));
        } catch {}
      }
      return;
    }
  },

  restoreFaketype(client, channelId) {
    if (!channelId) return;
    const target = client.channels.cache.get(channelId);
    if (!target) return;
    if (faketypeInterval) clearInterval(faketypeInterval);
    faketypeInterval = setInterval(async () => {
      try { await target.sendTyping(); } catch {}
    }, 8000);
  }
};
