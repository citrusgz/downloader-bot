const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');   

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos o vídeo.');

  // Obtendo a URL do vídeo a partir da mensagem enviada pelo usuário
  if(ctx.message.text.includes('mp4' || 'MP4' || 'Mp4' || 'mP4')){
    var videoUrl = ctx.message.text.split(' ')[1];
  } else {
    var videoUrl = ctx.message.text;
  }
  
  if (!videoUrl || videoUrl.includes('t.me') || videoUrl.includes('threads.net') || videoUrl.includes('fb.watch') || videoUrl.includes('facebook.com')){
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

  // Função para verificar se o ambiente é um container (Docker ou Podman)
  function isContainer() {
    try {
      // Verifica se o arquivo /.dockerenv existe (Docker)
      if (fs.existsSync('/.dockerenv')) {
        return 'docker';
      }

      // Lê o arquivo /proc/1/cgroup para verificar se há referência a Podman ou Docker
      const cgroupContent = fs.readFileSync('/proc/1/cgroup', 'utf8');
      if (cgroupContent.includes('podman')) {
        return 'podman';
      } else if (cgroupContent.includes('docker')) {
        return 'docker';
      }

      // Se nenhuma das condições acima for atendida, assume que não é um container
      return 'none';
    } catch (err) {
      // Se houver um erro na leitura do arquivo, assume que não é um container
      console.error('Não foi possível verificar o ambiente. Assumindo que não é um container.');
      return 'none';
    }
  }

  // Definindo o caminho dos cookies com base no ambiente
  let cookiesPath;

  const containerType = isContainer();

  if (containerType === 'podman') {
    cookiesPath = '/usr/src/bot/cookies.txt';
  } else if (containerType === 'docker') {
    cookiesPath = '/usr/src/bot/cookies.txt';
  } else {
    cookiesPath = path.join(__dirname, '../cookies.txt');
  }

  // Executando o comando 'yt-dlp' para baixar o vídeo, incluindo o arquivo de cookies
  const ytDlp = spawn('yt-dlp', [
    '--cookies', cookiesPath,
    '--cookies-from-browser', 'firefox',
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
    let fileExists = false;
    try {
      fileExists = fs.existsSync(fileName);
    } catch (e) {
      fileExists = false;
    }

    if (fileExists) {
      // Verificando o tamanho do arquivo baixado
      let fileSizeInMB = 0;
      try {
        const stats = fs.statSync(fileName);
        const fileSizeInBytes = stats.size;
        fileSizeInMB = fileSizeInBytes / (1024 * 1024);
      } catch (error) {
        ctx.deleteMessage(message.message_id)
        console.error(`Erro ao obter informações do arquivo: ${error}`);
        await ctx.reply('O link enviado não pertence a um vídeo.');
        return;
      }
      if (fileSizeInMB > 49) {
        // Se o arquivo for muito grande, envia uma mensagem informando ao usuário
        const lowResolution = await ctx.reply('O arquivo original é muito grande e não pode ser enviado. Tentando enviar o mesmo vídeo em menor resolução...')
        ctx.deleteMessage(message.message_id)
          .then(() => {
            // Exclui o arquivo baixado
            fs.unlinkSync(fileName);
            console.log(`Arquivo ${fileName} excluído com sucesso.`);
          });
        
          try {
            const smallVideo = `${makeVideoName(5)}.mp4`;
            const ytDlpProcess = spawn('yt-dlp', ['-f', 'worstvideo+worstaudio', '-o', smallVideo, videoUrl]);
        
            ytDlpProcess.on('close', async (code) => {
              if (code === 0) {
                console.log('Download finished');
                try {
                  await ctx.replyWithVideo({ source: smallVideo }, { caption: caption, parse_mode: 'Markdown' })
                  console.log('Video sent to user');
                  ctx.deleteMessage(lowResolution.message_id);
                  fs.unlinkSync(smallVideo);
                } catch (error) {
                  console.error('Error sending video:', error);
                }
              } else {
                console.error(`yt-dlp process exited with code ${code}`);
              }
            });
        
            ytDlpProcess.stdin.end();
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