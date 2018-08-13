const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')
const child_process = require('child_process');
const cache = require('./utils/cache.js')
const ytdl = require('./utils/ytdl-wrapper.js')
const Keyboards = require("./utils/inline-keyboard-generator.js")

const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || "0"
const HOOK_URL = process.env.DOMAIN_URL +'/' + TOKEN

const anim = "-\\|/"

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

}
bot.getMe().then(val => console.log("Info about me:",val))

const KGen = new Keyboards(bot)

bot.on("message",mes =>{
  processMessage(mes)
})

bot.on("callback_query",mes=>{
  console.log("query "+JSON.stringify(mes))
})


app.all("/",(req,res)=>{
  res.end("nothing to see here")
})
.all(`/${TOKEN}`,(req,res)=>{
  res.end("ok")
  processMessage(req.body.message)
})
.listen(PORT)




async function processMessage(m){

  console.log("\x1b[32m" + (m.text || m.audio || m.document) + "\x1b[0m")


  if(('audio' in m || 'document' in m)&& 'caption' in m){
    let data = m.caption.split(" ")
    // a && b returns b
    let id = ('audio' in m && m.audio.file_id) || ('document' in m && m.document.file_id)
    cache.store(data[1],id)

    await bot.sendAudio(data[0],id,{reply_markup:KGen.getDefault()},{})
    return
  }

  if(!('text' in m)){
    return
  }

  let matches = m.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&|$|\?)/)

  if(matches != null && matches.length == 2){
    let [url,video_id] = matches
    let filename = './temp/'+video_id+".mp3"
    if(await cache.check(video_id,m.chat.id,bot)){
      return
    }

    let mes = await bot.sendMessage(m.chat.id,"Downloading video")
    //Cute little spinning bar
    let animation_index = 0
    let timer_id = setInterval(async ()=>{
      await bot.editMessageText(`Downloading video ${anim[animation_index]}`, {message_id:mes.message_id,chat_id:m.chat.id})
      .catch(reason=>{})
      animation_index = (animation_index+1)%anim.length

    },1000)

    //This is for parallel execution
    let [info,_] = await Promise.all([ytdl.getInfo(url),ytdl.downloadMP3(url)])

    clearInterval(timer_id)
    console.log("python3",['client.py',filename,m.chat.id,info.title,video_id])

    //Works around telegram's 50mb bot uploads limit
    //written in python cuz i didn't find good alternative to telethon
    //uploads file to telegram and sends it back to bot
    //adss wideo id and chat id to file's caption
    let child = child_process.spawn("python3",['client.py',filename,m.chat.id,info.title,video_id],{stdio:'pipe'})

    //script also prints uploaded/total bytes to stdout so we can
    //show nice progressbar to user
    let lastUpdate = 0
    child.stdout.on('data',data => {
      let arr = data.toString().split(" ")
      let percent = Math.floor(parseInt(arr[0])/parseInt(arr[1])*100)
      if(Date.now() - lastUpdate > 1000 || percent == 100){
        bot.editMessageText(`Uploading mp3 - ${percent}%`,{message_id:mes.message_id,chat_id:m.chat.id})
        .catch(reason=>{})
        lastUpdate = Date.now()
      }
    })
    child.stderr.on('data',data => console.log("err",data.toString()))


  }
}
