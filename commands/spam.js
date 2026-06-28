const storage = require('../storage');

let spamInterval = null;
let scheduleTimers = [];

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'spam') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'stop') {
        if (spamInterval) { clearInterval(spamInterval); spamInterval = null; }
        await storage.update('spam', { active: false });
        return message.reply('`spam stopped`');
      }
      const n = parseInt(args[1]);
      const text = args.slice(2).join(' ');
      if (isNaN(n) || !text) return message.reply('`usage: .spam <n> <text>`');
      await storage.update('spam', { active: true });
      let count = 0;
      spamInterval = setInterval(async () => {
        if (count >= n) {
          clearInterval(spamInterval);
          spamInterval = null;
          await storage.update('spam', { active: false });
          return;
        }
        try { await message.channel.send(text); } catch {}
        count++;
      }, 1200);
      return;
    }

    if (cmd === 'ghostping') {
      const userId = args[1]?.replace(/[<@!>]/g, '');
      if (!userId) return message.reply('`usage: .ghostping <@user>`');
      try {
        const sent = await message.channel.send(`<@${userId}>`);
        await sent.delete();
      } catch {}
      try { await message.delete(); } catch {}
      return;
    }

    if (cmd === 'massghost') {
      if (!message.guild) return message.reply('`must be in a server`');
      const members = await message.guild.members.fetch();
      for (const member of members.values()) {
        if (member.user.bot || member.user.id === client.user.id) continue;
        try {
          const sent = await message.channel.send(`<@${member.user.id}>`);
          await sent.delete();
          await new Promise(r => setTimeout(r, 800));
        } catch {}
      }
      return;
    }

    if (cmd === 'tts') {
      const text = args.slice(1).join(' ');
      if (!text) return message.reply('`usage: .tts <text>`');
      try { await message.channel.send({ content: text, tts: true }); } catch {}
      return;
    }

    if (cmd === 'embed') {
      const text = args.slice(1).join(' ');
      if (!text) return message.reply('`usage: .embed <text>`');
      try {
        const { MessageEmbed } = require('discord.js-selfbot-v13');
        const embed = new MessageEmbed().setDescription(text).setColor('#000000');
        await message.channel.send({ embeds: [embed] });
      } catch {}
      return;
    }

    if (cmd === 'schedule') {
      const sub = args[1]?.toLowerCase();

      if (sub === 'list') {
        const data = await storage.get();
        if (!data.schedule.length) return message.reply('`no scheduled messages`');
        return message.reply(data.schedule.map((s, i) => `\`${i + 1}. ${s.time} in ${s.channelId}: ${s.text.slice(0, 50)}\``).join('\n'));
      }

      if (sub === 'cancel') {
        const id = parseInt(args[2]) - 1;
        const data = await storage.get();
        if (isNaN(id) || !data.schedule[id]) return message.reply('`invalid id`');
        if (scheduleTimers[id]) clearTimeout(scheduleTimers[id]);
        const newSchedule = data.schedule.filter((_, i) => i !== id);
        await storage.set('schedule', newSchedule);
        return message.reply('`scheduled message cancelled`');
      }

      // .schedule <time_seconds> <text>
      const delay = parseInt(args[1]) * 1000;
      const text = args.slice(2).join(' ');
      if (isNaN(delay) || !text) return message.reply('`usage: .schedule <seconds> <text>`');

      const data = await storage.get();
      const entry = { time: new Date(Date.now() + delay).toISOString(), channelId: message.channel.id, text };
      const idx = data.schedule.length;
      await storage.set('schedule', [...data.schedule, entry]);

      scheduleTimers[idx] = setTimeout(async () => {
        try {
          const ch = client.channels.cache.get(message.channel.id);
          if (ch) await ch.send(text);
        } catch {}
        const d = await storage.get();
        await storage.set('schedule', d.schedule.filter((_, i) => i !== idx));
      }, delay);

      return message.reply(`\`scheduled in ${args[1]}s\``);
    }

    if (cmd === 'impersonate') {
      const userId = args[1]?.replace(/[<@!>]/g, '');
      const text = args.slice(2).join(' ');
      if (!userId || !text) return message.reply('`usage: .impersonate <@user> <text>`');
      try {
        const user = await client.users.fetch(userId);
        const axios = require('axios');
        const webhooks = await message.channel.fetchWebhooks();
        let wh = webhooks.find(w => w.owner?.id === client.user.id);
        if (!wh) wh = await message.channel.createWebhook('tex');
        await axios.post(`https://discord.com/api/webhooks/${wh.id}/${wh.token}`, {
          content: text,
          username: user.username,
          avatar_url: user.displayAvatarURL()
        });
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
      return;
    }

    if (cmd === 'massdm') {
      const guildId = args[1];
      const text = args.slice(2).join(' ');
      if (!guildId || !text) return message.reply('`usage: .massdm <serverid> <text>`');
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return message.reply('`server not found`');
      const members = await guild.members.fetch();
      let sent = 0;
      for (const member of members.values()) {
        if (member.user.bot || member.user.id === client.user.id) continue;
        try {
          const dm = await member.user.createDM();
          await dm.send(text);
          sent++;
          await new Promise(r => setTimeout(r, 1500));
        } catch {}
      }
      return message.reply(`\`mass dm sent to ${sent} users\``);
    }
  }
};
