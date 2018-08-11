const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TOKEN || "590456891:a"

console.log(PORT,TOKEN);



const bot = new TelegramBot(TOKEN)


bot.getMe().then(val => console.log(val))
