from rest_framework import serializers
from .models import Song, SongSection, PresentationState


class SongSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongSection
        fields = [
            'id', 'section_type', 'order', 'text',
            'bible_version', 'bible_book', 'bible_chapter', 'bible_verse_start', 'bible_verse_end',
            'song'
        ]
        extra_kwargs = {
            'id': {'read_only': False, 'required': False}
        }


class SongSerializer(serializers.ModelSerializer):
    sections = SongSectionSerializer(many=True, required=False)

    class Meta:
        model = Song
        fields = ['id', 'title', 'author', 'key', 'created_at', 'updated_at', 'sections']
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        sections_data = validated_data.pop('sections', [])
        song = Song.objects.create(**validated_data)
        
        # Crear secciones (ignorar id si viene, se generará automáticamente)
        for section_data in sections_data:
            section_data.pop('id', None)  # Remover id si viene
            SongSection.objects.create(song=song, **section_data)
        
        return song

    def update(self, instance, validated_data):
        sections_data = validated_data.pop('sections', None)
        
        # Actualizar campos de la canción
        instance.title = validated_data.get('title', instance.title)
        instance.author = validated_data.get('author', instance.author)
        instance.key = validated_data.get('key', instance.key)
        instance.save()
        
        # Actualizar secciones si se proporcionan
        if sections_data is not None:
            # Obtener IDs válidos de secciones existentes que vienen en el payload
            incoming_section_ids = {
                section_data.get('id') 
                for section_data in sections_data 
                if section_data.get('id') and section_data.get('id') > 0
            }
            
            # Eliminar secciones que no están en el payload
            if incoming_section_ids:
                instance.sections.exclude(id__in=incoming_section_ids).delete()
            else:
                # Si no hay IDs válidos, todas son nuevas, eliminar todas las existentes
                instance.sections.all().delete()
            
            # Actualizar o crear secciones
            for section_data in sections_data:
                section_id = section_data.pop('id', None)
                
                # Solo actualizar si el ID existe y es válido (> 0)
                if section_id and section_id > 0 and instance.sections.filter(id=section_id).exists():
                    # Actualizar sección existente
                    section = instance.sections.get(id=section_id)
                    section.section_type = section_data.get('section_type', section.section_type)
                    section.order = section_data.get('order', section.order)
                    section.text = section_data.get('text', section.text)
                    section.save()
                else:
                    # Crear nueva sección (sin id o con id inválido)
                    SongSection.objects.create(song=instance, **section_data)
        
        return instance


class SectionDisplaySerializer(serializers.ModelSerializer):
    """Serializer de solo lectura para mostrar slides en Output/Stage."""
    song_id = serializers.SerializerMethodField()
    song_title = serializers.SerializerMethodField()
    bible_reference = serializers.SerializerMethodField()

    class Meta:
        model = SongSection
        fields = ['id', 'song_id', 'song_title', 'section_type', 'order', 'text', 'bible_reference']
        read_only_fields = ['id', 'song_id', 'song_title', 'section_type', 'order', 'text']

    def get_song_id(self, obj):
        return obj.song.id if obj.song else None

    def get_song_title(self, obj):
        return obj.song.title if obj.song else None

    def get_bible_reference(self, obj):
        if obj.section_type == 'bible':
            start = obj.bible_verse_start or ''
            end = obj.bible_verse_end or ''
            if end and end != start:
                verses = f"{start}-{end}"
            else:
                verses = f"{start}" if start else ''
            return {
                'version': obj.bible_version,
                'book': obj.bible_book,
                'chapter': obj.bible_chapter,
                'verses': verses,
            }
        return None


class PresentationStateSerializer(serializers.ModelSerializer):
    """Serializer para PresentationState que expone song y section IDs."""
    class Meta:
        model = PresentationState
        fields = ['id', 'active_song', 'active_section', 'updated_at']
        read_only_fields = ['id', 'updated_at']

