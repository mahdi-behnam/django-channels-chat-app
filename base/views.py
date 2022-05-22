from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .models import Message, Room
import mimetypes
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@login_required
def index(request):
    q = request.GET.get('q')
    username_query = q if (q is not None and not q.isspace()) else ''
    users_result = User.objects.filter(username__icontains=username_query)

    chats = request.user.rooms.exclude(messages__isnull=True)

    context = {
        "users_result": users_result,
        "chats": chats,
    }
    return render(request, "base/index.html", context)


def login_view(request):
    if(request.user.is_authenticated):
        return redirect("index")
    elif(request.method == "POST"):
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("index")
        else:
            print("failed to log in")
            return redirect("login")
    return render(request, "base/login.html")


def register_view(request):
    if(request.user.is_authenticated):
        return redirect("index")

    elif(request.method == "POST"):
        username = str.lower(request.POST['username'])
        userExists = True if User.objects.filter(
            username=username).exists() else False
        if userExists:
            return redirect("register")
        password = request.POST['password']
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return redirect("index")

    return render(request, "base/register.html")


@login_required
def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def create_room(request, target_username):
    existing_room = Room.objects.filter(
        users__username=request.user.username).filter(users__username=target_username)
    if existing_room:
        return redirect('room', existing_room[0].id)
    else:
        target_user = User.objects.get(username=target_username)
        room = Room.objects.create()
        room.users.add(request.user, target_user)
        return redirect('room', room.id)


@login_required
def room(request, room_id):
    user = request.user
    chats = request.user.rooms.exclude(messages__isnull=True)
    try:
        room = user.rooms.get(id=room_id)
    except Room.DoesNotExist:
        return redirect("index")
    messages = room.messages.all()
    # Determining target user
    for user in room.users.all():
        if(user != request.user):
            target_user = user
    context = {
        "room_id": int(room_id),
        'messages': messages,
        "chats": chats,
        'current_user': request.user.username,
        'target_user': target_user,
    }
    return render(request, "base/index.html", context)


@login_required
def room_upload_file(request, room_id):
    if not request.FILES or request.method != "POST":
        return redirect('room', room_id)
    user = request.user
    try:
        room = user.rooms.get(id=room_id)
    except Room.DoesNotExist:
        return redirect("index")
    uploaded_file = request.FILES['file']
    message = Message.objects.create(room=room, user=user, media=uploaded_file)
    try:
        mimetype_result = mimetypes.guess_type(message.media.name)[0].split(
            '/')[0]
    except:
        mimetype_result = None
    finally:
        message.media_type = mimetype_result if mimetype_result in [
            'image', 'video'] else None
    message.save()
    layer = get_channel_layer()
    room_group_name = "chat_%s" % (room_id)
    async_to_sync(layer.group_send)(room_group_name, {
        'type': 'file_received', 'user': request.user.username, 'file_name': message.media.name, 'file_url': message.media.url, 'file_type': message.media_type})
    return HttpResponse(status=200)
