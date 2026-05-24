from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer
from .storage import upload_avatar

@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    profile_obj, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        serializer = UserProfileSerializer(profile_obj)
        return Response(serializer.data)

    if request.method in ['POST', 'PATCH']:
        serializer = UserProfileSerializer(profile_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def metrics(request):
    profile_obj, _ = UserProfile.objects.get_or_create(user=request.user)
    return Response({
        'bmi': profile_obj.bmi,
        'protein_target_g': profile_obj.protein_target_g,
        'per_meal_protein_g': profile_obj.per_meal_protein_g,
        'weight_kg': float(profile_obj.weight_kg) if profile_obj.weight_kg else None,
        'height_cm': float(profile_obj.height_cm) if profile_obj.height_cm else None,
        'activity_level': profile_obj.activity_level,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def avatar_upload(request):
    if 'avatar' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['avatar']
    
    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'File too large. Max 5MB'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        url = upload_avatar(file, request.user.id)
        profile_obj, _ = UserProfile.objects.get_or_create(user=request.user)
        profile_obj.avatar_url = url
        profile_obj.save()
        return Response({'avatar_url': url})
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Upload failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
