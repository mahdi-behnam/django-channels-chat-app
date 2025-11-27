# Real-Time Chat with Voice, Video, and Screen Share

A full-stack messaging platform built with Django, Channels, Redis, PostgreSQL, and WebRTC. Users can exchange real-time messages and files, jump into one-to-one voice or video calls, and even switch to screen sharing without leaving the browser. The UI is responsive, mobile-friendly, and includes profile management with avatars and bios.

## Demo

https://user-images.githubusercontent.com/90272840/170737972-72f478ad-23c4-4ec5-9a7a-53ea9cb0b868.mp4

## Highlights

- Instant messaging powered by Django Channels and Redis-backed websockets
- One-to-one voice calls, video calls, and on-the-fly screen sharing via WebRTC (STUN: Google public servers)
- File sharing with inline preview support for images and videos
- User discovery by username, plus profile images and bios
- Authenticated, private chat rooms with chat history stored in PostgreSQL
- Responsive UI built with Django templates, vanilla JS, and custom styles

## Tech Stack

- Backend: Django 4.x, Django Channels, ASGI (Daphne), Redis channel layer
- Realtime/Media: WebSockets, WebRTC (voice/video/screen share)
- Database: PostgreSQL; file storage via Django media handling (Pillow)
- Frontend: Django templates, JavaScript, CSS; served static assets

## Quick Start

Prerequisites: Python 3.12+, PostgreSQL, Redis.

1. Clone and install dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Configure the database (match `chat_app/settings.py` or update it)

```sql
CREATE DATABASE django_channels_chat_app_db;
CREATE USER django_channels_chat_app_web WITH PASSWORD 'mahdi_chat_app';
GRANT ALL PRIVILEGES ON DATABASE django_channels_chat_app_db TO django_channels_chat_app_web;
\c django_channels_chat_app_db
GRANT ALL PRIVILEGES ON SCHEMA public TO django_channels_chat_app_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO django_channels_chat_app_web;
```

3. Run migrations and create a superuser (optional)

```bash
python manage.py migrate
python manage.py createsuperuser
```

4. Start services

- Redis server (default host/port 127.0.0.1:6379)
- Django ASGI app

```bash
python manage.py runserver    # or: daphne chat_app.asgi:application
```

5. Open the app at http://localhost:8000, register two users, start a chat, and initiate voice/video calls or screen share.

## Project Tour

- `chat_app/asgi.py`: ASGI entrypoint wiring HTTP + websocket protocols
- `base/consumers.py`: WebSocket consumers for chat and call signaling (messages, offers/answers/ICE, call status)
- `base/models.py`: Rooms, messages, user profiles, and file metadata
- `base/views.py`: Auth, profile updates, room creation, file uploads, and chat rendering
- `templates/` + `static/`: Frontend templates, JS for messaging/calls (`static/scripts/call.js`), styles, and assets

## Deployment Notes

- Set a strong `SECRET_KEY`, configure `ALLOWED_HOSTS`, and switch `DEBUG=False`.
- Point `CHANNEL_LAYERS` to your production Redis instance.
- Serve static/media files via a proper web server or object storage.
- If running behind TLS, update WebSocket URLs and STUN/TURN config for WebRTC as needed.
