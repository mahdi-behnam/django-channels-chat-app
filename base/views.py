from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.core import serializers
from django.contrib.auth.forms import UserCreationForm
from .models import Message, Room, UserImage, UserProfile
import mimetypes
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@login_required
def index(request):
    q = request.GET.get('q')
    username_query = q if (q is not None and not q.isspace()) else None
    if(q):
        users_result = User.objects.filter(
            username__icontains=username_query)
        responseData = {
            'data': serializers.serialize('json', users_result, fields=['username']),
        }
        return JsonResponse(responseData, safe=False)
    else:
        chats = request.user.rooms.exclude(messages__isnull=True)
        context = {
            "chats": chats,
            'current_user': request.user,
        }
        return render(request, "base/index.html", context)


def login_view(request):
    error_message = None
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
            error_message = "Username or Password is incorrect. Try Again!"
    return render(request, "base/login.html", {'error_message': error_message})


def register_view(request):
    error_message = None
    if(request.user.is_authenticated):
        return redirect("index")

    elif(request.method == "POST"):
        username = str.lower(request.POST['username'])
        userExists = True if User.objects.filter(
            username=username).exists() else False
        if userExists:
            error_message = "User Already Exists!"
            return render(request, "base/register.html", {'error_message': error_message})
        else:
            form = UserCreationForm(request.POST)
            if(form.is_valid()):
                user = form.save()
                profile = UserProfile.objects.create(user=user)
                user.profile = profile
                user.save()
                login(request, user)
                return redirect("index")
        error_message = "Couldn't register with these values!"
    return render(request, "base/register.html", {'error_message': error_message})


@login_required
def logout_view(request):
    logout(request)
    return redirect("login")


@login_required
def user_profile_update(request, username):
    if(request.method == "POST"
       and request.user.username == username):
        user = User.objects.get(username=username)
        if(request.FILES):
            image = UserImage.objects.create(image=request.FILES.get('file'))
            user.profile.image_model = image
        if(request.POST.get('bio')):
            bio = request.POST.get('bio')
            user.profile.bio = bio
        user.profile.save()
    return redirect('index')


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
        'current_user': request.user,
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
