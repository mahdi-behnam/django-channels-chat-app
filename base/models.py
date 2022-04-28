from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Message(models.Model):
    user = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name="messages")
    text = models.CharField(max_length=255)
    media = models.FileField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username + "\t" + self.text


class Room(models.Model):
    users = models.ManyToManyField(User, related_name="rooms")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        users_names = ''
        for user in self.users.all():
            users_names += " " + str(user)
        return users_names
