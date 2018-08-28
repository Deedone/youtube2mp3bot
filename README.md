# Telegram bot for converting YouTube videos to mp3

Heavily inspired by [@AudioTubeBot](t.me/AudioTubeBot) but free and opensource  

### Features:
* Parses YouTube links and converts them to .mp3 files
* Stores already uploaded file ids to prevent re-converting of same video
* Animation for downloading stage
* Interface for reordering audios
* Playlists

### TODO:
* Web interface for Telegram authentication and automatic session storage in DB
* Ability to download entire YouTube playlists
* Optional use of spare account
* Optional fallback to SQLite

Tested on Heroku with nodejs, python and ffmpeg buildpacks

Needs spare TG account to upload bigger than 50mb files and postgresql database for storing file ids

### Dependencies:
* nodejs
* python3
* ffmpeg

### How to run
1. Create TG bot via [@BotFather](t.me/BotFather) and get access token
2. Go to [Telegram core](https://my.telegram.org) and get API id and hash
3. Rename start.sh.example to start.sh and fill all the config vars except **TELEGRAM_SESSION_STRING** with your values
4. Run `start.sh gensession` and enter your spare account credentials
5. Copy and paste the session string from  previous step to **TELEGRAM_SESSION_STRING**
6. Run `start.sh`
