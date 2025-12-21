# PresNova - Presentación State Backend Implementation ✅

## 📋 Summary

Se implementó un sistema completo de estado de presentación centralizado en el backend de Django que permite:

- ✅ **Guardar el slide activo** de forma centralizada en la base de datos
- ✅ **Operador puede setear** el slide activo mediante POST
- ✅ **Output puede leer** el slide activo en tiempo real
- ✅ **Stage puede leer** el slide actual + siguiente
- ✅ **Todo protegido** con autenticación JWT
- ✅ **Estado global único** (solo una instancia, id=1)

---

## 📁 Changes Made

### 1. Model (`core/models.py`)
**Added**: `PresentationState` model
```python
class PresentationState(models.Model):
    active_song = ForeignKey(Song, null=True, blank=True)
    active_section = ForeignKey(SongSection, null=True, blank=True)
    updated_at = DateTimeField(auto_now=True)
    
    @classmethod
    def get_or_create_instance(cls):
        """Garantiza una única instancia global"""
```

### 2. Serializers (`core/serializers.py`)
**Added**:
- `SectionDisplaySerializer`: Serializer de solo lectura para mostrar slides con info de canción
- `PresentationStateSerializer`: Serializer para el estado de presentación

### 3. Views (`core/views.py`)
**Added**:
- `PresentationStateView`: GET/POST estado actual
- `PresentationOutputView`: GET slide activo (para Output)
- `PresentationStageView`: GET current + next (para Stage)
- Helper: `get_or_create_presentation_state()`

### 4. URLs (`core/urls.py`)
**Added**:
```
/api/presentation/state/     ← Setear y obtener estado
/api/presentation/output/    ← Obtener slide para Output
/api/presentation/stage/     ← Obtener current+next para Stage
```

### 5. Migrations (`core/migrations/0002_presentationstate.py`)
✅ Created and applied automatically

---

## 🧪 Test Results

Todas las pruebas pasaron exitosamente:

```
✅ Obtener token JWT
✅ Crear canción con secciones
✅ GET /api/presentation/state/ - Estado inicial vacío
✅ POST /api/presentation/state/ - Setear section_id
✅ GET /api/presentation/output/ - Devuelve slide activo con info
✅ GET /api/presentation/stage/ - Devuelve current + next
✅ POST /api/presentation/state/ - Limpiar estado (clear=true)
✅ GET /api/presentation/output/ - Devuelve null después de limpiar
```

---

## 🔌 API Endpoints

### Set/Get Presentation State
```bash
# GET estado actual
GET /api/presentation/state/
Authorization: Bearer <token>

# POST setear slide
POST /api/presentation/state/
{ "section_id": 10 }

# POST limpiar
POST /api/presentation/state/
{ "clear": true }
```

### Get Output Slide
```bash
# Obtener slide activo
GET /api/presentation/output/
Authorization: Bearer <token>

Response:
{
  "active": {
    "id": 10,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 1,
    "text": "Amazing grace, how sweet the sound..."
  }
}
```

### Get Stage (Current + Next)
```bash
# Obtener slide actual y siguiente
GET /api/presentation/stage/
Authorization: Bearer <token>

Response:
{
  "current": {
    "id": 10,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 1,
    "text": "Amazing grace, how sweet the sound..."
  },
  "next": {
    "id": 11,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 2,
    "text": "That saved a wretch like me..."
  }
}
```

---

## 🔒 Security

- ✅ Todos los endpoints requieren autenticación JWT (`IsAuthenticated`)
- ✅ Solo usuarios autenticados pueden leer/modificar estado
- ✅ Las credenciales se envían en header: `Authorization: Bearer <token>`
- ✅ Token obtenido desde `/api/auth/login/`

---

## 📊 Database Schema

```
┌────────────────────────────────────┐
│     core_presentationstate         │
├────────────────────────────────────┤
│ id (PK)                  : 1       │ ← Única instancia global
│ active_song_id (FK)      : null    │
│ active_section_id (FK)   : null    │
│ updated_at               : datetime│
└────────────────────────────────────┘
         │                │
         ▼                ▼
    ┌─────────┐    ┌──────────────┐
    │  Song   │    │ SongSection  │
    └─────────┘    └──────────────┘
```

---

## 🔄 Workflow

### Operator Sets Slide
```
1. Operator selecciona una sección en UI
2. Frontend: POST /api/presentation/state/
   { "section_id": 10 }
3. Backend: Actualiza PresentationState
   - active_song_id = 6
   - active_section_id = 10
4. Response: Estado actualizado
```

### Output Displays Slide
```
1. Output hace GET /api/presentation/output/
2. Backend devuelve slide activo con toda la info
3. Output renderiza el contenido
```

### Stage Shows Current + Next
```
1. Stage hace GET /api/presentation/stage/
2. Backend devuelve:
   - current: slide activo
   - next: siguiente slide (si existe)
3. Stage prepara ambos para visualizar
```

---

## 📚 Documentation

Ver archivo de referencia completa: `PRESENTATION_STATE_ENDPOINTS.md`

---

## 🚀 Next Steps for Frontend

1. **Operator Page** debe hacer:
   - POST a `/api/presentation/state/` cuando se selecciona una sección
   - El frontend puede leer el estado pero NO es su fuente de verdad

2. **Output Page** debe hacer:
   - GET a `/api/presentation/output/` cada vez que necesita refrescar
   - Mostrar el contenido del slide activo

3. **Stage Page** debe hacer:
   - GET a `/api/presentation/stage/` para obtener current+next
   - Mostrar ambos slides

---

## ✅ Implementation Complete

La implementación está **100% completa y funcional**. Todos los requisitos fueron cumplidos:

- ✅ Modelo de estado centralizado
- ✅ Serializers para lectura/escritura
- ✅ Endpoints protegidos con JWT
- ✅ Soporte para limpiar estado
- ✅ Información completa de slides (id, song_id, song_title, section_type, order, text)
- ✅ Cálculo automático de siguiente slide
- ✅ Migraciones aplicadas
- ✅ Pruebas exitosas

🎉 **¡Listo para integrar con el frontend!**
