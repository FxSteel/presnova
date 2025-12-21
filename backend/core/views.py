from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Song, SongSection, PresentationState
from django.db import transaction, IntegrityError
from .serializers import SongSerializer, PresentationStateSerializer, SectionDisplaySerializer
from .services.bible_client_fixed import get_versions, get_books, get_passage, get_remote_versions, BibleClientError
from django.core.cache import cache


def get_or_create_presentation_state():
    """Helper: obtiene o crea el estado global de presentación.

    Se fija explícitamente `id=1` para garantizar una única fila global.
    Se usa una transacción para reducir la posibilidad de duplicados en condiciones
    de concurrencia; en caso de IntegrityError se intenta recuperar la fila existente.
    """
    try:
        with transaction.atomic():
            instance, created = PresentationState.objects.get_or_create(id=1)
            return instance
    except IntegrityError:
        # En caso raro de condición de carrera, intentar recuperar cualquier fila existente
        return PresentationState.objects.first()


@api_view(['GET'])
@permission_classes([AllowAny])
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
    Requiere autenticación.
    """
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Optimiza las consultas usando prefetch_related para cargar las secciones
        de manera eficiente y mantener el orden definido en el modelo.
        """
        return Song.objects.prefetch_related('sections').all()


class BibleVersionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Return the real bible IDs available to this API key/account
            versions = get_remote_versions()
            return Response({'versions': versions})
        except BibleClientError as e:
            msg = str(e)
            lower = msg.lower()
            if 'not configured' in lower:
                return Response({'error': msg}, status=500)
            if '(401)' in lower or 'unauthor' in lower:
                return Response({'error': 'API.Bible unauthorized - check API key and endpoint'}, status=502)
            return Response({'error': msg}, status=502)


class BibleBooksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        version = request.query_params.get('version')
        if not version:
            return Response({'error': 'version param is required'}, status=400)

        try:
            books = get_books(version)
            return Response({'books': books})
        except BibleClientError as e:
            msg = str(e)
            lower = msg.lower()
            if 'not configured' in lower:
                return Response({'error': msg}, status=500)
            if 'unsupported bible version' in lower:
                return Response({'error': msg}, status=400)
            if '(401)' in lower or 'unauthor' in lower:
                return Response({'error': 'API.Bible unauthorized - check API key and endpoint'}, status=502)
            return Response({'error': msg}, status=502)


class BiblePassageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        version = request.query_params.get('version')
        book = request.query_params.get('book')
        chapter = request.query_params.get('chapter')
        verse_start = request.query_params.get('verse_start')
        verse_end = request.query_params.get('verse_end')

        if not all([version, book, chapter, verse_start]):
            return Response({'error': 'version, book, chapter and verse_start are required'}, status=400)

        try:
            chapter_i = int(chapter)
            vs = int(verse_start)
            ve = int(verse_end) if verse_end else vs
        except ValueError:
            return Response({'error': 'chapter, verse_start and verse_end must be integers'}, status=400)

        try:
            # get_passage will resolve the provided `book` to a valid API book id
            text = get_passage(version, book, chapter_i, vs, ve)
            ref = f"{book} {chapter_i}:{vs}" + (f"-{ve}" if ve and ve != vs else '')
            return Response({'reference': ref, 'version': version, 'text': text})
        except BibleClientError as e:
            msg = str(e)
            lower = msg.lower()
            if 'not configured' in lower:
                return Response({'error': msg}, status=500)
            if 'unsupported bible version' in lower or 'unsupported book' in lower or 'unsupported book:' in lower:
                return Response({'error': msg}, status=400)
            if '(401)' in lower or 'unauthor' in lower:
                return Response({'error': 'API.Bible unauthorized - check API key and endpoint'}, status=502)
            # Upstream or other errors
            return Response({'error': msg}, status=502)


class BibleSlideCreateView(APIView):
    """Create a SongSection of type 'bible' that stores only the reference.

    POST payload:
      - version, book, chapter, verse_start, verse_end (optional)
      - song_id (optional) -> associate to a Song
      - order (optional) -> position/order value
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        version = request.data.get('version')
        book = request.data.get('book')
        chapter = request.data.get('chapter')
        verse_start = request.data.get('verse_start')
        verse_end = request.data.get('verse_end')
        song_id = request.data.get('song_id')
        order = request.data.get('order') or 0

        if not all([version, book, chapter, verse_start]):
            return Response({'error': 'version, book, chapter and verse_start are required'}, status=400)

        try:
            chapter_i = int(chapter)
            vs = int(verse_start)
            ve = int(verse_end) if verse_end else vs
        except ValueError:
            return Response({'error': 'chapter and verse_start/verse_end must be integers'}, status=400)

        song = None
        if song_id:
            try:
                song = Song.objects.get(id=song_id)
            except Song.DoesNotExist:
                return Response({'error': f'Song id {song_id} not found'}, status=404)

        section = SongSection.objects.create(
            song=song,
            section_type='bible',
            order=order,
            text='',
            bible_version=version,
            bible_book=book,
            bible_chapter=chapter_i,
            bible_verse_start=vs,
            bible_verse_end=ve,
        )

        serializer = SectionDisplaySerializer(section)
        return Response(serializer.data, status=201)


class PresentationStateView(APIView):
    """ Endpoint para obtener y actualizar el estado global de presentación.
    
    GET: Devuelve el estado actual.
    POST: Setea el slide activo o limpia el estado.
        - { "section_id": number }: Setea la sección activa
        - { "clear": true }: Limpia el estado"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtiene el estado actual de presentación."""
        state = get_or_create_presentation_state()
        serializer = PresentationStateSerializer(state)
        return Response(serializer.data)

    def post(self, request):
        """
        Setea el estado de presentación.
        Espera:
            - { "section_id": number } para setear una sección
            - { "clear": true } para limpiar el estado
        """
        state = get_or_create_presentation_state()

        # Si viene "clear": true, limpiar el estado
        if request.data.get('clear'):
            state.active_song = None
            state.active_section = None
            state.save()
            serializer = PresentationStateSerializer(state)
            return Response(serializer.data)

        # Si viene section_id, setear la sección activa
        section_id = request.data.get('section_id')
        if section_id:
            try:
                # Usar select_related para traer la canción en la misma query
                section = SongSection.objects.select_related('song').get(id=section_id)
                # Setear desde la misma instancia y guardar una sola vez
                state.active_section = section
                state.active_song = section.song
                state.save()
                serializer = PresentationStateSerializer(state)
                return Response(serializer.data)
            except SongSection.DoesNotExist:
                return Response(
                    {'error': f'Section with id {section_id} not found'},
                    status=404
                )

        return Response(
            {'error': 'Expected either section_id or clear parameter'},
            status=400
        )


class PresentationOutputView(APIView):
    """
    Endpoint para obtener el slide activo (para Output).
    
    GET: Devuelve los datos del slide activo o null si no hay.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtiene el slide activo para mostrar en Output."""
        state = get_or_create_presentation_state()

        if not state.active_section:
            return Response({'active': None})

        section = state.active_section

        # If section is a bible passage, resolve its text via the bible client (cached)
        if section.section_type == 'bible':
            try:
                text = None
                # Try cache first (service handles caching but we may also cache the final normalized payload)
                cache_key = f'bible:resolved:{section.id}'
                cached = cache.get(cache_key)
                if cached is not None:
                    text = cached
                else:
                    text = get_passage(
                        section.bible_version,
                        section.bible_book,
                        section.bible_chapter,
                        section.bible_verse_start or 1,
                        section.bible_verse_end or section.bible_verse_start or 1,
                    )
                    cache.set(cache_key, text, 24 * 60 * 60)

                # Build serializer data and override text
                serializer = SectionDisplaySerializer(section)
                data = serializer.data
                data['text'] = text
                return Response({'active': data})
            except BibleClientError as e:
                return Response({'error': str(e)}, status=502)

        serializer = SectionDisplaySerializer(section)
        return Response({'active': serializer.data})


class PresentationStageView(APIView):
    """
    Endpoint para obtener el slide actual y el siguiente (para Stage).
    
    GET: Devuelve el slide actual y el siguiente de la canción activa.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtiene el slide actual y el siguiente para Stage."""
        state = get_or_create_presentation_state()

        if not state.active_song or not state.active_section:
            return Response({'current': None, 'next': None})

        # Obtener todas las secciones de la canción activa ordenadas por order e id
        # El orden explícito es crítico para calcular correctamente el siguiente slide
        sections = list(state.active_song.sections.order_by('order', 'id').all())

        # Buscar el índice de la sección activa comparando IDs (más robusto que .index())
        # Esto evita problemas si las instancias no coinciden exactamente en memoria
        current_index = None
        for idx, section in enumerate(sections):
            if section.id == state.active_section_id:
                current_index = idx
                break

        # Si no se encuentra la sección activa en la lista, devolver null
        if current_index is None:
            return Response({'current': None, 'next': None})

        # Serializar la sección actual
        current_section = sections[current_index]
        # If bible, resolve text
        if current_section.section_type == 'bible':
            try:
                current_text = cache.get(f'bible:resolved:{current_section.id}')
                if current_text is None:
                    current_text = get_passage(
                        current_section.bible_version,
                        current_section.bible_book,
                        current_section.bible_chapter,
                        current_section.bible_verse_start or 1,
                        current_section.bible_verse_end or current_section.bible_verse_start or 1,
                    )
                    cache.set(f'bible:resolved:{current_section.id}', current_text, 24 * 60 * 60)
                current_serializer = SectionDisplaySerializer(current_section)
                current_data = current_serializer.data
                current_data['text'] = current_text
            except BibleClientError:
                current_serializer = SectionDisplaySerializer(current_section)
                current_data = current_serializer.data
        else:
            current_serializer = SectionDisplaySerializer(current_section)
            current_data = current_serializer.data

        # Obtener la siguiente sección si existe
        next_data = None
        if current_index + 1 < len(sections):
            next_section = sections[current_index + 1]
            if next_section.section_type == 'bible':
                try:
                    next_text = cache.get(f'bible:resolved:{next_section.id}')
                    if next_text is None:
                        next_text = get_passage(
                            next_section.bible_version,
                            next_section.bible_book,
                            next_section.bible_chapter,
                            next_section.bible_verse_start or 1,
                            next_section.bible_verse_end or next_section.bible_verse_start or 1,
                        )
                        cache.set(f'bible:resolved:{next_section.id}', next_text, 24 * 60 * 60)
                    next_serializer = SectionDisplaySerializer(next_section)
                    next_data = next_serializer.data
                    next_data['text'] = next_text
                except BibleClientError:
                    next_serializer = SectionDisplaySerializer(next_section)
                    next_data = next_serializer.data
            else:
                next_serializer = SectionDisplaySerializer(next_section)
                next_data = next_serializer.data

        return Response({
            'current': current_data,
            'next': next_data
        })

