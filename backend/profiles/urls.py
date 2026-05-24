from django.urls import path
from . import views

urlpatterns = [
    path('', views.profile, name='profile'),
    path('metrics/', views.metrics, name='metrics'),
    path('avatar/', views.avatar_upload, name='avatar'),
]
