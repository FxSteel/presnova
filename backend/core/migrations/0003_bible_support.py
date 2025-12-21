from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_presentationstate'),
    ]

    operations = [
        # Allow song FK to be null
        migrations.AlterField(
            model_name='songsection',
            name='song',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.CASCADE, related_name='sections', to='core.song'),
        ),
        # Add bible fields
        migrations.AddField(
            model_name='songsection',
            name='bible_version',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='songsection',
            name='bible_book',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='songsection',
            name='bible_chapter',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='songsection',
            name='bible_verse_start',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='songsection',
            name='bible_verse_end',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        # Allow text to be blank
        migrations.AlterField(
            model_name='songsection',
            name='text',
            field=models.TextField(blank=True),
        ),
    ]
