import os
import json
import base64
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PushSubscription, NotificationPreference

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe(request):
    data = request.data
    endpoint = data.get('endpoint')
    p256dh = data.get('keys', {}).get('p256dh', '')
    auth = data.get('keys', {}).get('auth', '')

    if not endpoint:
        return Response({'error': 'endpoint required'}, status=status.HTTP_400_BAD_REQUEST)

    sub, _ = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={'user': request.user, 'p256dh': p256dh, 'auth': auth}
    )
    return Response({'status': 'subscribed'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    endpoint = request.data.get('endpoint')
    PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return Response({'status': 'unsubscribed'})

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def preferences(request):
    prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response({
            'meal_reminders': prefs.meal_reminders,
            'water_reminders': prefs.water_reminders,
            'breakfast_time': str(prefs.breakfast_time),
            'lunch_time': str(prefs.lunch_time),
            'dinner_time': str(prefs.dinner_time),
            'water_interval_hours': prefs.water_interval_hours,
        })

    fields = ['meal_reminders', 'water_reminders', 'breakfast_time',
              'lunch_time', 'dinner_time', 'water_interval_hours']
    for field in fields:
        if field in request.data:
            setattr(prefs, field, request.data[field])
    prefs.save()
    return Response({'status': 'updated'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vapid_public_key(request):
    key = os.getenv('VAPID_PUBLIC_KEY', '')
    return Response({'public_key': key})
