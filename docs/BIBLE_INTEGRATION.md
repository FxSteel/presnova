# Biblia Integration (PresNova)

Overview

PresNova now supports Bible passages as a content source without storing Bible texts in the database. The backend proxies requests to an external Bible API and caches responses.

Key points

- Do NOT store full Bible texts in the DB.
- Frontend calls PresNova endpoints under `/api/bible/` (the frontend never calls the external API directly).
- Supported versions (friendly keys): RVR1960, NVI, NTV, LBLA, KJV. Mapping to external API IDs is configured in `core/services/bible_client.py`.
- Caching: passages and book lists are cached using Django cache (24 hours TTL by default).

Configuration

- Set `BIBLE_API_KEY` in your environment or in `.env`.

Endpoints

- `GET /api/bible/versions/` — list supported friendly versions.
- `GET /api/bible/books/?version=RVR1960` — list books for a version.
- `GET /api/bible/passage/?version=RVR1960&book=GEN&chapter=1&verse_start=1&verse_end=3` — get normalized passage text.

Slides

- Bible slides are represented using `SongSection` with `section_type='bible'` and bible reference fields set (`bible_version`, `bible_book`, `bible_chapter`, `bible_verse_start`, `bible_verse_end`).
- The DB stores only the reference (no text). The Output/Stage endpoints resolve the text at runtime using the cached service.

Notes

- Update `VERSION_MAP` in `core/services/bible_client.py` with the correct external Bible IDs for your API provider.
- Ensure `BIBLE_API_KEY` is correctly set in production and kept secret.
