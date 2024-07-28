# Usar uma imagem base oficial do Node.js
FROM node:20

# Definir o diretório de trabalho dentro do container
WORKDIR /usr/src/bot

# Copiar o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Instalar as demais dependências do projeto
RUN npm install npx

# Instalar o Playwright
RUN npx playwright install

# Instalar dependências do playwright
RUN npx playwright install-deps 

# Instalar Python, pip, venv e ffmpeg
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv ffmpeg

# Criar e ativar um ambiente virtual
RUN python3 -m venv /opt/venv

# Ativar o ambiente virtual e instalar yt-dlp
RUN /opt/venv/bin/pip install yt-dlp

# Adicionar o ambiente virtual ao PATH
ENV PATH="/opt/venv/bin:$PATH"

# Verificar a versão do yt-dlp instalada
RUN yt-dlp --version

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . .

# Expor a porta que a aplicação irá rodar
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]

# Para rodar o container, execute o comando: podman run -p 5000:5000 downloader-bot mas antes, é necessário carregar a imagem com podman build -t downloader-bot .