// Importando os módulos necessários
const Telegraf = require('telegraf');
const config = require('./config');
const mp4 = require('./comandos/mp4');
const mp3 = require('./comandos/mp3');
const curto = require('./comandos/curto');
const micro = require('./comandos/micro');
const ru = require('./comandos/ru');
const error = require('./comandos/error');
// const local = require('./comandos/local');

// Criando uma nova instância do bot com o token fornecido
const bot = new Telegraf(config.botToken);

// Middleware para lidar com comandos não reconhecidos
bot.use(async (ctx, next) => {
  const validCommands = ['/start', '/help', '/mp4', '/mp3', '/curto', '/micro', '/ru', '/erro'];

  if (ctx.message && ctx.message.text) {
    config.logInteraction(ctx);
    const command = ctx.message.text.split(' ')[0];
    const toLowerCaseCommand = command.toLowerCase();

    if (!validCommands.includes(toLowerCaseCommand)) {
      try {
        const chat = await ctx.getChat();
        if (chat && chat.type === 'private' && chat.blocked) {
          console.log("O bot foi bloqueado pelo usuário.");
        } else {
          await ctx.reply("Comando inválido. Use o comando /help para ver as instruções ou escute às instruções do áudio que se segue.");
          await ctx.replyWithAudio({source: "./comandos/instructions.mp3"});
        }
      } catch (error) {
        // Lidar com erro ao verificar o status do chat
        console.error("Erro ao verificar o status do chat:", error.message);
      }
    } else {
      next();
    }
  } else {
    // Lidar com mensagens sem texto, se necessário
    ctx.reply("Por favor, envie um comando válido.");
    config.logInteraction(ctx);
  }
});

// Iniciar o bot
bot.start((ctx) => {
  config.logInteraction(ctx);
  ctx.reply('Bem-vindo! Use o comando /help para ver as instruções.');
});

// Lidar com o comando /help
bot.command('help', (ctx) => {
  config.logInteraction(ctx, '/help');
  const helpMessage = `
  🤖 Bem-vindo ao bot! Aqui estão as instruções disponíveis:

  /mp3 <URL> - Baixa o áudio de uma rede social (ex.: Youtube, Instagram, Twitter, TikTok e outros). 🎧
  
  /mp4 <URL> - Baixa o vídeo de uma rede social (ex.: Youtube, Instagram, Twitter, TikTok e outros). 🎬

  ⚠️ DEVIDO A RECENTES ALTERAÇÕES NA API DO TWITTER, O DOWNLOAD PODE APRESENTAR INSTABILIDADES ⚠️
  
  /curto <URL> - Encurta um link. 🔗
  
  🎓 Se você estuda na FURG, existem comandos relevantes como:
  
  /ru - Mostra os cardápios dos RUs quando disponíveis. 🍲
  
  /micro - Mostra os horários do ônibus interno. 🕰️
  
  Aproveite as funcionalidades do nosso bot! 🤩✨
  `;
  ctx.replyWithMarkdown(helpMessage);
});

// Registrar os comandos
bot.command(['mp4', 'MP4', 'Mp4'], mp4);
bot.command(['mp3', 'MP3', 'Mp3'],mp3);
bot.command(['curto', 'CURTO', 'Curto'], curto);
bot.command(['micro', 'MICRO', 'Micro'], micro);
bot.command(['ru', 'RU', 'Ru', 'rU'], ru);
bot.command(['erro', 'ERRO'], error);
// bot.command(['local', 'LOCAL'], local);

// Iniciando o bot
bot.launch();
