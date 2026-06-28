module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'servers') {
      const guilds = client.guilds.cache;
      if (!guilds.size) return message.reply('`not in any servers`');
      const list = guilds.map(g => `\`${g.name} (${g.id})\``).join('\n');
      return message.reply(list);
    }

    if (cmd === 'serverleave') {
      const guildId = args[1];
      if (!guildId) return message.reply('`usage: .serverleave <id>`');
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return message.reply('`server not found`');
      const name = guild.name;
      try {
        await guild.leave();
        return message.reply(`\`left ${name}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'massleave') {
      const confirm = args[1]?.toLowerCase();
      if (confirm !== 'confirm') return message.reply('`this will leave all servers. type .massleave confirm to proceed`');
      const guilds = [...client.guilds.cache.values()];
      let left = 0;
      for (const guild of guilds) {
        try { await guild.leave(); left++; await new Promise(r => setTimeout(r, 1000)); } catch {}
      }
      return message.reply(`\`left ${left} servers\``);
    }

    if (cmd === 'inviteinfo') {
      const invite = args[1];
      if (!invite) return message.reply('`usage: .inviteinfo <invite>`');
      try {
        const code = invite.split('/').pop();
        const fetched = await client.fetchInvite(code);
        const lines = [
          `\`server: ${fetched.guild?.name}\``,
          `\`code: ${fetched.code}\``,
          `\`members: ${fetched.memberCount}\``,
          `\`online: ${fetched.presenceCount}\``,
          `\`channel: ${fetched.channel?.name}\``,
          `\`inviter: ${fetched.inviter?.username || 'unknown'}\``,
        ].join('\n');
        return message.reply(lines);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'joinserver') {
      const invite = args[1];
      if (!invite) return message.reply('`usage: .joinserver <invite>`');
      try {
        const code = invite.split('/').pop();
        await client.acceptInvite(code);
        return message.reply(`\`joined server via ${code}\``);
      } catch (e) {
        return message.reply(`\`error: ${e.message}\``);
      }
    }

    if (cmd === 'serverinfo') {
      const guild = message.guild;
      if (!guild) return message.reply('`must be in a server`');
      const lines = [
        `\`name: ${guild.name}\``,
        `\`id: ${guild.id}\``,
        `\`owner: ${guild.ownerId}\``,
        `\`members: ${guild.memberCount}\``,
        `\`channels: ${guild.channels.cache.size}\``,
        `\`roles: ${guild.roles.cache.size}\``,
        `\`created: ${guild.createdAt.toDateString()}\``,
        `\`boost level: ${guild.premiumTier}\``,
        `\`boosts: ${guild.premiumSubscriptionCount}\``,
      ].join('\n');
      return message.reply(lines);
    }

    if (cmd === 'membercount') {
      const guild = message.guild;
      if (!guild) return message.reply('`must be in a server`');
      return message.reply(`\`${guild.name}: ${guild.memberCount} members\``);
    }

    if (cmd === 'roles') {
      const input = args[1];
      if (!input) return message.reply('`usage: .roles <@user|userid>`');
      if (!message.guild) return message.reply('`must be in a server`');
      const userId = input.replace(/[<@!>]/g, '');
      const member = message.guild.members.cache.get(userId);
      if (!member) return message.reply('`member not found in this server`');
      const roles = member.roles.cache.filter(r => r.id !== message.guild.id).map(r => `\`${r.name}\``).join(', ');
      return message.reply(roles || '`no roles`');
    }

    if (cmd === 'perms') {
      const input = args[1];
      if (!input) return message.reply('`usage: .perms <@user|userid>`');
      if (!message.guild) return message.reply('`must be in a server`');
      const userId = input.replace(/[<@!>]/g, '');
      const member = message.guild.members.cache.get(userId);
      if (!member) return message.reply('`member not found`');
      const perms = member.permissionsIn(message.channel).toArray();
      return message.reply(perms.map(p => `\`${p}\``).join('\n') || '`no permissions`');
    }
  }
};
