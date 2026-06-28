const axios = require('axios');

module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'userinfo') {
      const input = args[1];
      if (!input) return message.reply('`usage: .userinfo <@user|userid|username>`');

      let userId = input.replace(/[<@!>]/g, '');
      let user = null;

      // if not numeric, search by username across guilds
      if (!/^\d+$/.test(userId)) {
        const username = input.toLowerCase();
        for (const guild of client.guilds.cache.values()) {
          const members = guild.members.cache;
          const found = members.find(m =>
            m.user.username.toLowerCase() === username ||
            m.displayName.toLowerCase() === username
          );
          if (found) { user = found.user; break; }
        }
        if (!user) return message.reply(`\`could not find "${input}" in any shared servers, try their user ID\``);
      } else {
        try { user = await client.users.fetch(userId); } catch {
          return message.reply('`user not found`');
        }
      }

      const created = new Date(Number((BigInt(user.id) >> 22n) + 1420070400000n));
      const lines = [
        `\`username: ${user.username}\``,
        `\`id: ${user.id}\``,
        `\`created: ${created.toDateString()}\``,
        `\`bot: ${user.bot}\``,
        `\`avatar: ${user.displayAvatarURL({ size: 4096 })}\``,
      ].join('\n');
      return message.reply(lines);
    }

    if (cmd === 'avatar') {
      const input = args[1];
      if (!input) return message.reply('`usage: .avatar <@user|userid|username>`');
      let user = await resolveUser(input, client);
      if (!user) return message.reply('`user not found`');
      return message.reply(`\`${user.displayAvatarURL({ size: 4096, dynamic: true })}\``);
    }

    if (cmd === 'banner') {
      const input = args[1];
      if (!input) return message.reply('`usage: .banner <@user|userid|username>`');
      let user = await resolveUser(input, client);
      if (!user) return message.reply('`user not found`');
      await user.fetch(); // force full fetch for banner
      const banner = user.bannerURL?.({ size: 4096, dynamic: true });
      if (!banner) return message.reply('`user has no banner`');
      return message.reply(`\`${banner}\``);
    }

    if (cmd === 'mutuals') {
      const input = args[1];
      if (!input) return message.reply('`usage: .mutuals <@user|userid>`');
      const userId = input.replace(/[<@!>]/g, '');
      const mutuals = [];
      for (const guild of client.guilds.cache.values()) {
        if (guild.members.cache.has(userId)) mutuals.push(guild.name);
      }
      if (!mutuals.length) return message.reply('`no mutual servers found`');
      return message.reply(mutuals.map(n => `\`${n}\``).join('\n'));
    }

    if (cmd === 'friend') {
      const sub = args[1]?.toLowerCase();
      const userId = args[2]?.replace(/[<@!>]/g, '');

      if (sub === 'add') {
        if (!userId) return message.reply('`usage: .friend add <@user>`');
        try {
          await axios.put(
            `https://discord.com/api/v9/users/@me/relationships/${userId}`,
            { type: 1 },
            { headers: { Authorization: client.token } }
          );
          return message.reply(`\`friend request sent to ${userId}\``);
        } catch (e) {
          return message.reply(`\`error: ${e.response?.data?.message || e.message}\``);
        }
      }

      if (sub === 'remove') {
        if (!userId) return message.reply('`usage: .friend remove <@user>`');
        try {
          await axios.delete(
            `https://discord.com/api/v9/users/@me/relationships/${userId}`,
            { headers: { Authorization: client.token } }
          );
          return message.reply(`\`removed friend ${userId}\``);
        } catch (e) {
          return message.reply(`\`error: ${e.response?.data?.message || e.message}\``);
        }
      }

      if (sub === 'list') {
        try {
          const res = await axios.get(
            'https://discord.com/api/v9/users/@me/relationships',
            { headers: { Authorization: client.token } }
          );
          const friends = res.data.filter(r => r.type === 1);
          if (!friends.length) return message.reply('`no friends`');
          return message.reply(friends.map(f => `\`${f.user.username} (${f.user.id})\``).join('\n'));
        } catch (e) {
          return message.reply(`\`error: ${e.message}\``);
        }
      }
    }

    if (cmd === 'block') {
      const userId = args[1]?.replace(/[<@!>]/g, '');
      if (!userId) return message.reply('`usage: .block <@user>`');
      try {
        await axios.put(
          `https://discord.com/api/v9/users/@me/relationships/${userId}`,
          { type: 2 },
          { headers: { Authorization: client.token } }
        );
        return message.reply(`\`blocked ${userId}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'unblock') {
      const userId = args[1]?.replace(/[<@!>]/g, '');
      if (!userId) return message.reply('`usage: .unblock <@user>`');
      try {
        await axios.delete(
          `https://discord.com/api/v9/users/@me/relationships/${userId}`,
          { headers: { Authorization: client.token } }
        );
        return message.reply(`\`unblocked ${userId}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'massfriend') {
      const guildId = args[1];
      if (!guildId) return message.reply('`usage: .massfriend <serverid>`');
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return message.reply('`server not found`');
      const members = await guild.members.fetch();
      let sent = 0;
      for (const member of members.values()) {
        if (member.user.bot || member.user.id === client.user.id) continue;
        try {
          await axios.put(
            `https://discord.com/api/v9/users/@me/relationships/${member.user.id}`,
            { type: 1 },
            { headers: { Authorization: client.token } }
          );
          sent++;
          await new Promise(r => setTimeout(r, 1000));
        } catch {}
      }
      return message.reply(`\`sent ${sent} friend requests\``);
    }
  }
};

async function resolveUser(input, client) {
  const userId = input.replace(/[<@!>]/g, '');
  if (/^\d+$/.test(userId)) {
    try { return await client.users.fetch(userId); } catch { return null; }
  }
  const username = input.toLowerCase();
  for (const guild of client.guilds.cache.values()) {
    const found = guild.members.cache.find(m =>
      m.user.username.toLowerCase() === username ||
      m.displayName.toLowerCase() === username
    );
    if (found) return found.user;
  }
  return null;
}
