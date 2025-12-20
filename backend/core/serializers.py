from rest_framework import serializers
from .models import Song, SongSection


class SongSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongSection
        fields = ['id', 'section_type', 'order', 'text']
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

