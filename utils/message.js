
const sleep = require('sleep')
module.exports = class Message{

  constructor(bot,chat_id, message_id = false, media_id = false){
    this.bot = bot
    this.chat_id = chat_id
    this.message_id = -1
    if(message_id){
      this.message_id = message_id
    }else if (media_id) {
      bot.sendAudio(this.chat_id,media_id).then(mes=>{
        this.message_id = mes.message_id
      })
    }else{
      bot.sendMessage(this.chat_id,"Gotcha").then(mes=>{
        this.message_id = mes.message_id
      })
    }

  }

  async ready(){
    while(this.message_id == -1){
      await sleep.msleep(50)
    }
  }

  async update(text){
    await this.ready()
    await this.bot.editMessageText(text,{message_id:this.message_id, chat_id:this.chat_id})
  }
  async del(){
    await this.ready()
    await this.bot.deleteMessage(this.chat_id, this.message_id)
    this.message_id = -1
  }

}
