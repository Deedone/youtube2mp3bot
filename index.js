const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const KB = require('./utils/inline-keyboard-generator.js')
const QProcessor = require("./utils/query-processor.js")
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


//Newest API stuff
bot.editMessageMedia = async function(chat_id,message_id, media_id){
  let url = `https://api.telegram.org/bot${TOKEN}/editMessageMedia` +
  `?chat_id=${chat_id}` +
  `&message_id=${message_id}`+
  `&media=` + JSON.stringify({type:"audio",media:media_id})

  let res = await fetch(url).catch(err => console.log(err))
  //console.log(res)
  bot.editMessageReplyMarkup(new KB().getDefault(),{chat_id:chat_id, message_id:message_id})
}


bot.on("message", mes =>{
  new MProcessor().do(mes, bot)
})

bot.on("callback_query",mes=>{
  //console.log("query "+JSON.stringify(mes))
  QProcessor.new(bot,mes)
  bot.answerCallbackQuery(mes.id)
})


app.all("/",(req,res)=>{
  res.end("nothing to see here")
})
.all(`/${TOKEN}`,(req,res)=>{
  res.end("ok")
  //console.log(req.body)
  if('message' in req.body){
    new MProcessor().do(req.body.message, bot)
  }else if('callback_query' in req.body){
    QProcessor.new(bot,req.body.callback_query)
    bot.answerCallbackQuery(req.body.callback_query.id)
  }
})
.listen(PORT)
