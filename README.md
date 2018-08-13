# Telegram bot for converting YouTube videos to mp3

Heavily inspired by [@AudioTubeBot](t.me/AudioTubeBot) but free and opensource  

### Features:
* Parses YouTube links and converts them to .mp3 files
* Stores already uploaded file ids to prevent re-converting of same video

### TODO:
* Interface for reordering audios
* Web interface for Telegram authentication and automatic session storage in DB
* Playlists(?)
* Some animation for downloading stage
* Optional use of agent account
* Optional fallback to SQLite

Tested on Heroku with nodejs, python and ffmpeg buildpacks

Needs spare tg account to upload bigger than 50mb files and postgresql database for storing file ids

### Dependencies:
* nodejs
* python3
* ffmpeg

### How to run
1. Create tg bot via [@BotFather](t.me/BotFather) and remember access token
2. Go to [Telegram core](https://my.telegram.org) and remember api id and hash
3. Rename start.sh.example to start.sh and fill all the config vars except **TELEGRAM_SESSION_STRING** with your values
4. Run `start.sh gensession` and enter your agent account credentials
5. Copy and paste output of previous step to **TELEGRAM_SESSION_STRING**
6. Run `start.sh`
