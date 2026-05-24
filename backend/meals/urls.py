from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate, name='meal-generate'),
    path('current/', views.current, name='meal-current'),
]
