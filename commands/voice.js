const storage = require('../storage');

let vstayInterval = null;

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'vjoin') {
      const channelId = args[1]?.replace(/[<#>]/g, '');
      if (!channelId) return message.reply('`usage: .vjoin <#vc>`');
      const channel = client.channels.cache.get(channelId);
      if (!channel || channel.type !== 'GUILD_VOICE') return message.reply('`voice channel not found`');
      try {
        await channel.join();
        return message.reply(`\`joined ${channel.name}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'vleave') {
      if (!message.guild) return message.reply('`must be in a server`');
      const conn = client.voice?.connections?.get(message.guild.id);
      if (!conn) return message.reply('`not in a voice channel\``');
      conn.disconnect();
      return message.reply('`left voice channel`');
    }

    if (cmd === 'vmute') {
      const sub = args[1]?.toLowerCase();
      if (!['on', 'off'].includes(sub)) return message.reply('`usage: .vmute <on/off>`');
      try {
        await message.guild.me.voice.setSelfMute(sub === 'on');
        return message.reply(`\`self mute ${sub}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'vdeafen') {
      const sub = args[1]?.toLowerCase();
      if (!['on', 'off'].includes(sub)) return message.reply('`usage: .vdeafen <on/off>`');
      try {
        await message.guild.me.voice.setSelfDeaf(sub === 'on');
        return message.reply(`\`self deafen ${sub}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'vstay') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'off') {
        if (vstayInterval) { clearInterval(vstayInterval); vstayInterval = null; }
        await storage.update('vstay', { enabled: false, channelId: null });
        return message.reply('`vstay off`');
      }
      const channelId = args[1]?.replace(/[<#>]/g, '');
      if (!channelId) return message.reply('`usage: .vstay <#vc>`');
      await storage.update('vstay', { enabled: true, channelId });
      startVstay(client, channelId);
      return message.reply('`vstay on`');
    }

    if (cmd === 'vloop') {
      const channelId = args[1]?.replace(/[<#>]/g, '') || null;
      if (channelId) {
        await storage.update('vstay', { enabled: true, channelId });
        startVstay(client, channelId);
        return message.reply('`vloop active`');
      }
      return message.reply('`usage: .vloop <#vc>`');
    }
  },

  restoreVstay(client, channelId) {
    if (channelId) startVstay(client, channelId);
  }
};

function startVstay(client, channelId) {
  if (vstayInterval) clearInterval(vstayInterval);
  vstayInterval = setInterval(async () => {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
    const conn = client.voice?.connections?.get(channel.guild?.id);
    if (!conn || conn.channel?.id !== channelId) {
      try { await channel.join(); } catch {}
    }
  }, 10000);
}
