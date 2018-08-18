
const {Pool} = require("pg")

let pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
})

async function setup(){
  pool.connect()
  await pool.query("\
  CREATE TABLE IF NOT EXISTS cache(\
    video_id VARCHAR(11) PRIMARY KEY, \
    tg_id VARCHAR(64) UNIQUE NOT NULL,\
    created TIMESTAMP NOT NULL);" )

  await pool.query("\
    CREATE TABLE IF NOT EXISTS messages(\
      id BIGSERIAL PRIMARY KEY,\
      chat_id BIGINT NOT NULL,\
      message_id BIGINT NOT NULL,\
      tg_id VARCHAR(64) NOT NULL,\
      kbtype VARCHAR(32) NOT NULL,\
      created TIMESTAMP NOT NULL);\
  ")
	await pool.query("\
		ALTER TABLE messages\
			ADD COLUMN IF NOT EXISTS title VARCHAR(255),\
			ADD COLUMN IF NOT EXISTS playlist VARCHAR(255)[];")
  console.log("DB CREATED")
}


setup()


module.exports.pool = pool

module.exports.store = async function(vid, tgid){
  await pool.query(`INSERT INTO cache VALUES ('${vid}','${tgid}',now());`)
}


module.exports.check = async function(vid){

  console.log("SEARCHING "+vid)
  let res = await pool.query(`SELECT * FROM cache WHERE video_id='${vid}'`)

  if(res.rows.length > 0){
    console.log("FOUND IN CACHE")
    return res.rows[0].tg_id
  }
  return false
}
