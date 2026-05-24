from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/profile/', include('profiles.urls')),
    path('api/meals/', include('meals.urls')),
    path('api/exercise/', include('exercise.urls')),
    path('api/logs/', include('logs.urls')),
    path('api/reports/', include('reports.urls')),
]
