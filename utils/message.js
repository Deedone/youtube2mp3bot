const K = require("./inline-keyboard-generator.js")
const sleep = require('sleep')
const cache = require("./cache.js")


let processing = []


module.exports = class Message{


  static async new(bot,chat_id, message_id = false, media_id=false){
    let a = new Message(bot,chat_id, message_id)
    if(message_id){
      await a.loadFromDB(message_id)
    }else if(!message_id && media_id){
			await a.sendMedia(media_id)
			await a.saveDB()
			
			
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
		this.saved = true

  }

  async prepare(){
    let mes = await this.bot.sendMessage(this.chat_id,"Gotcha")
    this.message_id = mes.message_id
		this.saved = false
  }


  isReady(){

    return this.message_id != -1
  }


	async sendMedia(media_id){
    let mes = await this.bot.sendAudio(this.chat_id, media_id,{reply_markup:new K(this.bot).getDefault()},{})
    this.message_id = mes.message_id
    this.media_id = media_id
	}

  async transformToMedia(media_id){
    await this.del()
		await this.sendMedia(media_id)
    this.kbtype = "basic"

		this.saveDB()
  }

  async update(text){
    while(!this.isReady()) await sleep.msleep(50)
    await this.bot.editMessageText(text,{message_id:this.message_id, chat_id:this.chat_id}).catch(r=>{})
  }
  async del(fromDB = false){
    while(!(this.isReady())) {await sleep.msleep(50)}

		if(this.saved && fromDB){
			cache.pool.query(`DELETE FROM messages WHERE chat_id=${this.chat_id} AND message_id=${this.message_id}`)
			this.saved = false
		}


    await this.bot.deleteMessage(this.chat_id, this.message_id)
    this.message_id = -1
  }
  async swap(newmes){

		let safekey1 = this.chat_id.toString() + this.message_id.toString()
		let safekey2 = newmes.chat_id.toString() + newmes.message_id.toString()
		

		if(processing.includes(safekey1) || processing.includes(safekey2)){
			console.log("busy")
			return
		}
		processing.push(safekey1)	
		processing.push(safekey2)	
		  
		
		console.log(`swap started for ${this.message_id} and ${newmes.message_id}`)



    await this.bot.editMessageMedia(this.chat_id, this.message_id, newmes.media_id).catch(err => {console.log("sad sad sad")})
    await this.bot.editMessageMedia(newmes.chat_id, newmes.message_id, this.media_id).catch(err => {console.log("sad sad sad")})

		let t = newmes.media_id
		newmes.media_id = this.media_id
		this.media_id = t

    await newmes.updateDB()
    await this.updateDB()
		
		console.log(`swap ended for ${newmes.message_id} and ${this.message_id}`)
		let i1 = processing.indexOf(safekey1)	
		processing.splice(i1,1)
		let i2 = processing.indexOf(safekey2)	
		processing.splice(i2,1)
		
  }

	async saveDB(){
    await cache.pool.query(`INSERT INTO messages \
      (chat_id        , message_id        , tg_id      , kbtype          , created) VALUES\
      (${this.chat_id}, ${this.message_id}, '${this.media_id}', '${this.kbtype}', now());`)
	}

  async updateDB(){
    cache.pool.query(`UPDATE messages SET chat_id=${this.chat_id}, message_id=${this.message_id},\
			tg_id='${this.media_id}', kbtype='${this.kbtype}' \
			WHERE message_id=${this.message_id} AND chat_id=${this.chat_id}`)
  }

}
