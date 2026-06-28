module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();

    // PURGE
    if (cmd === 'purge') {
      const sub = args[1]?.toLowerCase();

      if (sub === 'all') {
        await message.reply('`purging all your messages in this channel...`');
        let deleted = 0;
        let before = null;
        while (true) {
          const options = { limit: 100 };
          if (before) options.before = before;
          const msgs = await message.channel.messages.fetch(options);
          if (!msgs.size) break;
          const mine = msgs.filter(m => m.author.id === client.user.id);
          if (!mine.size) {
            before = msgs.last().id;
            if (msgs.size < 100) break;
            continue;
          }
          for (const m of mine.values()) {
            try { await m.delete(); deleted++; await new Promise(r => setTimeout(r, 500)); } catch {}
          }
          before = msgs.last().id;
          if (msgs.size < 100) break;
        }
        return message.channel.send(`\`purged ${deleted} messages\``);
      }

      if (sub === 'match') {
        const keyword = args.slice(2).join(' ');
        if (!keyword) return message.reply('`usage: .purge match <text>`');
        let deleted = 0;
        let before = null;
        while (true) {
          const options = { limit: 100 };
          if (before) options.before = before;
          const msgs = await message.channel.messages.fetch(options);
          if (!msgs.size) break;
          const mine = msgs.filter(m => m.author.id === client.user.id && m.content.includes(keyword));
          for (const m of mine.values()) {
            try { await m.delete(); deleted++; await new Promise(r => setTimeout(r, 500)); } catch {}
          }
          before = msgs.last().id;
          if (msgs.size < 100) break;
        }
        return message.channel.send(`\`purged ${deleted} messages matching "${keyword}"\``);
      }

      const n = parseInt(sub);
      if (isNaN(n) || n < 1) return message.reply('`usage: .purge <n> | .purge all | .purge match <text>`');

      let deleted = 0;
      let before = message.id;
      while (deleted < n) {
        const msgs = await message.channel.messages.fetch({ limit: Math.min(100, n - deleted), before });
        if (!msgs.size) break;
        const mine = msgs.filter(m => m.author.id === client.user.id);
        for (const m of mine.values()) {
          if (deleted >= n) break;
          try { await m.delete(); deleted++; await new Promise(r => setTimeout(r, 500)); } catch {}
        }
        before = msgs.last().id;
        if (msgs.size < 100) break;
      }
      try { await message.delete(); } catch {}
      return;
    }

    // NUKE - all messages across entire server
    if (cmd === 'nuke') {
      if (!message.guild) return message.reply('`must be in a server`');
      await message.reply('`nuking all your messages in this server...`');
      const channels = message.guild.channels.cache.filter(c => c.isText());
      let total = 0;
      for (const ch of channels.values()) {
        let before = null;
        while (true) {
          try {
            const options = { limit: 100 };
            if (before) options.before = before;
            const msgs = await ch.messages.fetch(options);
            if (!msgs.size) break;
            const mine = msgs.filter(m => m.author.id === client.user.id);
            for (const m of mine.values()) {
              try { await m.delete(); total++; await new Promise(r => setTimeout(r, 500)); } catch {}
            }
            before = msgs.last().id;
            if (msgs.size < 100) break;
          } catch { break; }
        }
      }
      return message.channel.send(`\`nuked ${total} messages across server\``);
    }

    // DELPINNED
    if (cmd === 'delpinned') {
      const pins = await message.channel.messages.fetchPinned();
      const mine = pins.filter(m => m.author.id === client.user.id);
      let deleted = 0;
      for (const m of mine.values()) {
        try { await m.unpin(); await m.delete(); deleted++; await new Promise(r => setTimeout(r, 500)); } catch {}
      }
      return message.reply(`\`deleted ${deleted} pinned messages\``);
    }
  }
};
