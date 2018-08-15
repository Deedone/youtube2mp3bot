const cache = require('./cache.js')


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
			let Message = require('./message.js')
			let res = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${chat_id} ORDER BY message_id`)
			let forceclose = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${chat_id} AND kbtype='songs'`)
			for(let r of forceclose.rows){
				let m = await Message.new(this.bot,r.chat_id,r.message_id)
				m.updateKeyBoard('basic')
			}
			let key = []
			for(let r of res.rows){
				key.push([{text:r.title,callback_data:`s_${r.message_id}`}])
			}
			return JSON.stringify({inline_keyboard:key})	
		}

}
