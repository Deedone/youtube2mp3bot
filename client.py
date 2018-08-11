from telethon import TelegramClient, sync

# These example values won't work. You must get your own api_id and
# api_hash from https://my.telegram.org, under API Development.
api_id = 473887
api_hash = 'aef057abbbd06dbae724a7e7a8dca9ef'

client = TelegramClient('session_name', api_id, api_hash)
client.start()

print(client.get_me().stringify())
