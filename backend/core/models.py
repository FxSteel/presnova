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
    ]

    song = models.ForeignKey(Song, related_name="sections", on_delete=models.CASCADE)
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES, default="verse")
    order = models.PositiveIntegerField()
    text = models.TextField()

    class Meta:
        ordering = ["order"]

