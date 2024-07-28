// Importando os módulos necessários
const Telegraf = require('telegraf');
const config = require('./config');
const mp4 = require('./comandos/mp4');
const mp3 = require('./comandos/mp3');
const curto = require('./comandos/curto');
const error = require('./comandos/error');
const playlist = require('./comandos/playlist');
const rateLimit = require('telegraf-ratelimit');

// Criando uma nova instância do bot com o token fornecido
const bot = new Telegraf(config.botToken);

const limitConfig = {
  window: 3000,
  limit: 2,
  onLimitExceeded: async (ctx, next) => {
    try {
      await ctx.reply('Rate limit excedido. Você não poderá gerar mais comandos pelos próximos 5 minutos 😡');
    } catch (err) {
      handleBotErrors(err, ctx);
    }
    ctx.skip = true; // Ignore messages from the user for the next 5 minutes
    setTimeout(() => {
      ctx.skip = false; // Reset the skip flag after 5 minutes
    }, 300000);
  }
};
bot.use(rateLimit(limitConfig));

// Função para lidar com erros do bot
const handleBotErrors = (err, ctx) => {
  if (err.code === 403) {
    console.log(`Bot foi removido do grupo ou bloqueado pelo usuário: ${ctx.chat.id}`);
  } else {
    console.error("Erro inesperado:", err.message);
  }
};

// Middleware para lidar com comandos não reconhecidos
bot.use(async (ctx, next) => {
  const validCommands = ['/start', '/help', '/mp4', '/mp3', '/curto', '/erro', '/playlist'];

  if (ctx.message && ctx.message.text) {
    config.logInteraction(ctx);
    const command = ctx.message.text.split(' ')[0].toLowerCase();
    const enabledSocialMediaDownload = ['youtube.com', 'youtu.be', 'x.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com']
      .some(domain => ctx.message.text.includes(domain));

    if (!validCommands.includes(command) && !enabledSocialMediaDownload) {
      try {
        await ctx.reply("Por favor, envie um comando válido.");
      } catch (err) {
        handleBotErrors(err, ctx);
      }
    } else {
      const commandPromises = [];
      if (enabledSocialMediaDownload && !validCommands.includes(command)) {
        commandPromises.push(mp4(ctx));
        if (ctx.message.text.includes('youtube.com') || ctx.message.text.includes('youtu.be')) {
          commandPromises.push(mp3(ctx));
        }
      }

      try {
        await Promise.all(commandPromises);
        next();
      } catch (err) {
        handleBotErrors(err, ctx);
      }
    }
  }
});

// Iniciar o bot
bot.start(async (ctx) => {
  try {
    await ctx.reply('Bem-vindo! Use o comando /help para ver as instruções.');
  } catch (err) {
    handleBotErrors(err, ctx);
  }
});

// Lidar com o comando /help
bot.command('help', async (ctx) => {
  const helpMessage = `
  🤖 Bem-vindo ao bot! Aqui estão as instruções disponíveis:

  /mp3 <URL> - Baixa o áudio do YouTube. 🎧
  
  /mp4 <URL> - Baixa o vídeo de uma rede social (ex.: Youtube, Instagram, Twitter, TikTok e outros). 🎬

  /playlist <URL> - Baixa uma playlist de músicas direto do YouTube. 📺

  ⚠️ DEVIDO A RECENTES ALTERAÇÕES NA API DO TWITTER, O DOWNLOAD PODE APRESENTAR INSTABILIDADES ⚠️
  
  /curto <URL> - Encurta um link. 🔗
  
  `;
  try {
    await ctx.replyWithMarkdown(helpMessage);
  } catch (err) {
    handleBotErrors(err, ctx);
  }
});

// Registrar os comandos
bot.command(['mp4', 'MP4', 'Mp4'], mp4);
bot.command(['mp3', 'MP3', 'Mp3'], mp3);
bot.command(['curto', 'CURTO', 'Curto'], curto);
bot.command(['erro', 'ERRO'], error);
bot.command(['playlist', 'PLAYLIST', 'Playlist'], playlist);

// Iniciando o bot
bot.launch();
bot.startPolling();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
