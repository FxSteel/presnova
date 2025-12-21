"""Minimal, robust wrapper for API.Bible (scripture.api.bible / rest.api.bible).

This module provides a stable interface expected by the views:
- `get_versions()` -> friendly/local version keys
- `get_remote_versions()` -> upstream bible ids available for the API key
- `get_books(version)` -> list of books for a version (accepts either
   a friendly version key or a real upstream `bibleId`)
- `get_passage(version, book, chapter, verse_start, verse_end=None)`

It is safe to import and will raise `BibleClientError` for configuration
or upstream problems. The implementation uses the `api-key` header and
defaults to the official `https://rest.api.bible/v1` base URL unless
overridden by `BIBLE_API_BASE_URL` in Django settings or env.
"""

import os
import logging
from typing import List, Dict, Optional

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)
CACHE_TTL = 24 * 60 * 60

# Default base; allow override via settings or environment
DEFAULT_BIBLE_API_BASE = getattr(settings, 'BIBLE_API_BASE_URL', None) or os.getenv('BIBLE_API_BASE_URL') or 'https://rest.api.bible/v1'


class BibleClientError(Exception):
    pass


def _get_api_key() -> str:
    key = getattr(settings, 'BIBLE_API_KEY', None) or os.getenv('BIBLE_API_KEY')
    if isinstance(key, str):
        key = key.strip()
    if not key:
        raise BibleClientError('BIBLE_API_KEY is not configured')
    return key


def _get_headers() -> Dict[str, str]:
    api_key = _get_api_key()
    try:
        logger.debug('BIBLE_API_KEY present length=%d', len(api_key))
    except Exception:
        pass
    return {'api-key': api_key}


# Optional local mapping of friendly keys to bible ids. Keep minimal — the
# canonical way to discover available upstream bible IDs is `get_remote_versions()`.
VERSION_MAP: Dict[str, str] = getattr(settings, 'BIBLE_VERSION_MAP', {}) or {}


def get_versions() -> List[str]:
    """Return configured friendly version keys (local map)."""
    return list(VERSION_MAP.keys())


def _normalize_bible_id(version_or_id: str) -> str:
    """If `version_or_id` is a friendly key, map it; otherwise assume it's
    already an upstream bibleId and return as-is.
    """
    if not version_or_id:
        raise BibleClientError('Unsupported bible version: empty')
    if version_or_id in VERSION_MAP:
        return VERSION_MAP[version_or_id]
    # Otherwise assume the caller passed a real bibleId
    return version_or_id


def get_remote_versions() -> List[Dict[str, str]]:
    """Fetch available bibles from the upstream API and return list of
    dicts with `id`, `name` and `abbreviation`.
    """
    cache_key = 'bible:remote:versions'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = f"{DEFAULT_BIBLE_API_BASE}/bibles"
    headers = _get_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        result = []
        for item in data.get('data', []):
            result.append({
                'id': item.get('id'),
                'name': item.get('name'),
                'abbreviation': item.get('abbreviation'),
            })
        cache.set(cache_key, result, CACHE_TTL)
        return result
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching remote versions: {e}')


def get_books(version: str) -> List[Dict[str, str]]:
    """Return books for a friendly version key or a raw bibleId.

    Response is a list of dicts: { 'id': str, 'name': str, 'abbreviation': str }
    """
    bible_id = _normalize_bible_id(version)
    cache_key = f'bible:books:{bible_id}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = f"{DEFAULT_BIBLE_API_BASE}/bibles/{bible_id}/books"
    headers = _get_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        books = []
        for item in data.get('data', []):
            books.append({
                'id': item.get('id'),
                'name': item.get('name'),
                'abbreviation': item.get('abbreviation'),
            })
        cache.set(cache_key, books, CACHE_TTL)
        return books
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching books: {e}')


def _resolve_book_id(version: str, book_query: str) -> str:
    """Resolve a human book name/abbrev or an API book id to the API book id.

    Raises BibleClientError('Unsupported book: <query>') if no match.
    """
    if not book_query:
        raise BibleClientError('Unsupported book: empty')

    # If the query already looks like an id, return it as-is
    q = book_query.strip()
    # Try exact match (case-insensitive)
    books = get_books(version)
    q_lower = q.lower()
    for b in books:
        bid = b.get('id') or ''
        if bid and bid.lower() == q_lower:
            return bid

    for b in books:
        name = (b.get('name') or '').lower()
        abbrev = (b.get('abbreviation') or '').lower()
        if q_lower == name or q_lower == abbrev or q_lower in name:
            return b.get('id')

    raise BibleClientError(f'Unsupported book: {book_query}')


def get_passage(version: str, book: str, chapter: int, verse_start: int, verse_end: Optional[int] = None) -> str:
    """Fetch passage text. `version` may be a friendly key or a bibleId.

    Returns normalized plain text. Raises BibleClientError on errors.
    """
    bible_id = _normalize_bible_id(version)
    if verse_end is None:
        verse_end = verse_start

    # Resolve book to API id (may raise BibleClientError)
    book_id = _resolve_book_id(version, book)

    reference = f"{book_id} {chapter}:{verse_start}-{verse_end}" if verse_start != verse_end else f"{book_id} {chapter}:{verse_start}"

    url = f"{DEFAULT_BIBLE_API_BASE}/bibles/{bible_id}/passages"
    headers = _get_headers()
    params = {'q': reference, 'content-type': 'text'}
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        parts = []
        for item in data.get('data', []):
            content = item.get('content') or item.get('text') or ''
            if isinstance(content, list):
                content = ' '.join([c.get('text', '') for c in content if isinstance(c, dict)])
            parts.append(content.strip())
        text = '\n'.join([p for p in parts if p])
        return text
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching passage: {e}')

"""Minimal, robust wrapper for API.Bible (scripture.api.bible / rest.api.bible).

Features:
- Configurable base URL via `BIBLE_API_BASE_URL` setting or env var.
- Uses `api-key` header (no Bearer tokens).
- Provides `get_remote_versions()`, `get_books_by_bible_id()` and
  `get_passage_by_bible_id()` helpers that return normalized data or raise
  `BibleClientError` with informative messages.
"""

import os
import logging
import requests
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)
CACHE_TTL = 24 * 60 * 60

# Allow override via settings or environment variable
DEFAULT_BIBLE_API_BASE = getattr(settings, 'BIBLE_API_BASE_URL', None) or os.getenv('BIBLE_API_BASE_URL') or 'https://rest.api.bible/v1'


class BibleClientError(Exception):
    pass


def _get_api_key():
    key = getattr(settings, 'BIBLE_API_KEY', None) or os.getenv('BIBLE_API_KEY')
    if isinstance(key, str):
        key = key.strip()
    if not key:
        raise BibleClientError('BIBLE_API_KEY is not configured')
    return key


def _get_headers():
    api_key = _get_api_key()
    try:
        logger.debug('BIBLE_API_KEY present length=%d', len(api_key))
    except Exception:
        pass
    return {'api-key': api_key}


def get_remote_versions():
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles"
    headers = _get_headers()
    cache_key = 'bible:remote:versions'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        result = []
        for item in data.get('data', []):
            result.append({'id': item.get('id'), 'name': item.get('name'), 'abbreviation': item.get('abbreviation')})
        cache.set(cache_key, result, CACHE_TTL)
        return result
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching remote versions: {e}')


def get_books_by_bible_id(bible_id: str):
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles/{bible_id}/books"
    headers = _get_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return [{'id': i.get('id'), 'name': i.get('name'), 'abbreviation': i.get('abbreviation')} for i in data.get('data', [])]
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching books: {e}')


def get_passage_by_bible_id(bible_id: str, book_id: str, chapter: int, verse_start: int, verse_end: int = None):
    if verse_end is None:
        verse_end = verse_start
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles/{bible_id}/passages"
    headers = _get_headers()
    reference = f"{book_id} {chapter}:{verse_start}-{verse_end}"
    params = {'q': reference, 'content-type': 'text'}
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        parts = []
        for item in data.get('data', []):
            content = item.get('content') or item.get('text') or ''
            if isinstance(content, list):
                content = ' '.join([c.get('text', '') for c in content if isinstance(c, dict)])
            parts.append(content.strip())
        text = '\n'.join([p for p in parts if p])
        return text
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching passage: {e}')



import os
import requests
from django.core.cache import cache
from django.conf import settings
import logging

# TTL for cached passages (seconds) — 24 hours
CACHE_TTL = 24 * 60 * 60

# Mapping of friendly version keys to API.Bible / scripture.api.bible bible IDs
# Update these IDs to match the ones provided by the scripture.api.bible service
VERSION_MAP = {
    'RVR1960': 'rvr1960',
    'NVI': 'nvi',
    'NTV': 'ntv',
    'LBLA': 'lbla',
    'KJV': 'kjv',
}


class BibleClientError(Exception):
    pass


def _get_api_key():

# Base URL for the Bible API. Default to scripture.api.bible but allow override
# via Django settings (BIBLE_API_BASE_URL) or environment variable.
DEFAULT_BIBLE_API_BASE = getattr(settings, 'BIBLE_API_BASE_URL', None) or os.getenv('BIBLE_API_BASE_URL')
if not DEFAULT_BIBLE_API_BASE:
    # Use the official REST base shown in API.Bible dashboard by default
    DEFAULT_BIBLE_API_BASE = 'https://rest.api.bible/v1'

logger = logging.getLogger(__name__)
    # Prefer settings.BIBLE_API_KEY if set
    key = getattr(settings, 'BIBLE_API_KEY', None)
    if not key:
        key = os.getenv('BIBLE_API_KEY')
    # Normalize: strip surrounding whitespace if present
    if isinstance(key, str):
        key = key.strip()

    if not key:
        raise BibleClientError('BIBLE_API_KEY is not configured')
    return key




def _get_headers():
    """Return headers required by API.Bible (do not include Authorization Bearer)."""
    api_key = _get_api_key()
    # Log presence and length but never the key itself
    try:
        logger.debug('Using BIBLE_API_KEY of length %d', len(api_key) if api_key else 0)
    except Exception:
        pass
    return {'api-key': api_key}
def get_versions():
    """Return supported version keys."""
    return list(VERSION_MAP.keys())


def resolve_book_id(version_key: str, book_query: str) -> str:
    """Resolve a human-friendly book name/abbrev or an API book id to the API book id.

    - Tries exact id match first.
    - Then matches case-insensitive against the book `name` and `abbreviation` returned
      by `get_books` for the requested version.
    - Raises BibleClientError('Unsupported book: <query>') if no match.
    base = DEFAULT_BIBLE_API_BASE
    url = f'{base}/bibles/{bible_id}/books'
    headers = _get_headers()
    # Try to get books list (this itself may raise BibleClientError on version/key issues)
    books = get_books(version_key)

    q = book_query.strip().lower()

    # First try exact id match
    for b in books:
        if b.get('id') and b.get('id').lower() == q:
            return b.get('id')

    # Then try matching name or abbreviation
    for b in books:
        name = (b.get('name') or '').lower()
        abbrev = (b.get('abbreviation') or '').lower()
        if q == name or q == abbrev or q in name or q == abbrev:
            return b.get('id')

    # No match — raise informative error
    raise BibleClientError(f'Unsupported book: {book_query}')


def _get_bible_id(version_key: str) -> str:
    if version_key not in VERSION_MAP:
        raise BibleClientError(f'Unsupported bible version: {version_key}')
    return VERSION_MAP[version_key]


def get_books(version_key: str):
    """Return list of books for the requested version.

    Response: list of { 'id': str, 'name': str, 'abbrev': str }
    """
    bible_id = _get_bible_id(version_key)
    cache_key = f'bible:books:{bible_id}'
    cached = cache.get(cache_key)
    if cached is not None:
    base = DEFAULT_BIBLE_API_BASE
    api_key = _get_api_key()
    base = 'https://api.scripture.api.bible/v1'
    url = f'{base}/bibles/{bible_id}/books'
    headers = {'api-key': api_key}
    headers = _get_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        books = []
        for item in data.get('data', []):
            books.append({
                'id': item.get('id'),
                'name': item.get('name'),
                'abbreviation': item.get('abbreviation'),
            })
        cache.set(cache_key, books, CACHE_TTL)
        return books
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching books: {e}')


def get_passage(version_key: str, book_query: str, chapter: int, verse_start: int, verse_end: int = None):
    """Return a normalized passage text for the requested reference.

    `book_query` may be either an API book id or a human-friendly name/abbreviation.
    This function will resolve the correct API book id for the requested version.
    """
    bible_id = _get_bible_id(version_key)
    if verse_end is None:
        verse_end = verse_start

    # Resolve book to API id (may raise BibleClientError('Unsupported book: ...'))
    book_id = resolve_book_id(version_key, book_query)


def get_remote_versions():
    """Fetch available bibles from the upstream API and return list of {id,name,abbreviation}.

    This is useful to discover the real `bibleId` values for this account.
    """
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles"
    headers = _get_headers()
    cache_key = 'bible:remote:versions'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        result = []
        for item in data.get('data', []):
            result.append({
                'id': item.get('id'),
                'name': item.get('name'),
                'abbreviation': item.get('abbreviation'),
            })
        cache.set(cache_key, result, CACHE_TTL)
        return result
    except requests.HTTPError as e:
        status = None
        try:
            status = e.response.status_code
            msg = e.response.text
        except Exception:
            msg = str(e)
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching remote versions: {e}')

    # Cache key uses version + book + chapter + range
    cache_key = f'bible:passage:{bible_id}:{book_id}:{chapter}:{verse_start}:{verse_end}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    api_key = _get_api_key()
    base = 'https://api.scripture.api.bible/v1'

    # Construct a user-friendly reference and call the passages endpoint
    reference = f'{book_id} {chapter}:{verse_start}-{verse_end}'
    url = f'{base}/bibles/{bible_id}/passages'
    headers = {'api-key': api_key}
    params = {'q': reference, 'content-type': 'text'}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # Normalize: join returned passages' content
        text_parts = []
        for item in data.get('data', []):
            # Some responses include nested content lists or text fields
            content = item.get('content') or item.get('text') or ''
            if isinstance(content, list):
                content = ' '.join([c.get('text', '') for c in content if isinstance(c, dict)])
            text_parts.append(content.strip())

        text = '\n'.join([p for p in text_parts if p])
        cache.set(cache_key, text, CACHE_TTL)
        return text
    except requests.HTTPError as e:
        # Try to include upstream status in message
        status = None
        try:
            status = e.response.status_code
            msg = e.response.text
        except Exception:
            msg = str(e)
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching passage: {e}')
