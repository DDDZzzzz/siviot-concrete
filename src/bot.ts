import 'dotenv/config';
import { Bot } from '@maxhub/max-bot-api';

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('Не найден BOT_TOKEN в файле .env');
}

const bot = new Bot(token);

bot.command('start', async (ctx) => {
  await ctx.reply(
    'Добро пожаловать! 👋\n\n' +
    'Это система управления бетонным заводом.\n\n' +
    'Пока работает тестовая версия бота.'
  );
});

bot.command('hello', async (ctx) => {
  await ctx.reply('Бот работает! 🚀');
});

bot.on('message_created', async (ctx) => {
  const text = ctx.message?.body?.text?.trim();

  if (!text) {
    return;
  }

  if (text.toLowerCase() === 'привет') {
    await ctx.reply(
      'Привет! 👋\n\n' +
      'Я бот системы управления бетонным заводом.'
    );

    return;
  }

  await ctx.reply(
    'Сообщение получено.\n\n' +
    'Сейчас это тестовая версия бота.'
  );
});

console.log('Запускаем MAX-бота...');

bot.start();

console.log('MAX-бот запущен и ожидает сообщения.');