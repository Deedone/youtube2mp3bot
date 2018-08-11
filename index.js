const https = require('https');
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');


const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || "590456891:AAEkOXQo2UuYnIw1wnLyKrbKgNyGnJigqbQ"

console.log(PORT,TOKEN);
let bot = 0



if("HEROKU" in process.env){
  console.log("on heroku")
  https.createServer({}, (req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);
  bot = new TelegramBot(TOKEN,{polling:true})


}else{
  bot = new TelegramBot(TOKEN,{polling:true})
}

bot.on("message",mes =>{
  console.log(mes)
})

bot.getMe().then(val => console.log(val))
