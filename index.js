const express = require('express')
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser')
const ytdl = require('youtube-dl')
const child_process = require('child_process');
const {Client} = require('pg')

let client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
client.connect();

client.query('\
CREATE TABLE IF NOT EXISTS cache(\
  video_id VARCHAR(11) PRIMARY KEY, \
  tg_id VARCHAR(64) UNIQUE NOT NULL,\
  created TIMESTAMP NOT NULL);', (err, res) => {
  if (err) throw err;
  console.log("DB CREATED")
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});




const PORT = process.env.PORT || 5000
const TOKEN = process.env.TOKEN || 0

console.log(PORT,TOKEN);
let bot = 0
let app = express()
app.use(bodyParser.json())


if("HEROKU" in process.env && !("BOT_FORCE_POLLING" in process.env && process.env.BOT_FORCE_POLLING == 1)){
  console.log("USING WEBHOOKS")
  bot = new TelegramBot(TOKEN)
  bot.setWebHook("https://free-audio-bot.herokuapp.com/hook")
}else{
  console.log("USING LONG POLLING")
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


async function store(vid, tgid){
  let client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  await client.connect()
  await client.query(`INSERT INTO cache VALUES ('${vid}','${tgid}',now());`)
  await client.end()
}

async function checkCache(vid, cid){
  let client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  await client.connect()
  console.log("SEARCHING "+vid)
  let res = await client.query(`SELECT * FROM cache WHERE video_id='${vid}'`)
  await client.end()
  //console.log(res.rows)
  if(res.rows.length > 0){
    console.log("FOUND IN CACHE")
    await bot.sendAudio(cid,res.rows[0].tg_id)
    return true
  }
  return false
}




async function processMessage(m){

  console.log("data = ",m.text || m.audio || m.document)


  if(('audio' in m || 'document' in m)&& 'caption' in m){
    let data = m.caption.split(" ")
    // a && b returns b
    let id = ('audio' in m && m.audio.file_id) || ('document' in m && m.document.file_id)
    await store(data[1],id)
    await bot.sendAudio(data[0],id)
    return
  }

  if(!('text' in m)){
    return
  }

  let matches = m.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&|$|\?)/)

  if(matches != null && matches.length == 2){
    let [url,video_id] = matches
    let c = await checkCache(video_id,m.chat.id)
    if(c){
      return
    }



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
