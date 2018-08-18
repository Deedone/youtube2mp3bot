const child_process = require("child_process")
const ytdl = require("./ytdl-wrapper.js")
const cache = require("./cache.js")
const Message = require("./message.js")
const anim = "-\\|/"
let current = []


module.exports = class Processor{



  async do(incoming, bot){
    this.bot = bot
    this.chat_id = incoming.chat.id
    this.text = incoming.text
    console.log("Incoming message: ",this.text)
    this.aindex = 0
			if(this.text && this.text== "/rebuild"){
				this.fixPlaylist()
				return
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
		let res = await cache.pool.query(`SELECT * FROM messages WHERE chat_id=${this.chat_id}`)
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

  async finish(media_id){
    console.log("finish")

    this.state = "done"
    clearInterval(this.timer)
		this.message.title = this.title
    await this.message.transformToMedia(media_id)
    
    current = current.filter(el=>el!==this)
    
  }

  updateMessage(){
    if(this.state == "downloading"){
      this.message.update(`Downloading video ${anim[this.aindex]}`)
      this.aindex = (this.aindex+1)%anim.length
    }else if(this.state == "uploading"){
      this.message.update(`Uploading MP3 - ${this.progress}%`)
    }
  }

  async processVideo(){
		await ytdl.downloadMP3(this.url)
    console.log("python3",["client.py",this.filename,this.chat_id,this.title,this.video_id])
    let child = child_process.spawn("python3",["./client.py",this.filename,this.chat_id,this.title,this.video_id],{stdio:"pipe"})
    this.state = "uploading"
    child.stdout.on("data",data => {
      let arr = data.toString().split(" ")
      this.progress = Math.floor(parseInt(arr[0])/parseInt(arr[1])*100)
    })
    child.stderr.on("data",data => console.log("err",data.toString()))

  }

  async parseYoutube(){

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
