const cache = require("./cache.js")
const Message = require("./message.js")


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
    }else if(th.data[0] == "s"){
			th.processSongsKeyboard()
		}else if(th.data[0] == "p"){
			th.processPlaylistsKeyboard()
		}

    return th
  }


  async getMessage(id, dir){
    let order = "ASC"
    if(dir == "<") order = "DESC"
    if(dir == ">") order = "ASC"
    let res = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${this.chat_id} AND message_id${dir}${id} ORDER BY message_id ${order} LIMIT 1`)
    
    return res.rows[0]

  }
	async processPlaylistsKeyboard(){
		let [_,n] = this.data.split("_")
		n = parseInt(n)
		await this.message.updateKeyBoard("basic")
		if(n==-1) return
		let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
		let playlist = res.rows[0].playlists[n]
		this.message.playlist.push(playlist)
		await this.message.updateDB()
		console.log("added to playlist",playlist)
	}

  async processBasicKeyboard(){
    if(this.data[2] == "1"){
      let target = await this.getMessage(this.message.message_id,"<")
			let newmes = await Message.new(this.bot,target.chat_id,target.message_id)
			await this.message.swap(newmes)
    }
    if(this.data[2] == "2"){
      let target = await this.getMessage(this.message.message_id,">")
			let newmes = await Message.new(this.bot,target.chat_id,target.message_id)
			await this.message.swap(newmes)
    }
		if(this.data[2] == "3"){
			await this.message.updateKeyBoard("songs")
		}
		if(this.data[2] == "5"){
			let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
			res = res.rows[0].cur_playlist 
			let i = this.message.playlist.indexOf(res)
			if(i != -1){
				console.log(this.message.playlist, i, res)
				this.message.playlist.splice(i,1)
				console.log(this.message.playlist)
				if(this.message.playlist.length > 0){
					await this.message.updateDB()
					this.message.del()
				}else{
					this.message.del(true)
				}
					
			}else{
				this.message.del(true)
			}
		}
		if(this.data[2] == "4"){
			await this.message.updateKeyBoard("playlists")
		}
    

  }
	async processSongsKeyboard(){
		await	this.message.updateKeyBoard("basic")
		let newid = parseInt(this.data.split("_")[1])
		if(newid == 0){
			return
		}else{
			await this.shift(this.message.message_id,newid)
		}
	}
	async shift(from, to){
		let mi = Math.min(from,to)
		let ma = Math.max(from,to)
		let messages = await cache.pool.query("SELECT * FROM messages WHERE message_id>=$1 AND message_id<=$2 AND chat_id=$3 ORDER BY message_id",[mi,ma,this.message.chat_id])
		.catch(r=>{console.log(r.message)})
		messages = messages.rows
		console.log(`got ${messages.length} mes's to swap`)
		if(from>to){
			console.log("reversing")
			messages.reverse()
		}
		for(let i=0;i<messages.length-1;i++){
			let mes1 = await Message.new(this.bot,messages[i].chat_id,messages[i].message_id).catch(err=>console.log(err.message))
			let mes2 = await Message.new(this.bot,messages[i+1].chat_id,messages[i+1].message_id).catch(err=>console.log(err.message))
			await mes1.swap(mes2)
		} 
	}

}
