const ytdl = require("youtube-dl")
//Promisifying youtube-dl
module.exports.getInfo = function (url){
  return new Promise((resolve, reject)=>{
    ytdl.getInfo(url,(err,info) =>{
      if (err) reject(err)
      resolve(info)
    })
  })
}

module.exports.downloadMP3 = function(url){
  return new Promise((resolve,reject)=>{
		console.log(url,["-x", "--audio-format", "mp3","--audio-quality=0","-o./temp/%(id)s.%(ext)s"])
    ytdl.exec(url, ["-x", "--audio-format", "mp3","--audio-quality=0","-o./temp/%(id)s.%(ext)s"], {},(err, output) => {
      if (err) reject(err)
      resolve(output)
    })
  })
}
