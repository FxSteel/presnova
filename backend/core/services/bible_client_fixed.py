"""Clean Bible client implementation compatible with views.

Exports:
- get_versions
- get_remote_versions
- get_books
- get_passage
- BibleClientError

This file intentionally avoids touching the corrupted `bible_client.py` so
we can restore a working import surface quickly.
"""

import os
import logging
from typing import List, Dict, Optional

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)
CACHE_TTL = 24 * 60 * 60

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


VERSION_MAP: Dict[str, str] = getattr(settings, 'BIBLE_VERSION_MAP', {}) or {}


def get_versions() -> List[str]:
    return list(VERSION_MAP.keys())


def _normalize_bible_id(version_or_id: str) -> str:
    if not version_or_id:
        raise BibleClientError('Unsupported bible version: empty')
    if version_or_id in VERSION_MAP:
        return VERSION_MAP[version_or_id]
    return version_or_id


def get_remote_versions() -> List[Dict[str, str]]:
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
            result.append({'id': item.get('id'), 'name': item.get('name'), 'abbreviation': item.get('abbreviation')})
        cache.set(cache_key, result, CACHE_TTL)
        return result
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching remote versions: {e}')


def get_books(version: str) -> List[Dict[str, str]]:
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
            books.append({'id': item.get('id'), 'name': item.get('name'), 'abbreviation': item.get('abbreviation')})
        cache.set(cache_key, books, CACHE_TTL)
        return books
    except requests.HTTPError as e:
        status = getattr(e.response, 'status_code', None)
        msg = getattr(e.response, 'text', str(e))
        raise BibleClientError(f'Upstream API error ({status}): {msg}')
    except requests.RequestException as e:
        raise BibleClientError(f'Error fetching books: {e}')


def _resolve_book_id(version: str, book_query: str) -> str:
    if not book_query:
        raise BibleClientError('Unsupported book: empty')
    q = book_query.strip()
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
    bible_id = _normalize_bible_id(version)
    if verse_end is None:
        verse_end = verse_start
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