const K = require("./inline-keyboard-generator.js")
const sleep = require('sleep')
const cache = require("./cache.js")
module.exports = class Message{


  static async new(bot,chat_id, message_id = false){
    let a = new Message(bot,chat_id, message_id)
    if(message_id){
      await a.loadFromDB(message_id)
    }else{
      await a.prepare()
    }
    return a
  }

  constructor(bot,chat_id, message_id = false){
    this.bot = bot
    this.chat_id = chat_id
    this.message_id = -1
    this.kbtype = "none"
    this.media_id = -1

  }

  async loadFromDB(mid){
    let res = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${this.chat_id} AND message_id=${mid};`)
    if(res.rows.length != 1) throw `Can't fetch from db ${this.chat_id} ${mid}`
    this.message_id = res.rows[0].message_id
    this.kbtype = res.rows[0].kbtype
    this.media_id = res.rows[0].tg_id

  }

  async prepare(){
    let mes = await this.bot.sendMessage(this.chat_id,"Gotcha")
    this.message_id = mes.message_id
  }


  isReady(){

    return this.message_id != -1
  }

  async transformToMedia(media_id){
    await this.del()
    let mes = await this.bot.sendAudio(this.chat_id, media_id,{reply_markup:new K(this.bot).getDefault()},{})
    this.message_id = mes.message_id
    this.media_id = media_id
    this.kbtype = "basic"

    await cache.pool.query(`INSERT INTO messages \
      (chat_id        , message_id        , tg_id      , kbtype          , created) VALUES\
      (${this.chat_id}, ${this.message_id}, '${media_id}', '${this.kbtype}', now());`)
  }

  async update(text){
    while(!this.isReady()) await sleep.msleep(50)
    await this.bot.editMessageText(text,{message_id:this.message_id, chat_id:this.chat_id}).catch(r=>{})
  }
  async del(){
    while(!(this.isReady())) {await sleep.msleep(50)}
    await this.bot.deleteMessage(this.chat_id, this.message_id)
    this.message_id = -1
  }
  async swap(newmes){
    await this.bot.editMessageMedia(this.chat_id, this.message_id, newmes.media_id)
    this.updateDBMedia(newmes.media_id)
    await this.bot.editMessageMedia(newmes.chat_id, newmes.message_id, this.media_id)
    newmes.updateDBMedia(this.media_id)
  }
  async updateDBMedia(mid){
    cache.pool.query(`UPDATE messages SET tg_id='${mid}' WHERE message_id=${this.message_id} AND chat_id=${this.chat_id}`)
  }

}
