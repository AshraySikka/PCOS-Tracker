from django.urls import path
from . import views

urlpatterns = [
    path('subscribe/', views.subscribe, name='push-subscribe'),
    path('unsubscribe/', views.unsubscribe, name='push-unsubscribe'),
    path('preferences/', views.preferences, name='notif-preferences'),
    path('vapid-key/', views.vapid_public_key, name='vapid-key'),
]
