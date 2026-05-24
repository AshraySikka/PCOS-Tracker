from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate, name='exercise-generate'),
    path('current/', views.current, name='exercise-current'),
]
