from django.urls import path
from . import views

urlpatterns = [
    path('today/', views.today, name='log-today'),
    path('', views.by_date, name='log-by-date'),
    path('food/', views.add_food, name='add-food'),
    path('food/estimate/', views.estimate_food, name='estimate-food'),
    path('food/<int:pk>/', views.delete_food, name='delete-food'),
    path('exercise/', views.add_exercise, name='add-exercise'),
    path('exercise/<int:pk>/', views.delete_exercise, name='delete-exercise'),
    path('water/', views.add_water, name='add-water'),
    path('water/<int:pk>/', views.delete_water, name='delete-water'),
]
