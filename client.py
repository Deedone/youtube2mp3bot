from telethon import TelegramClient, sync
import sys
import os
# These example values won't work. You must get your own api_id and
# api_hash from https://my.telegram.org, under API Development.
api_id = 473887
api_hash = 'aef057abbbd06dbae724a7e7a8dca9ef'

client = TelegramClient('session_name', api_id, api_hash)
client.start()



if len(sys.argv) < 5:
    print(0)
    exit()

os.rename(sys.argv[1], sys.argv[3]+".mp3")

client.send_file('free_tube_peace_bot', sys.argv[3]+".mp3", caption=sys.argv[2] + ' ' + sys.argv[4], progress_callback=lambda a, b: [print(a, b), sys.stdout.flush()])


os.remove(sys.argv[3]+".mp3")
