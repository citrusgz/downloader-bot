FROM roneikunkel/node20-with-yt-dlp:latest

WORKDIR /usr/src/bot

COPY . .

COPY package*.json ./

RUN npm install

EXPOSE 5000

CMD sh -c "node index.js"
