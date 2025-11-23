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
        # If the websocket has sent a message:
        if(text_data_json.get('message')):
            message_text = text_data_json.get('message')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_received',
                    'message_text': message_text,
                    'message_user': self.scope['user'].username,
                }
            )
            await self.create_message(text=message_text)

    # Receive Message from Room Group:
    async def message_received(self, event):
        # Send Message to Websocket:
        await self.send(text_data=json.dumps({
            'message': event.get('message_text'),
            'user': event.get('message_user')}))

    # Receive File from Room Group:
    async def file_received(self, event):
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


class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = "call_%s" % (self.room_id)
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
        event_type = text_data_json.get('type')
        data = text_data_json.get('data')

        # If the websocket has sent ice candidates:
        if(event_type == 'ice'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'ice_received',
                    'ice': data.get('ice'),
                    'sender': self.scope['user'].username,
                })

        # If the websocket has sent an offer to start a call:
        elif(event_type == 'offer'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'offer_received',
                    'offer': data.get('offer'),
                    'call_type': data.get('callType'),
                    'sender': self.scope['user'].username,
                })

        # If the websocket has sent an answer to start a call:
        elif(event_type == 'answer'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'answer_received',
                    'answer': data.get('answer'),
                    'sender': self.scope['user'].username,
                })
        elif(event_type == "call_status"):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_status_received',
                    'status': data.get('status'),
                    'sender': self.scope['user'].username,
                }
            )

    # Receive Call Offer from Room Group:
    async def offer_received(self, event):
        # If the offer's sender is not the same as this socket's target, send the offer...
        if(self.scope['user'].username != event.get('sender')):
            await self.send(
                text_data=json.dumps(
                    {
                        'offer': event.get('offer'),
                        'call_type': event.get('call_type'),
                        'sender': event.get('sender'),
                    }
                )
            )

    # Receive Call Answer from Room Group:
    async def answer_received(self, event):
        # If the answer's sender is not the same as this socket's target, send the answer...
        if(self.scope['user'].username != event.get('sender')):
            await self.send(
                text_data=json.dumps(
                    {
                        'answer': event.get('answer'),
                        'sender': event.get('sender'),
                    }
                )
            )

    # Receive Ice Candidates from Room Group:
    async def ice_received(self, event):
        # If the ice's sender is not the same as this socket's target, send the ice...
        if(self.scope['user'].username != event.get('sender')):
            await self.send(
                text_data=json.dumps(
                    {
                        'ice': event.get('ice'),
                        'sender': event.get('sender'),
                    }
                )
            )

    # Receive Call Status from Room Group:
    async def call_status_received(self, event):
        if(self.scope['user'].username != event.get('sender')):
            await self.send(
                text_data=json.dumps(
                    {
                        'status': event.get("status"),
                    }
                )
            )
