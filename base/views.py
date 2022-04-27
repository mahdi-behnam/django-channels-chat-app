from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required


# Create your views here.


@login_required
def index(request):
    q = request.GET.get('q')
    username_query = q if (q is not None and not q.isspace()) else ''
    users_result = User.objects.filter(username__icontains=username_query)
    context = {
        "users_result": users_result,
        "chats": "Chat Queryset",
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
        username = request.POST['username']
        password = request.POST['password']
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return redirect("index")

    return render(request, "base/register.html")


@login_required
def logout_view(request):
    logout(request)
    return redirect("login")


def room(request, room_name):
    context = {
        "room_name": room_name,
    }
    return render(request, "base/room.html", context)
