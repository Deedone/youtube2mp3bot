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


if("HEROKU" in process.env){
  bot = new TelegramBot(TOKEN)
  bot.setWebHook("https://free-audio-bot.herokuapp.com/hook")
}else{
  bot = new TelegramBot(TOKEN,{polling:true})
  bot.deleteWebHook().then(val => console.log("webhook killed:",val))

}
bot.getMe().then(val => console.log("Info about me:",val))

bot.on("message",mes =>{
  processMessage(mes)
})


app.all("/",(req,res)=>{
  res.end("nothing to see here")
})
.all("/hook",(req,res)=>{
  res.end("ok")
  processMessage(req.body.message)
})
.listen(PORT)




//Promisifying youtube-dl
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
    // a && b returns b
    let id = ('audio' in m && m.audio.file_id) || ('document' in m && m.document.file_id)
    bot.sendAudio(data[0],id)
    return
  }

  if(!('text' in m)){
    return
  }

  let matches = m.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&|$|\?)/)

  if(matches != null && matches.length == 2){
    let [url,video_id] = matches
    let filename = video_id+".mp3"
    //This is for parallel execution
    let [mes,info,_] = await Promise.all([bot.sendMessage(m.chat.id,"Downloading video"),getInfoAsync(url),downloadMP3Async(url)])

    console.log("python3",['client.py',filename,m.chat.id,info.title,video_id])

    //Works around telegram's 50mb bot uploads limit
    //written in python cuz i didn't find good alternative to telethon
    //uploads file to telegram and sends it back to bot
    //adss wideo id and chat id to file's caption
    let child = child_process.spawn("python3",['client.py',filename,m.chat.id,info.title,video_id],{stdio:'pipe'})

    //script also prints uploaded/total bytes to stdout so we can
    //show nice progressbar to user
    child.stdout.on('data',data => {
      let arr = data.toString().split(" ")
      let percent = Math.floor(parseInt(arr[0])/parseInt(arr[1])*100)
      bot.editMessageText(`Uploading mp3 - ${percent}%`,{message_id:mes.message_id,chat_id:m.chat.id})
    })
    child.stderr.on('data',data => console.log("err",data.toString()))


  }
}
