# Presentation State API - Endpoints Reference

## Overview
Estado de presentación centralizado para soportar Output y Stage Display reales. Todo protegido con JWT.

---

## Endpoints

### 1. **Get/Set Presentation State**
**Endpoint**: `POST /api/presentation/state/`
**Method**: POST, GET
**Authentication**: Required (JWT)

#### GET - Obtener estado actual
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/presentation/state/
```

**Response**:
```json
{
  "id": 1,
  "active_song": 1,
  "active_section": 5,
  "updated_at": "2025-12-21T02:50:00Z"
}
```

#### POST - Setear slide activo
**Body**: `{ "section_id": <number> }`
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 5}' \
  http://localhost:8000/api/presentation/state/
```

**Response**:
```json
{
  "id": 1,
  "active_song": 1,
  "active_section": 5,
  "updated_at": "2025-12-21T02:50:00Z"
}
```

#### POST - Limpiar estado
**Body**: `{ "clear": true }`
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"clear": true}' \
  http://localhost:8000/api/presentation/state/
```

**Response**:
```json
{
  "id": 1,
  "active_song": null,
  "active_section": null,
  "updated_at": "2025-12-21T02:50:00Z"
}
```

---

### 2. **Get Output Slide**
**Endpoint**: `GET /api/presentation/output/`
**Method**: GET
**Authentication**: Required (JWT)

Obtiene el slide activo para mostrar en Output.

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/presentation/output/
```

**Response** (con slide activo):
```json
{
  "active": {
    "id": 5,
    "song_id": 1,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 1,
    "text": "Amazing grace, how sweet the sound..."
  }
}
```

**Response** (sin slide activo):
```json
{
  "active": null
}
```

---

### 3. **Get Stage Slide (Current + Next)**
**Endpoint**: `GET /api/presentation/stage/`
**Method**: GET
**Authentication**: Required (JWT)

Obtiene el slide actual y el siguiente para Stage Display.

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/presentation/stage/
```

**Response** (con slide activo):
```json
{
  "current": {
    "id": 5,
    "song_id": 1,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 1,
    "text": "Amazing grace, how sweet the sound..."
  },
  "next": {
    "id": 6,
    "song_id": 1,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 2,
    "text": "That saved a wretch like me..."
  }
}
```

**Response** (sin slide activo):
```json
{
  "current": null,
  "next": null
}
```

**Response** (último slide, sin siguiente):
```json
{
  "current": {
    "id": 10,
    "song_id": 1,
    "song_title": "Amazing Grace",
    "section_type": "outro",
    "order": 8,
    "text": "When we've been there ten thousand years..."
  },
  "next": null
}
```

---

## How It Works

### Operator Flow (Setear slide activo)
1. Operator selecciona una sección
2. Envía POST a `/api/presentation/state/` con `{ "section_id": <id> }`
3. Backend actualiza el estado global
4. Output y Stage leen automáticamente el nuevo estado

### Output Flow (Mostrar slide)
1. Output hace GET a `/api/presentation/output/`
2. Recibe el slide activo con toda su información
3. Renderiza el contenido

### Stage Flow (Mostrar actual + siguiente)
1. Stage hace GET a `/api/presentation/stage/`
2. Recibe slide actual y siguiente
3. Prepara ambos para la visualización del operador

---

## Error Responses

### Invalid Section ID
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 999}' \
  http://localhost:8000/api/presentation/state/
```

**Response** (404):
```json
{
  "error": "Section with id 999 not found"
}
```

### Missing Parameters
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:8000/api/presentation/state/
```

**Response** (400):
```json
{
  "error": "Expected either section_id or clear parameter"
}
```

### Unauthorized
```bash
curl http://localhost:8000/api/presentation/state/
```

**Response** (401):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Implementation Details

### Database Model
- **Table**: `core_presentationstate`
- **Unique**: Solo una fila global (id=1) gracias a `get_or_create_instance()`
- **Fields**:
  - `id`: Primary Key (1)
  - `active_song`: ForeignKey a Song (nullable)
  - `active_section`: ForeignKey a SongSection (nullable)
  - `updated_at`: DateTime (auto_now)

### Authentication
- Todos los endpoints requieren JWT
- Token obtenido desde `/api/auth/login/`
- Pasar en header: `Authorization: Bearer <token>`

### State Lifecycle
```
┌─────────────────────────────────────────────┐
│  PresentationState (global, id=1)           │
│  - active_song: null                        │
│  - active_section: null                     │
└─────────────────────────────────────────────┘
                    │
                    ▼
        POST /api/presentation/state/
        { "section_id": 5 }
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  PresentationState (global, id=1)           │
│  - active_song: 1 (Amazing Grace)           │
│  - active_section: 5 (Verse 1)              │
└─────────────────────────────────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
      Output    Operator   Stage
      Reads     Confirms    Reads
```
