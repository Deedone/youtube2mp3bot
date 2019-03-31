from telethon import TelegramClient, sync
from string_session import StringSession
from telethon.tl import types
import sys
import os

# libs for setting up mp3 tags
import eyed3
import pafy
import magic
import urllib.request

# These example values won't work. You must get your own api_id and
# api_hash from https://my.telegram.org, under API Development.
api_id = os.getenv("TELEGRAM_APPID", 0)
api_hash = os.getenv("TELEGRAM_APIHASH", "HASH")
botname = os.getenv("BOT_USERNAME", "placeholder")
session_string = os.getenv("TELEGRAM_SESSION_STRING", "placeholder")

client = TelegramClient(StringSession(session_string), api_id, api_hash)
client.start()



if len(sys.argv) < 5:
    print(0)
    exit()

newname = "./temp/"+sys.argv[3]+".mp3"
print(os.getcwd(), file=sys.stderr)
print(os.listdir(os.getcwd()),file=sys.stderr)

# Setting up mp3 tags
mp3file = eyed3.load(newname)
url = "https://www.youtube.com/watch?v=" + sys.argv[4]
video = pafy.new(url)
thumbnail = ulrlib.request.urlretrieve(video.bigthumbhd, "./temp/image"+sys.argv[4]+".jpg")
title = video.title.split(' - ')
mp3file.tag.artist = title[0]
mp3file.tag.song = title[1]
mp3file.tag.images.set(3, open('zhopa.jpg', 'r+b').read(), 'image/jpeg')
mp3file.tag.save()


try:
    os.rename(sys.argv[1], newname)
    client.send_file(botname, newname, caption=sys.argv[2] + ' ' + sys.argv[4], progress_callback=lambda a, b: [print(a, b), sys.stdout.flush()], allow_cache=False, attributes=[types.DocumentAttributeFilename(sys.argv[3])])
except Exception as e:
    print("Cannot rename here is ./temp ls",file=sys.stderr)
    print(os.listdir("./temp/"),file=sys.stderr)
    client.send_file(botname, sys.argv[1], caption=sys.argv[2] + ' ' + sys.argv[4], progress_callback=lambda a, b: [print(a, b), sys.stdout.flush()], allow_cache=False, attributes=[types.DocumentAttributeFilename(sys.argv[3])])



os.remove(newname)
os.remove(thumbnail)
