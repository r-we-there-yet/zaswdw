const storage = require('../storage');
const axios = require('axios');

module.exports = {
  async handle(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'on' || sub === 'off') {
      await storage.update('nitrosnipe', { enabled: sub === 'on' });
      return message.reply(`\`nitrosnipe ${sub}\``);
    }

    if (sub === 'log') {
      const data = await storage.get();
      const log = data.nitrosnipe.log || [];
      if (!log.length) return message.reply('`no nitro snipe attempts yet`');
      const out = log.slice(-10).map(l => `\`${l.status} | ${l.code} | ${l.ms}ms\``).join('\n');
      return message.reply(out);
    }

    if (sub === 'speed') {
      const data = await storage.get();
      const log = (data.nitrosnipe.log || []).filter(l => l.ms);
      if (!log.length) return message.reply('`no data yet`');
      const avg = Math.round(log.reduce((a, b) => a + b.ms, 0) / log.length);
      return message.reply(`\`avg claim speed: ${avg}ms\``);
    }

    if (sub === 'check') {
      const link = args[1];
      if (!link) return message.reply('`usage: .nitrosnipe check <link>`');
      const code = link.split('/').pop();
      const result = await attemptClaim(code, client.token);
      return message.reply(`\`${result.status} | ${code}\``);
    }

    return message.reply('`usage: .nitrosnipe <on/off> | .nitrosnipe log | .nitrosnipe speed | .nitrosnipe check <link>`');
  },

  async onMessage(message, client) {
    const data = await storage.get();
    if (!data.nitrosnipe.enabled) return;

    const giftRegex = /discord\.gift\/([a-zA-Z0-9]+)/g;
    let match;
    while ((match = giftRegex.exec(message.content)) !== null) {
      const code = match[1];
      const start = Date.now();
      const result = await attemptClaim(code, client.token);
      const ms = Date.now() - start;

      const log = data.nitrosnipe.log || [];
      log.push({ code, status: result.status, ms, timestamp: Date.now() });
      await storage.update('nitrosnipe', { log: log.slice(-50) });

      try {
        const mainUser = await client.users.fetch(process.env.MAIN_ID);
        const dmChannel = await mainUser.createDM();
        await dmChannel.send(`\`nitro snipe: ${result.status} | ${code} | ${ms}ms\``);
      } catch {}
    }
  }
};

async function attemptClaim(code, token) {
  try {
    const res = await axios.post(
      `https://discord.com/api/v9/entitlements/gift-codes/${code}/redeem`,
      {},
      { headers: { Authorization: token, 'Content-Type': 'application/json' } }
    );
    return { status: 'claimed', data: res.data };
  } catch (e) {
    const msg = e.response?.data?.message || 'unknown error';
    if (msg.includes('Unknown Gift Code')) return { status: 'invalid' };
    if (msg.includes('already purchased')) return { status: 'already owned' };
    if (msg.includes('This gift has been redeemed')) return { status: 'already claimed' };
    return { status: msg };
  }
}
