const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')
const ytdl = require('youtube-dl')
const child_process = require('child_process');



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


  if('audio' in m && 'caption' in m){
    let data = m.caption.split(" ")
    bot.sendAudio(data[0],m.audio.file_id)
  }



  if(!('text' in m)){
    return
  }
  let matches = m.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&|$|\?)/)


  if(matches != null && matches.length == 2){
    bot.sendMessage(m.chat.id,"Downloading")
    ytdl.exec(matches[0], ['-x', '--audio-format', 'mp3','--audio-quality=0','-o%(id)s.%(ext)s'], {},async (err, output) => {
      if (err) throw err;
      let mes = await bot.sendMessage(m.chat.id,"Uploading to tg servers - 0%")
    //  console.log(mes)
      ytdl.getInfo(matches[0],(err, info) => {
        if (err) throw err;
        let filename = matches[1]+".mp3"
        console.log("python3",['client.py',filename,m.chat.id,info.title,matches[1]])
        let child = child_process.spawn("python3",['client.py',filename,m.chat.id,info.title,matches[1]],{
          stdio:'pipe'
        })

        child.stdout.on('data',data => {
          let str = data.toString()
          let arr = str.split(" ")
          let percent = Math.floor(parseInt(arr[0])/parseInt(arr[1])*100)
          bot.editMessageText(`Uploading to tg servers - ${percent}%`,{message_id:mes.message_id,chat_id:m.chat.id})
        })
        child.stderr.on('data',data => console.log("err",data.toString()))
      })
    })
  }
}
