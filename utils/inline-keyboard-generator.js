
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
            }
          ]
        ]
      })
    }
}
