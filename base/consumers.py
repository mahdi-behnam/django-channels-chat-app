import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = "chat_%s" % self.room_name
        # Join Room Group:
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave Room Group:
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recieve Message from Websocket:
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive Message from Room Group:
    async def chat_message(self, event):
        message = event['message']

        # Send Message to Websocket:
        await self.send(text_data=json.dumps({
            'message': message,
        }))
