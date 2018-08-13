const ytdl = require('youtube-dl')
//Promisifying youtube-dl
exports.getInfo = function (url){
  return new Promise((resolve, reject)=>{
    ytdl.getInfo(url,(err,info) =>{
      if (err) reject(err);
      resolve(info);
    })
  })
}

exports.downloadMP3 = function(url){
  return new Promise((resolve,reject)=>{
    ytdl.exec(url, ['-x', '--audio-format', 'mp3','--audio-quality=0','-o./temp/%(id)s.%(ext)s'], {},(err, output) => {
      if (err) reject(err);
      resolve(output)
    })
  })
}
