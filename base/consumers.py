import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import os


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = "chat_%s" % self.room_name
        # Join Room Group:
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        # Leave Room Group:
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Recieve Message from Websocket:
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive Message from Room Group:
    def chat_message(self, event):
        message = event['message']

        # Send Message to Websocket:
        self.send(text_data=json.dumps({
            'message': message,
        }))
