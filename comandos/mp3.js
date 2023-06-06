const ytdl = require('ytdl-core');

module.exports = async (ctx) => {
  // Obtendo a URL do áudio a partir da mensagem enviada pelo usuário
  const audioUrl = ctx.message.text.split(' ')[1];

  try {
    // Obtendo informações do áudio usando a biblioteca ytdl
    const info = await ytdl.getInfo(audioUrl);
    const videoTitle = info.videoDetails.title;
    const fileName = `${videoTitle}.mp3`;

    // Baixando o áudio
    const stream = ytdl(audioUrl, { quality: 'highestaudio',filter: 'audioonly' });

    // Enviando o áudio para o usuário
    ctx.replyWithAudio({ source: stream, filename: fileName })
      .then(() => {
        console.log(`Arquivo ${fileName} enviado com sucesso.`);
      })
      .catch((error) => {
        console.error(`Erro ao enviar o arquivo: ${error}`);
        ctx.reply(`${error}, deu ruim família.`);
      });
  } catch (error) {
    console.error(`Erro ao obter informações do link: ${error}`);
    ctx.reply(`Ocorreu um erro ao obter informações do link. Envie novamente um link do YouTube.`);
  }
};