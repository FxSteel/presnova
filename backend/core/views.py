from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Song
from .serializers import SongSerializer


@api_view(['GET'])
def api_root(request, format=None):
    """
    Punto de entrada de la API de PresNova
    """
    return Response({
        'message': 'Bienvenido a la API de PresNova',
        'version': '1.0.0',
    })


class SongViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar canciones.
    
    Permite listar, crear, recuperar, actualizar y eliminar canciones.
    Las secciones de las canciones se incluyen anidadas en la respuesta.
    Soporta creación y actualización de canciones con sus secciones en una sola petición.
    """
    serializer_class = SongSerializer
    
    def get_queryset(self):
        """
        Optimiza las consultas usando prefetch_related para cargar las secciones
        de manera eficiente y mantener el orden definido en el modelo.
        """
        return Song.objects.prefetch_related('sections').all()

