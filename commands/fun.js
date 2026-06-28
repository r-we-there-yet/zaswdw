module.exports = {
  async handle(message, args, client) {
    const cmd = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ');

    if (cmd === 'shrug') return message.channel.send('¯\\_(ツ)_/¯');
    if (cmd === 'lenny') return message.channel.send('( ͡° ͜ʖ ͡°)');
    if (cmd === 'tableflip') return message.channel.send('(╯°□°）╯︵ ┻━┻');
    if (cmd === 'unflip') return message.channel.send('┬─┬ ノ( ゜-゜ノ)');
    if (cmd === 'invisible') return message.channel.send('\u200b');

    if (cmd === 'mock') {
      if (!text) return message.reply('`usage: .mock <text>`');
      const mocked = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
      return message.channel.send(mocked);
    }

    if (cmd === 'reverse') {
      if (!text) return message.reply('`usage: .reverse <text>`');
      return message.channel.send(text.split('').reverse().join(''));
    }

    if (cmd === 'big') {
      if (!text) return message.reply('`usage: .big <text>`');
      const map = { a:'🇦',b:'🇧',c:'🇨',d:'🇩',e:'🇪',f:'🇫',g:'🇬',h:'🇭',i:'🇮',j:'🇯',k:'🇰',l:'🇱',m:'🇲',n:'🇳',o:'🇴',p:'🇵',q:'🇶',r:'🇷',s:'🇸',t:'🇹',u:'🇺',v:'🇻',w:'🇼',x:'🇽',y:'🇾',z:'🇿',' ':' ' };
      const out = text.toLowerCase().split('').map(c => map[c] || c).join(' ');
      return message.channel.send(out);
    }

    if (cmd === 'zalgo') {
      if (!text) return message.reply('`usage: .zalgo <text>`');
      const above = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̉','͆','̊','̋','̌','͂','̓','̈́','͊','͋','͌','̃','̂','̌','͐','̀','́','̂','̃','̄','̅','̆','̇','̈','̉','̊','̋','̌','̍','̎','̏','̐','̑','̒'];
      const out = text.split('').map(c => c + above[Math.floor(Math.random() * above.length)] + above[Math.floor(Math.random() * above.length)]).join('');
      return message.channel.send(out);
    }

    if (cmd === 'clap') {
      if (!text) return message.reply('`usage: .clap <text>`');
      return message.channel.send(text.split(' ').join(' 👏 '));
    }

    if (cmd === 'spoiler') {
      if (!text) return message.reply('`usage: .spoiler <text>`');
      const out = text.split('').map(c => `||${c}||`).join('');
      return message.channel.send(out);
    }

    if (cmd === 'ascii') {
      if (!text) return message.reply('`usage: .ascii <text>`');
      const figlet = require('figlet');
      figlet(text, (err, result) => {
        if (err || !result) return message.reply('`error generating ascii`');
        message.channel.send('```\n' + result + '\n```');
      });
      return;
    }

    if (cmd === 'greentext') {
      if (!text) return message.reply('`usage: .greentext <text>`');
      const lines = text.split('|').map(l => `> ${l.trim()}`).join('\n');
      return message.channel.send(lines);
    }

    if (cmd === 'copypasta') {
      if (!text) return message.reply('`usage: .copypasta <text>`');
      const out = text.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('') + ' 😂👌💯';
      return message.channel.send(out);
    }
  }
};
