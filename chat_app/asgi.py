"""
ASGI config for chat_app project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/asgi/
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_app.settings')

import django  # noqa: E402
django.setup()  # ensure apps are loaded before importing routing

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from django.conf import settings  # noqa: E402
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler  # noqa: E402
from django.core.asgi import get_asgi_application  # noqa: E402
import base.routing  # noqa: E402

http_app = get_asgi_application()
# Serve static files when DEBUG is on and running under Daphne.
if settings.DEBUG:
    http_app = ASGIStaticFilesHandler(http_app)

application = ProtocolTypeRouter(
    {
        "http": http_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(base.routing.websocket_urlpatterns)
        ),
    }
)
