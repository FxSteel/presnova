from django.db import models


class Song(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True)
    key = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class SongSection(models.Model):
    SECTION_TYPES = [
        ("verse", "Verse"),
        ("chorus", "Chorus"),
        ("bridge", "Bridge"),
        ("prechorus", "Pre-chorus"),
        ("intro", "Intro"),
        ("outro", "Outro"),
        ("tag", "Tag"),
        ("other", "Other"),
        ("bible", "Bible Passage"),
    ]

    song = models.ForeignKey(Song, related_name="sections", on_delete=models.CASCADE, null=True, blank=True)
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES, default="verse")
    order = models.PositiveIntegerField()
    text = models.TextField(blank=True)
    # Bible reference fields (do NOT store bible text here)
    bible_version = models.CharField(max_length=50, blank=True, null=True)
    bible_book = models.CharField(max_length=100, blank=True, null=True)
    bible_chapter = models.PositiveIntegerField(blank=True, null=True)
    bible_verse_start = models.PositiveIntegerField(blank=True, null=True)
    bible_verse_end = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        ordering = ["order"]


class PresentationState(models.Model):
    """
    Estado global centralizado de la presentación.
    Solo debe existir una única instancia (id=1).
    """
    active_song = models.ForeignKey(
        Song,
        related_name="presentation_state",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    active_section = models.ForeignKey(
        SongSection,
        related_name="presentation_state",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Presentation State"
        verbose_name_plural = "Presentation State"

    def __str__(self):
        return f"Presentation State (Song: {self.active_song}, Section: {self.active_section})"

    @classmethod
    def get_or_create_instance(cls):
        """Obtiene o crea la instancia única global de PresentationState."""
        instance, created = cls.objects.get_or_create(id=1)
        return instance

