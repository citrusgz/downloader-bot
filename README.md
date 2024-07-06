
# How to setup

To run this project locally, it needs the config.js. To create these file run the following command:to run this project locally, it needs the config.js. To create these file run the following command: `cp config.js.example config.js`




```bash
module.exports = {
  botToken: 'Your_bot_token',
  ownerID: 'Your_ID',
  logInteraction: function(ctx) {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;
    const timestamp = new Date().toLocaleString();
    const command = ctx.update.message.text;
    console.log(`ID do usuário: ${userId}`);
    console.log(`Username do usuário: ${username}`);
    console.log(`Primeiro nome: ${firstName}`);
    console.log(`Último nome: ${lastName}`);
    console.log(`Horário: ${timestamp}`);
    console.log(`Comando: ${command}`);
  }
};
```


After added the config file in the project. Make sure you have the NodeJS and npm packages installed. If it is ok, just run `npm install` and it is done!  🎉
