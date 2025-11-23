from django.db import models
from django.contrib.auth.models import User


class UserImage(models.Model):
    image = models.ImageField(upload_to='user-profile-images/', max_length=100)
    upload_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.image.name


class UserProfile(models.Model):
    image_model = models.OneToOneField(
        UserImage, on_delete=models.SET_NULL, related_name="profile", null=True, blank=True)
    bio = models.TextField(null=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile")

    def __str__(self):
        return self.user.username


class Message(models.Model):
    class Meta:
        ordering = ('created_at',)

    room = models.ForeignKey(
        'Room', null=True, on_delete=models.SET_NULL, related_name="messages")
    user = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name="messages")
    text = models.CharField(null=True, max_length=255)
    media = models.FileField(null=True)
    media_type = models.CharField(max_length=20, default=None, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        file_url = self.media.url if self.media else ""
        users_usernames = ""
        for user in self.room.users.all():
            users_usernames += user.username + " | "
        return "{username}\t({users})\t\t{text}\t\tFILE_URL: {file_url}".format(
            username=self.user.username,
            users=users_usernames,
            text=self.text,
            file_url=file_url,
        )


class Room(models.Model):
    users = models.ManyToManyField(User, related_name="rooms")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        users_names = ''
        for user in self.users.all():
            users_names += " " + str(user)
        return users_names

    def get_last_message(self):
        return self.messages.last().text
