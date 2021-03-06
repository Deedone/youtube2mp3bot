const child_process = require("child_process")
const ytdl = require("./ytdl-wrapper.js")
const cache = require("./cache.js")
const Message = require("./message.js")
const fs = require('fs')
const anim = "-\\|/"
let current = []
let userstate = {}
let to_delete = {}

module.exports = class Processor{



  async do(incoming, bot){
    this.bot = bot
    this.chat_id = incoming.chat.id
    this.text = incoming.text
    console.log("Incoming message: ",this.text)
    this.aindex = 0
			if(this.text && this.text== "/rebuild"){
				this.fixPlaylist(this.chat_id)
				return
			}else if(this.text && this.text.search(/\/\d+/) != -1 && this.chat_id in userstate && userstate[this.chat_id] == "changing"){
				console.log("changing phase two")
				let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
				res = res.rows[0].playlists
				let i = parseInt(this.text.substring(1))
				if(i >= res.length) return
				delete userstate[this.chat_id]
				await this.changePlaylist(res[i])
				if(this.chat_id in to_delete){
					console.log("deleting old message")
					this.bot.deleteMessage(this.chat_id, to_delete[this.chat_id]).catch(err=>console.log(err.message))
					delete to_delete[this.chat_id]
				}
			}else if(this.text && this.text.search(/\/\d+/) != -1 && userstate[this.chat_id] == "deleting"){
				console.log("changing phase two")
				let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
				let cur = res.rows[0].cur_playlist
				res = res.rows[0].playlists
				let i = parseInt(this.text.substring(1))
				if(i >= res.length || i<=0) return
				let playlist_to_delete = res[i]
				res.splice(i,1)
				await cache.pool.query("UPDATE users SET playlists=$1 WHERE chat_id=$2",[res,this.chat_id])
				res = await cache.pool.query("SELECT * FROM messages WHERE chat_id=$1",[this.chat_id])
				for(let r of res.rows){
					if(r.playlist.indexOf(playlist_to_delete) != -1){
						r.playlist.splice(r.playlist.indexOf(playlist_to_delete),1)
						await cache.pool.query("UPDATE messages SET playlist=$1 WHERE id=$2",[r.playlist,r.id])
					}
				}
				if(this.chat_id in to_delete){
					console.log("deleting old message")
					this.bot.deleteMessage(this.chat_id, to_delete[this.chat_id]).catch(err=>console.log(err.message))
					delete to_delete[this.chat_id]
				}
				if(playlist_to_delete == cur){
					this.changePlaylist("main")
				}
				
			}else if(this.text && this.text.search(/\/delete/) != -1){
				console.log("got /delete")
				userstate[this.chat_id] = "deleting"

				let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
				let cur = res.rows[0].cur_playlist
				res = res.rows[0].playlists
				let str = `You now on ${cur}\n`
				for(let i=1;i<res.length;i++){
					str+= `/${i} - ${res[i]}\n`
				}
				let mes = await this.bot.sendMessage(this.chat_id,str)
				to_delete[this.chat_id] = mes.message_id	
				
			}else if(this.text && this.text.search(/\/change/) != -1){
				console.log("got /change")
				userstate[this.chat_id] = "changing"
				let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
				let cur = res.rows[0].cur_playlist
				res = res.rows[0].playlists
				let str = `You now on ${cur}\n`
				for(let i=0;i<res.length;i++){
					str+= `/${i} - ${res[i]}\n`
				}
				let mes = await this.bot.sendMessage(this.chat_id,str)
				to_delete[this.chat_id] = mes.message_id	
			}else if(this.text && this.text.search(/\/create/) != -1){
				userstate[this.chat_id] = "creating"
				this.bot.sendMessage(this.chat_id,"Choose a nice name for your playlist")

			}else if(userstate[this.chat_id] == "creating" && this.text){
				let name = this.text
				await cache.pool.query("UPDATE users SET playlists=array_append(playlists,$1) WHERE chat_id=$2",[name,this.chat_id])
				let resp = await Message.new(bot, this.chat_id)
				resp.update(`New playlist ${name} created`)
				delete userstate[this.chat_id]
			}else if(this.text && this.text=="/start"){
				cache.createuser(this.chat_id).catch(err=>console.log(err.message))
				let welcome = await Message.new(bot,this.chat_id)
				if("from" in incoming){
					welcome.update(`Hello, ${incoming.from.first_name}!
Send me link to YouTube video to see magic`)
				}else{
					welcome.update(`Hello, stranger(s)!
Send me link yo YouTube video to see magic`)
				}

			}else if(("audio" in incoming || "document" in incoming)&& "caption" in incoming){
        let media_id = ("audio" in incoming && incoming.audio.file_id) || ("document" in incoming && incoming.document.file_i)
        let [chat_id,video_id] = incoming.caption.split(" ")
        console.log(chat_id,video_id,media_id)
        cache.store(video_id, media_id)
        for(let x of current){
          if(x.video_id == video_id){
            x.finish(media_id)
            break
          }
        }
      }else if (await this.parseYoutube()){
        this.state = "downloading"
        this.message = await Message.new(bot,this.chat_id)


        this.timer = setInterval(()=>this.updateMessage(), 1000)
        this.progress = 0
				console.log("Checking cache");
				let res = await cache.pool.query("SELECT * FROM users WHERE chat_id=$1",[this.chat_id])
				this.playlist = res.rows[0].cur_playlist
        current.push(this)
        cache.check(this.video_id).then(cc=>{
          if(cc){
            console.log("Cache returned ",cc)
            this.finish(cc)
          }else{
            this.processVideo()
          }
        })
      }
  }
	
	async fixPlaylist(){
		let user =   await cache.pool.query("SELECT * FROM users WHERE chat_id =$1;",[this.chat_id])
		let curplaylist = user.rows[0].cur_playlist
		console.log("cur playlist - ",curplaylist)
		let res = await cache.pool.query("SELECT * FROM messages WHERE chat_id=$1 AND $2 = ANY(playlist) ORDER BY created;",[this.chat_id, curplaylist])
		console.log("res rows = ",res.rows)
		console.log(`Fixing playlist for ${this.chat_id}`)

		for(let r of res.rows){
			try{
				let old = await Message.new(this.bot, this.chat_id, r.message_id)
				old.del(true)
			}catch (err){
				console.log("sad but true")
			}
			await Message.new(this.bot, this.chat_id, false, r.tg_id, r.title)
			
		}
	}
	async changePlaylist(newplaylist){
		let user =   await cache.pool.query("SELECT * FROM users WHERE chat_id =$1;",[this.chat_id])
		let curplaylist = user.rows[0].cur_playlist
		let res = await cache.pool.query("SELECT * FROM messages WHERE chat_id=$1 AND $2 = ANY(playlist);",[this.chat_id, curplaylist])
		console.log("res rows = ",res.rows)
		console.log(`Changing playlist for ${this.chat_id} from ${curplaylist} to ${newplaylist}`)
		for(let r of res.rows){
			try{
				let old = await Message.new(this.bot, this.chat_id, r.message_id)
				old.del()
			}catch (err){
				console.log("err deleting message",err.message)
			}
		}
		res = await cache.pool.query("SELECT * FROM messages WHERE chat_id=$1 AND $2 = ANY(playlist) ORDER BY created;",[this.chat_id, newplaylist])
		console.log("new songs - ",res.rows)
		for(let r of res.rows){
			await Message.resend(this.bot, r)
		}
		await cache.pool.query("UPDATE users SET cur_playlist=$1 WHERE chat_id=$2",[newplaylist,this.chat_id])
	}
		



  async finish(media_id){
    console.log("finish")

    this.state = "done"
    clearInterval(this.timer)
		this.message.title = this.title
		this.message.playlist = [this.playlist]
    await this.message.transformToMedia(media_id)
    
    current = current.filter(el=>el!==this)
    
  }

  updateMessage(){
    if(this.state == "downloading"){
      this.message.update(`Downloading video ${anim[this.aindex]}`)
      this.aindex = (this.aindex+1)%anim.length
    }else if(this.state == "uploading"){
      this.message.update(`Uploading MP3 - ${this.progress}%`).catch(err => console.log(err));
    }
  }

  async processVideo(){
		console.log("Loading");
		await ytdl.downloadMP3(this.url).catch(err => console.log("Sraka " + err))
    console.log("python3",["client.py",this.filename,this.chat_id,this.title,this.video_id])
    let child = child_process.spawn("python3",["./client.py",this.filename,this.chat_id,this.title,this.video_id],{stdio:"pipe"})
    this.state = "uploading"
    child.stdout.on("data",data => {
      let arr = data.toString().split(" ")
      this.progress = Math.floor(parseInt(arr[0])/parseInt(arr[1])*100)
    })
    child.stderr.on("data",data => {
			console.log("err",data.toString())

			fs.readdirSync("./temp/").forEach(file => {
				console.log(file);
			})
		})

  }

  async parseYoutube(){
		console.log("parse youtube");

    if(!this.text) return false
    let matches = this.text.match(/(?:https:\/\/)?(?:www\.?)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(.+?)(?:&| |$|\?)/)
    if(matches != null && matches.length == 2){
      this.url = matches[0]
      this.video_id = matches[1]
      this.filename = "./temp/"+this.video_id+".mp3"
			let info = await ytdl.getInfo(this.url)
			this.title = info.title
      return true
    }
    return false
  }

}
