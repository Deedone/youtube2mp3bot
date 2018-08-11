const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')
const ytdl = require('youtube-dl')
const child_process = require('child_process');



const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || 0

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
  res.end("ok")
  processMessage(req.body.message)
}).listen(PORT)

bot.on("message",mes =>{
  processMessage(mes)
})


function getInfoAsync(url){
  return new Promise((resolve, reject)=>{
    ytdl.getInfo(url,(err,info) =>{
      if (err) reject(err);
      resolve(info);
    })
  })
}

function downloadMP3Async(url){
  return new Promise((resolve,reject)=>{
    ytdl.exec(url, ['-x', '--audio-format', 'mp3','--audio-quality=0','-o%(id)s.%(ext)s'], {},(err, output) => {
      if (err) reject(err);
      resolve(output)
    })
  })
}


async function processMessage(m){

  console.log("data = ",m.text || m.audio || m.document)


  if(('audio' in m || 'document' in m)&& 'caption' in m){
    let data = m.caption.split(" ")
    bot.sendAudio(data[0],m.audio.file_id)
    return
  }

  if(!('text' in m)){
    return
  }

  let matches = m.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&|$|\?)/)

  if(matches != null && matches.length == 2){
    let [url,video_id] = matches
    let mes = await bot.sendMessage(m.chat.id,"Downloading video")
    await downloadMP3Async(url)
    let info = await getInfoAsync(url)
    let filename = video_id+".mp3"

    console.log("python3",['client.py',filename,m.chat.id,info.title,video_id])

    let child = child_process.spawn("python3",['client.py',filename,m.chat.id,info.title,video_id],{stdio:'pipe'})

    child.stdout.on('data',data => {
      let arr = data.toString().split(" ")
      let percent = Math.floor(parseInt(arr[0])/parseInt(arr[1])*100)
      bot.editMessageText(`Uploading mp3 - ${percent}%`,{message_id:mes.message_id,chat_id:m.chat.id})
    })
    child.stderr.on('data',data => console.log("err",data.toString()))


  }
}
