const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')


const Keyboards = require("./utils/inline-keyboard-generator.js")
const MProcessor = require("./utils/message-processor.js")


const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || "0"
const HOOK_URL = process.env.DOMAIN_URL +'/' + TOKEN



console.log(PORT,TOKEN);


let bot = 0
let app = express()
app.use(bodyParser.json())


if(!("BOT_FORCE_POLLING" in process.env && process.env.BOT_FORCE_POLLING == 1)){
  console.log("USING WEBHOOKS ON "+HOOK_URL)
  bot = new TelegramBot(TOKEN)
  bot.setWebHook(HOOK_URL,{allowed_updates:["message","callback_query"]})
}else{
  console.log("USING LONG POLLING")
  bot = new TelegramBot(TOKEN,{polling:true})
  bot.deleteWebHook().then(val => console.log("webhook killed:",val))
  bot.on('polling_error', (error) => {
    console.log(error);  // => 'EFATAL'
  });

}
bot.getMe().then(val => console.log("Info about me:",val))

const KGen = new Keyboards(bot)

bot.on("message",mes =>{
  new MProcessor(mes, bot)
})

bot.on("callback_query",mes=>{
  console.log("query "+JSON.stringify(mes))
})


app.all("/",(req,res)=>{
  res.end("nothing to see here")
})
.all(`/${TOKEN}`,(req,res)=>{
  res.end("ok")
  console.log(req.body)
  new MProcessor(req.body.message, bot)
})
.listen(PORT)
