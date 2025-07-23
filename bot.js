// Prof-Tech MVAI v1.1-upgrade (Stable)
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3010;

// 🔧 Memory and Config
let memory = {};
let settings = {};

// 🔁 Helper Functions
function formatTime() {
  const now = new Date();
  return now.toLocaleString('en-GB', { timeZone: 'Africa/Lagos' });
}
function applyFont(text, font) {
  switch (font) {
    case 'bold': return text.replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x1D400 - 0x41));
    case 'cursive': return text.replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x1D4D0 - 0x61));
    default: return text;
  }
}
function storeHistory(userId, input) {
  if (!memory[userId]) memory[userId] = [];
  memory[userId].unshift(input);
  if (memory[userId].length > 10) memory[userId].pop();
}

// 🔘 Start Command
bot.start((ctx) => {
  settings[ctx.chat.id] ||= { font: 'normal', lang: 'en', mode: 'friendly' };
  const now = formatTime();
  ctx.reply(`👋 Welcome to Prof-Tech MVAI\n🕒 ${now}`);
});

// 🔘 Version
bot.command('version', (ctx) => {
  ctx.reply(`🧠 Prof-Tech MVAI Version: v1.1-upgrade`);
});

// 🔘 Help
bot.command('help', (ctx) => {
  ctx.reply(`
📜 Commands:
/start — Welcome
/menu — Inline Menu
/fun — Random Joke or Quote
/version — Bot Version
/setfont <name>
/setmode <type>
/setlang <code>
/history — Last 10 prompts
/clearmemory — Clear history
  `.trim());
});

// 🔘 Fun
bot.command('fun', async (ctx) => {
  const jokes = [
    "😂 Why don’t programmers like nature? It has too many bugs!",
    "💡 'Knowledge is power.'",
    "🤣 Debugging: Removing the needles from the haystack."
  ];
  const pick = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(pick);
});

// 🔘 Menu
bot.command('menu', (ctx) => {
  ctx.reply('⚙️ Settings:', Markup.inlineKeyboard([
    [Markup.button.callback('🎨 Font', 'SET_FONT')],
    [Markup.button.callback('🎯 Mode', 'SET_MODE')],
    [Markup.button.callback('🌐 Language', 'SET_LANG')],
  ]));
});

// 🔘 History
bot.command('history', (ctx) => {
  const hist = memory[ctx.chat.id] || [];
  if (hist.length === 0) return ctx.reply('📭 No history yet.');
  const formatted = hist.map((t, i) => `#${i + 1}: ${t}`).join('\n');
  ctx.reply(`📚 Your Recent Prompts:\n${formatted}`);
});

// 🔘 Clear Memory
bot.command('clearmemory', (ctx) => {
  memory[ctx.chat.id] = [];
  ctx.reply('🧠 Memory cleared.');
});

// Inline actions
bot.action('SET_FONT', (ctx) => {
  ctx.editMessageText('Choose a font:', Markup.inlineKeyboard([
    [Markup.button.callback('Bold', 'FONT_bold')],
    [Markup.button.callback('Cursive', 'FONT_cursive')],
  ]));
});

bot.action('SET_MODE', (ctx) => {
  ctx.editMessageText('Choose a mode:', Markup.inlineKeyboard([
    [Markup.button.callback('Friendly', 'MODE_friendly')],
    [Markup.button.callback('Strict', 'MODE_strict')],
    [Markup.button.callback('Pro', 'MODE_pro')],
  ]));
});

bot.action('SET_LANG', (ctx) => {
  ctx.editMessageText('Choose a language:', Markup.inlineKeyboard([
    [Markup.button.callback('🇬🇧 English', 'LANG_en')],
    [Markup.button.callback('🇳🇬 Yoruba', 'LANG_yor')],
    [Markup.button.callback('🇳🇬 Hausa', 'LANG_ha')],
  ]));
});

// Handle Font/Mode/Lang set
bot.action(/FONT_(.+)/, (ctx) => {
  const font = ctx.match[1];
  settings[ctx.chat.id].font = font;
  ctx.reply(`✅ Font set to ${font}`);
});
bot.action(/MODE_(.+)/, (ctx) => {
  const mode = ctx.match[1];
  settings[ctx.chat.id].mode = mode;
  ctx.reply(`✅ Mode set to ${mode}`);
});
bot.action(/LANG_(.+)/, (ctx) => {
  const lang = ctx.match[1];
  settings[ctx.chat.id].lang = lang;
  ctx.reply(`✅ Language set to ${lang}`);
});

// 🧠 Main AI reply
bot.on('text', async (ctx) => {
  const q = ctx.message.text;
  storeHistory(ctx.chat.id, q);
  const userFont = settings[ctx.chat.id]?.font || 'normal';

  try {
    const res = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      contents: [{ parts: [{ text: q }] }]
    });
    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '🤖 No response';
    ctx.reply(applyFont(reply, userFont));
  } catch (err) {
    ctx.reply('⚠️ AI Error: Try again later.');
  }
});

// Server
app.get('/', (req, res) => res.send('Prof-Tech MVAI is running.'));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Start bot
bot.launch();
