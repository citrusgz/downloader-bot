const { spawn } = require('child_process');
const fs = require('fs');
const ytdl = require('ytdl-core');

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos o vídeo.');

  // Obtendo a URL do vídeo a partir da mensagem enviada pelo usuário
  if(ctx.message.text.includes('mp4' || 'MP4' || 'Mp4' || 'mP4')){
    var videoUrl = ctx.message.text.split(' ')[1];
  } else {
    var videoUrl = ctx.message.text;
  }
  
  if (!videoUrl || videoUrl.includes('t.me') || videoUrl.includes('threads.net') || videoUrl.includes('fb.watch') || videoUrl.includes('facebook.com') || videoUrl.includes('stories')){
    console.error('URL do não reconhecida.');
    ctx.deleteMessage(message.message_id);
    await ctx.reply('Por favor envie um link reconhecido, como links do Instagram, Pinterest, Tumblr, Youtube, TikTok ou Reddit. Facebook e stories não são suportados.');
    return;
  }

  // Faz nome unico para videos
  function makeVideoName(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  // Remove trackers do link
  const questionMarkIndex = videoUrl.indexOf('?');
  const commercialMarkIndex = videoUrl.indexOf('&');

  // Make possible download YT Music clips
  if (videoUrl.includes('music.youtube')){
    videoUrl = videoUrl.replace('music.', '');
  }

  if (videoUrl.includes('youtube')){
    if (commercialMarkIndex !== -1){
      videoUrl = videoUrl.substring(0, commercialMarkIndex);
    } else{
      videoUrl;
    }
  } else if (questionMarkIndex !== -1) {
    videoUrl = videoUrl.substring(0, questionMarkIndex);
  }

  // Definindo o nome do arquivo de saída como 'video.mp4'
  const fileName = `${makeVideoName(5)}.mp4`;

  // Criando a legenda que será exibida junto com o vídeo
  const caption = `[🔗Fonte](${videoUrl})`;

  // Definindo o caminho do arquivo de cookies para um local acessível
  const cookiesPath = '../cookies.txt';

  // Executando o comando 'yt-dlp' para baixar o vídeo, incluindo o arquivo de cookies
  const ytDlp = spawn('yt-dlp', [
    '--cookies', cookiesPath,
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '-o', fileName,
    videoUrl
  ]);

  // Capturando a saída padrão do comando 'yt-dlp'
  ytDlp.stdout.on('data', (data) => {
    //console.log(`stdout: ${data}`);
  });

  // Capturando a saída de erro do comando 'yt-dlp'
  ytDlp.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // Capturando o evento de encerramento do comando 'yt-dlp'
  ytDlp.on('close', async (code) => {
    console.log(`yt-dlp process exited with code ${code}`);
    if (code === 0) {
      // Verificando o tamanho do arquivo baixado
      const stats = fs.statSync(fileName);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

      if (fileSizeInMB > 49) {
        // Se o arquivo for muito grande, envia uma mensagem informando ao usuário
        const lowResolution = await ctx.reply('O arquivo original é muito grande e não pode ser enviado. Tentando enviar o mesmo vídeo em menor resolução...')
        ctx.deleteMessage(message.message_id)
          .then(() => {
            // Exclui o arquivo baixado
            fs.unlinkSync(fileName);
            console.log(`Arquivo ${fileName} excluído com sucesso.`);
            ctx.deleteMessage(lowResolution.message_id);
          });
        
        try {
          if (videoUrl.includes('music.youtube') || videoUrl.includes('youtube')){
            // Obtendo informações do vídeo usando a biblioteca ytdl
            const info = await ytdl.getInfo(videoUrl);
            const videoTitle = info.videoDetails.title;
            const fileName = `${videoTitle}.mp4`;
    
            // Baixando o vídeo em um formato de menor tamanho (qualidade 18)
            const video = ytdl(videoUrl, { quality: '18' });
    
            // Enviando o vídeo para o usuário
            await ctx.replyWithVideo({ source: video }, { caption: caption, parse_mode: 'Markdown' })
              .then(() => {
                console.log(`Arquivo ${fileName} enviado com sucesso.`);
                ctx.deleteMessage(lowResolution.message_id);
              })
              .catch(async (error) => {
                console.error(`Erro ao enviar o arquivo: ${error}`);
                await ctx.reply(`${error}, deu ruim família.`);
                ctx.deleteMessage(message.message_id);
                return;
              });
            return;
          }
        } catch (error) {
          console.error(`Erro ao obter informações do link: ${error}`);
          await ctx.reply(`Ocorreu um erro ao obter informações do link.`);
          await ctx.reply('Por favor envie um link reconhecido, como links do Instagram, Pinterest, Tumblr, Youtube, TikTok ou Reddit. Facebook e stories não são suportados.');
          ctx.deleteMessage(message.message_id);
          return;
        }
      }

      // Lendo o conteúdo do arquivo baixado
      const video = fs.readFileSync(fileName);

      // Enviando o vídeo para o usuário
      await ctx.replyWithVideo({ source: video }, { caption: caption, parse_mode: 'Markdown' })
        .then(() => {
          // Excluindo o arquivo após o envio
          fs.unlinkSync(fileName);
          console.log(`Arquivo ${fileName} excluído com sucesso.`);
          ctx.deleteMessage(message.message_id);
        })
        .catch(async (error) => {
          console.error(`Erro ao enviar o arquivo: ${error}`);
        });
    } else {
      // Caso ocorra um erro ao baixar o vídeo
      await ctx.deleteMessage(message.message_id);
      await ctx.reply('Ocorreu um erro ao baixar o vídeo.');
    }
  });
};