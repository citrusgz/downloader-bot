const { spawn } = require('child_process');
const fs = require('fs');

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos a música.');

  // Obtendo a URL do áudio a partir da mensagem enviada pelo usuário
  let audioUrl;
  if (ctx.message.text.toLowerCase().includes('mp3')) {
    audioUrl = ctx.message.text.split(' ')[1];
  } else {
    audioUrl = ctx.message.text;
  }

  try {
    const metadata = await new Promise((resolve, reject) => {
      const ytDlpProcess = spawn('yt-dlp', ['-j', audioUrl]);

      let data = '';
      ytDlpProcess.stdout.on('data', (chunk) => {
        data += chunk;
      });

      ytDlpProcess.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`yt-dlp process exited with code ${code}`));
        }
      });
    });

    const audioTitle = metadata.title.replace(/[<>:"\/\\|?*]+/g, '');
    const audioFileName = `${audioTitle}.mp3`;

    // Baixar o áudio usando yt-dlp
    const downloadProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', audioFileName, audioUrl]);

    downloadProcess.on('close', async (code) => {
      if (code === 0) {
        console.log('Audio download finished');
        try {
          await ctx.replyWithDocument({ source: fs.createReadStream(audioFileName), filename: audioFileName });
          console.log('Audio sent to user');
          ctx.deleteMessage(message.message_id);
          fs.unlinkSync(audioFileName);
        } catch (error) {
          console.error('Error sending audio:', error);
        }
      } else {
        console.error(`yt-dlp process exited with code ${code}`);
      }
    });

  } catch (error) {
    ctx.deleteMessage(message.message_id);
    console.error(`Erro ao obter informações do link: ${error}`);
    await ctx.reply(`Ocorreu um erro ao obter informações da música. Envie novamente um link do YouTube.`);
  }
};