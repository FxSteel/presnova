from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Retorna información del usuario autenticado
    """
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email or '',
    })

