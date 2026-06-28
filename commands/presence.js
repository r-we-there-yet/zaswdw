const { RichPresence } = require('discord.js-selfbot-v13');
const storage = require('../storage');
const axios = require('axios');

async function refreshCdnUrl(url, token) {
  try {
    const bare = url.split('?')[0];
    const res = await axios.post(
      'https://discord.com/api/v9/attachments/refresh-urls',
      { attachment_urls: [bare] },
      { headers: { Authorization: token, 'Content-Type': 'application/json' } }
    );
    return res.data.refreshed_urls?.[0]?.refreshed ?? url;
  } catch {
    return url;
  }
}

async function setPresence(client, preset) {
  if (!preset) {
    client.user.setPresence({ activities: [], status: 'online' });
    return;
  }

  const token = client.token;
  let largeImage = preset.largeImage || null;
  if (largeImage?.includes('cdn.discordapp.com')) {
    largeImage = await refreshCdnUrl(largeImage, token);
  }

  try {
    const presence = new RichPresence(client)
      .setApplicationId(preset.appId || '1234567890')
      .setType('PLAYING')
      .setName(preset.name || 'Unknown')
      .setDetails(preset.details || null)
      .setState(preset.state || null);

    if (largeImage) presence.setAssetsLargeImage(largeImage);
    if (preset.largeText) presence.setAssetsLargeText(preset.largeText);
    if (preset.startTimestamp) presence.setStartTimestamp(preset.startTimestamp);
    if (preset.button1) presence.addButton(preset.button1.label, preset.button1.url);

    client.user.setPresence({ activities: [presence], status: client.user.presence.status || 'online' });
  } catch (e) {
    console.error('[presence] set error:', e.message);
  }
}

module.exports = {
  async handle(message, args, client) {
    const data = await storage.get();
    const sub = args[0]?.toLowerCase();

    // .rpc off
    if (sub === 'off') {
      await storage.update('rpc', { enabled: false, current: null });
      await setPresence(client, null);
      return message.reply('`presence cleared`');
    }

    // .rpc list
    if (sub === 'list') {
      const presets = data.rpc.presets;
      const keys = Object.keys(presets);
      if (!keys.length) return message.reply('`no presets saved`');
      const list = keys.map(k => `\`${k}\``).join('\n');
      return message.reply(list);
    }

    // .rpc load <name>
    if (sub === 'load') {
      const name = args[1];
      if (!name) return message.reply('`usage: .rpc load <name>`');
      const preset = data.rpc.presets[name];
      if (!preset) return message.reply(`\`preset "${name}" not found\``);
      await storage.update('rpc', { enabled: true, current: preset });
      await setPresence(client, preset);
      return message.reply(`\`loaded preset: ${name}\``);
    }

    // .rpc delete <name>
    if (sub === 'delete') {
      const name = args[1];
      if (!name) return message.reply('`usage: .rpc delete <name>`');
      const presets = { ...data.rpc.presets };
      if (!presets[name]) return message.reply(`\`preset "${name}" not found\``);
      delete presets[name];
      await storage.update('rpc', { presets });
      return message.reply(`\`deleted preset: ${name}\``);
    }

    // .rpc set - interactive setup
    if (sub === 'set') {
      const channel = message.channel;
      const filter = m => m.author.id === message.author.id;
      const ask = async (q) => {
        await channel.send(`\`${q}\``);
        try {
          const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
          return collected.first().content.trim();
        } catch {
          return null;
        }
      };

      const name = await ask('game name:');
      if (!name) return channel.send('`timed out`');

      const details = await ask('details (or "skip"):');
      const state = await ask('state (or "skip"):');
      const timerStr = await ask('show timer? (yes/no):');
      const startTimestamp = timerStr?.toLowerCase() === 'yes' ? Date.now() : null;

      await channel.send('`attach image in next message (or type "skip"):`');
      let largeImage = null;
      try {
        const imgMsg = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        const first = imgMsg.first();
        if (first.content.toLowerCase() !== 'skip' && first.attachments.size > 0) {
          largeImage = first.attachments.first().url;
        }
      } catch { }

      const saveStr = await ask('save as preset? (name or "no"):');

      const preset = {
        name,
        details: details?.toLowerCase() === 'skip' ? null : details,
        state: state?.toLowerCase() === 'skip' ? null : state,
        startTimestamp,
        largeImage
      };

      if (saveStr && saveStr.toLowerCase() !== 'no') {
        const presets = { ...data.rpc.presets, [saveStr]: preset };
        await storage.update('rpc', { enabled: true, current: preset, presets });
        await channel.send(`\`saved and loaded preset: ${saveStr}\``);
      } else {
        await storage.update('rpc', { enabled: true, current: preset });
        await channel.send('`presence set`');
      }

      await setPresence(client, preset);
      return;
    }

    return message.reply('`usage: .rpc set | .rpc load <name> | .rpc list | .rpc delete <name> | .rpc off`');
  },

  setPresence
};
