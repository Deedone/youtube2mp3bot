const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')
const ytdl = require('youtube-dl')





ytdl.exec("https://youtu.be/PizwcirYuGY", ['-x', '--audio-format', 'mp3','--audio-quality=0','-o%(id)s.%(ext)s'], {}, function(err, output) {
  if (err) throw err;
  console.log(output.join('\n'));
  console.log(fs.readdirSync("."))
});

console.log(fs.readdirSync("."))





const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || "590456891:AAEkOXQo2UuYnIw1wnLyKrbKgNyGnJigqbQ"

console.log(PORT,TOKEN);
let bot = 0
let app = express()
app.use(bodyParser.json())
app.all("/",(req,res)=>{
  res.end("nothing to see here")
})

if("HEROKU" in process.env){
  bot = new TelegramBot(TOKEN)
  bot.setWebHook("https://free-audio-bot.herokuapp.com/hook")
}else{
  bot = new TelegramBot(TOKEN,{polling:true})
  bot.deleteWebHook().then(val => console.log("webhook killed:",val))

}
bot.getMe().then(val => console.log(val))

app.all("/hook",(req,res)=>{
  //console.log(req.body)
  res.end("da")
  processMessage(req.body)
}).listen(PORT)

bot.on("message",mes =>{
  console.log("Polled")
  processMessage(mes)
  console.log("Polled end")
})


async function processMessage(m){

  console.log("json = ",m)

  let matches = m.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&|$|\?)/)
  if(matches == null || matches.length() < 2){
    return
  }

  console.log("matches = ",matches)



}
