from django.contrib import admin
from .models import Room, Message, UserProfile, UserImage

# Register your models here.
admin.site.register(Room)
admin.site.register(Message)
admin.site.register(UserProfile)
admin.site.register(UserImage)
