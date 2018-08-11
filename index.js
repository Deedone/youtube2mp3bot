const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');


const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || "590456891:AAEkOXQo2UuYnIw1wnLyKrbKgNyGnJigqbQ"

console.log(PORT,TOKEN);
let bot = 0
let app = express()
app.use(express.bodyParser())
app.all("/",(req,res)=>{
  res.end("nothing to see here")
})

if("HEROKU" in process.env){
  bot = new TelegramBot(TOKEN)
  bot.setWebHook("https://free-audio-bot.herokuapp.com/hook")
}else{
  bot = new TelegramBot(TOKEN,{polling:true})

}
bot.getMe().then(val => console.log(val))

app.all("/hook",(req,res)=>{
  console.log(req.body)
  res.end("da")
}).listen(PORT)

bot.on("message",mes =>{
  console.log(mes)
})


function processMessage(json){
  console.log(json)
}
