from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<first_user>\w+)_((?P<second_user>\w+))/$',
            consumers.ChatConsumer.as_asgi()),
]
