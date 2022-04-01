from django.shortcuts import render, redirect

# Create your views here.


def redirect_view(req):
    return redirect("index")


def index(req):
    return render(req, "base/index.html")


def room(req, room_name):
    context = {
        "room_name": room_name,
    }
    return render(req, "base/room.html", context)
