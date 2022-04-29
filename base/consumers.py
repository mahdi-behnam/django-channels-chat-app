import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Room


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = "chat_%s" % (self.room_id)
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
        message_text = text_data_json['message']
        message_user = text_data_json['user']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_text': message_text,
                'message_user': message_user,
            }
        )
        await self.create_message(text=message_text)

    # Receive Message from Room Group:
    async def chat_message(self, event):
        # Send Message to Websocket:
        await self.send(text_data=json.dumps({
            'message': event.get('message_text'),
            'user': event.get('message_user')}))

    # Receive File from Room Group:
    async def file_received(self, event):
        print("FILEURL RECEIVEDDDDDDD")
        print(event)
        # Send FileURL to Websocket:
        await self.send(text_data=json.dumps({
            'user': event.get('user'),
            'file_name': event.get('file_name'),
            'file_url': event.get('file_url'),
            'file_type': event.get('file_type'),
        }))

    # Create a Message model:
    @database_sync_to_async
    def create_message(self, text):
        room = Room.objects.get(id=self.room_id)
        return Message.objects.create(user=self.scope['user'], room=room, text=text)
