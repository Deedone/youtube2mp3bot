
const {Pool} = require('pg')

let pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
pool.connect();
pool.query('\
CREATE TABLE IF NOT EXISTS cache(\
  video_id VARCHAR(11) PRIMARY KEY, \
  tg_id VARCHAR(64) UNIQUE NOT NULL,\
  created TIMESTAMP NOT NULL);', (err, res) => {
  if (err) throw err;
  console.log("DB CREATED")
});



module.exports.store = async function(vid, tgid){
  await pool.query(`INSERT INTO cache VALUES ('${vid}','${tgid}',now());`)
}


module.exports.check = async function(vid, cid, bot){

  console.log("SEARCHING "+vid)
  let res = await pool.query(`SELECT * FROM cache WHERE video_id='${vid}'`)

  if(res.rows.length > 0){
    console.log("FOUND IN CACHE")
    await bot.sendAudio(cid,res.rows[0].tg_id)
    return true
  }
  return false
}
