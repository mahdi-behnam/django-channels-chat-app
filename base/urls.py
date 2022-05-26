from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name="index"),

    path('login/', views.login_view, name="login"),
    path('register/', views.register_view, name="register"),
    path('logout/', views.logout_view, name="logout"),

    path('<str:username>/update_profile/',
         views.user_profile_update, name="update_profile"),

    path('chat/create_room/<str:target_username>/',
         views.create_room, name="create_room"),
    path('chat/<str:room_id>/', views.room, name="room"),
    path('chat/<str:room_id>/upload/',
         views.room_upload_file, name="room_upload"),
]
