from telethon import TelegramClient, sync
import sys
import os
from string_session import StringSession

# These example values won't work. You must get your own api_id and
# api_hash from https://my.telegram.org, under API Development.
api_id = os.getenv("TELEGRAM_APPID", 0)
api_hash = os.getenv("TELEGRAM_APIHASH", "HASH")



client = TelegramClient(StringSession(), api_id, api_hash)
client.start()

print(client.session.save())
