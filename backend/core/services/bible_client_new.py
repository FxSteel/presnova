"""Replacement Bible client module used to avoid corruption in the previous file.

This module implements the same public functions the rest of the code expects:
- get_versions()
- get_books(version_key)
- get_passage(version_key, book, chapter, verse_start, verse_end)
- get_remote_versions()
- BibleClientError

It discovers real bible IDs by calling the upstream `/v1/bibles` endpoint
and resolves book names to the upstream book IDs before requesting passages.
"""

import os
import logging
import requests
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)
CACHE_TTL = 24 * 60 * 60

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


def _headers():
    return {'api-key': _get_api_key()}


def get_remote_versions():
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles"
    headers = _headers()
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


def _find_bible_id(version_key: str):
    """Try to resolve a provided version_key to a real bibleId from remote versions.

    Accepts either an actual bibleId, or a friendly name/abbrev that matches the
    `name` or `abbreviation` from the upstream `/bibles` response.
    """
    # If it looks like an id (contains a dash or is long), assume it's the id
    if not version_key:
        raise BibleClientError('Unsupported bible version: empty')
    vk = version_key.strip()
    if '-' in vk or len(vk) > 10:
        return vk

    # search remote versions
    versions = get_remote_versions()
    q = vk.lower()
    for v in versions:
        if v.get('id') and v.get('id').lower() == q:
            return v.get('id')
        if v.get('name') and v.get('name').lower() == q:
            return v.get('id')
        if v.get('abbreviation') and v.get('abbreviation').lower() == q:
            return v.get('id')

    raise BibleClientError(f'Unsupported bible version: {version_key}')


def get_books(version_key: str):
    bible_id = _find_bible_id(version_key)
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles/{bible_id}/books"
    try:
        resp = requests.get(url, headers=_headers(), timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return [{'id': i.get('id'), 'name': i.get('name'), 'abbreviation': i.get('abbreviation')} for i in data.get('data', [])]
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching books: {e}')


def _find_book_id(bible_id: str, book_query: str):
    if not book_query:
        raise BibleClientError('Unsupported book: empty')
    q = book_query.strip().lower()
    books = get_books(bible_id)
    for b in books:
        if b.get('id') and b.get('id').lower() == q:
            return b.get('id')
        if b.get('name') and b.get('name').lower() == q:
            return b.get('id')
        if b.get('abbreviation') and b.get('abbreviation').lower() == q:
            return b.get('id')
    raise BibleClientError(f'Unsupported book: {book_query}')


def get_passage(version_key: str, book: str, chapter: int, verse_start: int, verse_end: int = None):
    bible_id = _find_bible_id(version_key)
    book_id = _find_book_id(bible_id, book)
    if verse_end is None:
        verse_end = verse_start
    base = DEFAULT_BIBLE_API_BASE
    url = f"{base}/bibles/{bible_id}/passages"
    reference = f"{book_id} {chapter}:{verse_start}-{verse_end}"
    params = {'q': reference, 'content-type': 'text'}
    try:
        resp = requests.get(url, headers=_headers(), params=params, timeout=10)
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
