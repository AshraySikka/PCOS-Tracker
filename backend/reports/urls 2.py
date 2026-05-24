from django.urls import path
from . import views

urlpatterns = [
    path('weekly/', views.weekly, name='report-weekly'),
    path('monthly/', views.monthly, name='report-monthly'),
]
