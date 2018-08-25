const cache = require("./cache.js")


module.exports = class Generator{
  constructor(bot){
    this.bot = bot
  }

  getDefault(){
    return JSON.stringify({
        inline_keyboard:[
          [
            {
              text:"\u2B06",
              callback_data:"d_1"
            },
            {
              text:"\u2B07",
              callback_data:"d_2"
            },
            {
              text:"\u21A9",
              callback_data:"d_3"
            },
            {
              text:"\u2795",
              callback_data:"d_4"
            },
						{
							text:"🗑️",
							callback_data:"d_5"
						}
          ]
        ]
      })
    }
		async getSongs(chat_id){
			let Message = require("./message.js")
			let res = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${chat_id} ORDER BY created`)
			let forceclose = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${chat_id} AND kbtype='songs'`)
			for(let r of forceclose.rows){
				let m = await Message.new(this.bot,r.chat_id,r.message_id)
				m.updateKeyBoard("basic")
			}
			let key = []
			key.push([{text:"Back",callback_data:"s_0"}])
			for(let r of res.rows){
				key.push([{text:r.title,callback_data:`s_${r.message_id}`}])
			}
			return JSON.stringify({inline_keyboard:key})	
		}
		async getPlaylists(chat_id){
			let Message = require("./message.js")
			let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[chat_id])
			let key = []
			key.push([{text:"Back",callback_data:"p_-1"}])
			for(let i=0;i<res.rows[0].playlists.length;i++){
				key.push([{text:res.rows[0].playlists[i],callback_data:`p_${i}`}])
		
		}
			let forceclose = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${chat_id} AND kbtype='playlists'`)
			for(let r of forceclose.rows){
				let m = await Message.new(this.bot,r.chat_id,r.message_id)
				m.updateKeyBoard("basic")
			}
			
			return JSON.stringify({inline_keyboard:key})	
		}

}
