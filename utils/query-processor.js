const cache = require('./cache.js')
const Message = require("./message.js")
const sleep = require('sleep')


module.exports = class QProcessor{

  static async new(bot, data){
    let th = new QProcessor()
    th.bot = bot
    th.data = data.data
    th.chat_id = data.message.chat.id
    th.message = await Message.new(bot, data.message.chat.id, data.message.message_id)

    console.log(th.data,th.message.chat_id,th.message.message_id,th.message.media_id,th.message.kbtype)

    if(th.data[0] == "d"){
      th.processBasicKeyboard()
    }

    return th
  }


  async getMessage(id, dir){
    let order = "ASC"
    if(dir == "<") order = "DESC"
    if(dir == ">") order = "ASC"
    let res = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${this.chat_id} AND message_id${dir}${id} ORDER BY message_id ${order} LIMIT 1`)
    console.log(`SELECT * FROM messages WHERE chat_id=${this.chat_id} AND message_id${dir}${id} ORDER BY message_id ${order} LIMIT 1`)
    return res.rows[0]

  }


  async processBasicKeyboard(){
    let target
    if(this.data[2] == "1"){
      target = await this.getMessage(this.message.message_id,"<")
    }
    if(this.data[2] == "2"){
      target = await this.getMessage(this.message.message_id,">")
    }
    console.log(JSON.stringify(target))
    let newmes = await Message.new(this.bot,target.chat_id,target.message_id)
    await this.message.swap(newmes)

  }


}
