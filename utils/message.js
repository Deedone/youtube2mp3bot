const K = require("./inline-keyboard-generator.js")
const sleep = require('sleep')
module.exports = class Message{


  static async new(bot,chat_id, message_id = false){
    let a = new Message(bot,chat_id, message_id)
    await a.prepare()
    return a
  }

  constructor(bot,chat_id, message_id = false){
    this.bot = bot
    this.chat_id = chat_id
    this.message_id = -1
    this.kbtype = "none"
    this.media_id = -1

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
    this.kbtype = "basic"
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

}
