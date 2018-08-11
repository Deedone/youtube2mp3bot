const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000


app = express()

app.set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');


  app.get("/",(req,res)=>{
    res.end("hello")
  })



app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
