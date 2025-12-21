# PresNova - Presentation State Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  OPERATOR PAGE   │      │  OUTPUT PAGE     │      │  STAGE PAGE      │
│  (Frontend)      │      │  (Frontend)      │      │  (Frontend)      │
│                  │      │                  │      │                  │
│ • Select slide   │      │ • Display slide  │      │ • Show current   │
│ • Send POST      │      │ • Fullscreen     │      │ • Show next      │
│ • Operator view  │      │ • Audience view  │      │ • Operator view  │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                        │
         │ 1. POST                 │ 2. GET                 │ 3. GET
         │ /api/presentation/      │ /api/presentation/     │ /api/presentation/
         │   state/                │   output/              │   stage/
         │                         │                        │
         └────────────┬────────────┴────────────┬───────────┘
                      │                        │
                      ▼ 🔐 JWT Auth           ▼
              ┌──────────────────────────────────────┐
              │   DJANGO REST FRAMEWORK BACKEND      │
              │   (Backend - Single Source of Truth) │
              └──────────────────────────────────────┘
                      │              │              │
         ┌────────────┴──────────────┴──────────────┴────────┐
         │                                                    │
    ┌─────────────────────────┐                              │
    │  PresentationStateView   │                              │
    │  ├─ GET /state/         │                              │
    │  └─ POST /state/        │                              │
    └──────────┬──────────────┘                              │
               │                                              │
    ┌──────────┴────────────────────────────────────────┐    │
    │                                                   │    │
    │  core_presentationstate (DATABASE)               │    │
    │  ┌────────────────────────────────────────────┐  │    │
    │  │ id: 1 (SINGLE GLOBAL INSTANCE)             │  │    │
    │  │ active_song_id: 6                          │  │    │
    │  │ active_section_id: 10                      │  │    │
    │  │ updated_at: 2025-12-21T02:50:00Z           │  │    │
    │  └────────────────────────────────────────────┘  │    │
    │                   │         │                     │    │
    │    ┌──────────────┘         └──────────┐         │    │
    │    │                                   │         │    │
    │    ▼                                   ▼         │    │
    │  ┌────────────┐              ┌──────────────┐   │    │
    │  │   Song(6)  │              │SongSection   │   │    │
    │  │ Title:     │              │ (id=10-12)   │   │    │
    │  │ Amazing    │              │ • Verse 1    │   │    │
    │  │ Grace      │              │ • Verse 2    │   │    │
    │  │            │              │ • Chorus     │   │    │
    │  └────────────┘              └──────────────┘   │    │
    │                                                   │    │
    └───────────────────────────────────────────────────┘    │
                                                             │
    ┌────────────────────────────────────────────────────────┤
    │ PresentationOutputView                                 │
    │ ├─ GET /output/  → returns { "active": {...} }        │
    │ └─ Consumed by Output Page (polls every 500ms)        │
    │                                                        │
    ├────────────────────────────────────────────────────────┤
    │ PresentationStageView                                  │
    │ ├─ GET /stage/ → returns {"current": {...}, ...}      │
    │ └─ Consumed by Stage Page (polls every 500ms)         │
    └────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Flow 1: Operator Selects a Slide

```
┌─────────────────────────┐
│  Operator clicks        │
│  "Verse 1" (section 10) │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Frontend POST Request                   │
│ URL: /api/presentation/state/           │
│ Body: { "section_id": 10 }              │
│ Header: Authorization: Bearer <token>   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Backend (PresentationStateView)          │
│ 1. Find SongSection(id=10)              │
│ 2. Get associated Song(id=6)            │
│ 3. Update PresentationState:            │
│    - active_song_id = 6                 │
│    - active_section_id = 10             │
│    - updated_at = now()                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Database Updated                        │
│ core_presentationstate:                 │
│ id=1, song_id=6, section_id=10          │
└─────────────────────────────────────────┘
```

### Flow 2: Output Reads and Displays

```
┌─────────────────────────┐
│ Output Page Timer       │
│ (every 500ms)           │
└────────────┬────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend GET Request                 │
│ URL: /api/presentation/output/       │
│ Header: Authorization: Bearer <token>│
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Backend (PresentationOutputView)      │
│ 1. Get PresentationState(id=1)       │
│ 2. If no active_section → return null │
│ 3. Else fetch SongSection(id=10)     │
│ 4. Serialize with SectionDisplay     │
│    Serializer:                        │
│    - id: 10                           │
│    - song_id: 6                       │
│    - song_title: "Amazing Grace"      │
│    - section_type: "verse"            │
│    - order: 1                         │
│    - text: "Amazing grace..."         │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Response JSON                        │
│ {                                    │
│   "active": {                        │
│     "id": 10,                        │
│     "song_id": 6,                    │
│     "song_title": "Amazing Grace",   │
│     "section_type": "verse",         │
│     "order": 1,                      │
│     "text": "Amazing grace..."       │
│   }                                  │
│ }                                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend Renders                     │
│ Output Page displays:                │
│ "Amazing grace, how sweet..."        │
│ (fullscreen for audience)            │
└──────────────────────────────────────┘
```

### Flow 3: Stage Shows Current + Next

```
┌──────────────────────────┐
│ Stage Page Timer         │
│ (every 500ms)            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend GET Request                 │
│ URL: /api/presentation/stage/        │
│ Header: Authorization: Bearer <token>│
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Backend (PresentationStageView)              │
│ 1. Get PresentationState(id=1)              │
│ 2. If no active_song → return {current: null}
│ 3. Get all sections of Song(id=6)           │
│    ordered by "order" field                 │
│ 4. Find current section in list             │
│    → sections[0] = SongSection(id=10)       │
│ 5. Get next section (if exists)             │
│    → sections[1] = SongSection(id=11)       │
│ 6. Serialize both using SectionDisplay      │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────────┐
│ Response JSON                                 │
│ {                                             │
│   "current": {                                │
│     "id": 10,                                 │
│     "song_id": 6,                             │
│     "song_title": "Amazing Grace",            │
│     "section_type": "verse",                  │
│     "order": 1,                               │
│     "text": "Amazing grace..."                │
│   },                                          │
│   "next": {                                   │
│     "id": 11,                                 │
│     "song_id": 6,                             │
│     "song_title": "Amazing Grace",            │
│     "section_type": "verse",                  │
│     "order": 2,                               │
│     "text": "That saved a wretch..."          │
│   }                                           │
│ }                                             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend Renders                     │
│ Stage shows:                         │
│ Current: "Amazing grace..."          │
│ Next: "That saved a wretch..."       │
│ (operator's reference)               │
└──────────────────────────────────────┘
```

---

## 📊 Database Model Relationships

```
┌──────────────────┐
│   Song           │ (id=6)
│ ┌──────────────┐ │
│ │ id: 6        │ │
│ │ title        │ │
│ │ author       │ │
│ │ key          │ │
│ └──────────────┘ │
└────────┬─────────┘
         │ 1 (One)
         │
         │ (sections)
         │
         │ Many
         ▼
┌──────────────────┐
│  SongSection     │ (id=10, 11, 12)
│ ┌──────────────┐ │
│ │ id: 10       │ │ ◄── PresentationState.active_section
│ │ song_id: 6   │ │
│ │ section_type │ │
│ │ order: 1     │ │
│ │ text         │ │
│ └──────────────┘ │
└──────────────────┘


┌─────────────────────────────┐
│  PresentationState          │
│ ┌───────────────────────┐   │
│ │ id: 1 (GLOBAL)        │   │
│ │ active_song_id: 6 ───────►(refers to Song)
│ │ active_section_id: 10 ────►(refers to SongSection)
│ │ updated_at: timestamp │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────┐
│ Operator Credentials    │
│ username: "testuser"    │
│ password: "testpass123" │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ POST /api/auth/login/                   │
│ {                                       │
│   "username": "testuser",               │
│   "password": "testpass123"             │
│ }                                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Response                                │
│ {                                       │
│   "access": "eyJhbGc...",               │
│   "refresh": "eyJhbGc..."               │
│ }                                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Store Token                             │
│ localStorage.setItem('auth_token',      │
│   'eyJhbGc...')                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ All API Requests                        │
│                                         │
│ Header: {                               │
│   'Authorization': 'Bearer eyJhbGc...'  │
│ }                                       │
└─────────────────────────────────────────┘
```

---

## 🔀 Request/Response Examples

### 1. Set Active Slide

**Request**:
```http
POST /api/presentation/state/ HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "section_id": 10
}
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "active_song": 6,
  "active_section": 10,
  "updated_at": "2025-12-21T02:50:00.123456Z"
}
```

### 2. Get Output Slide

**Request**:
```http
GET /api/presentation/output/ HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
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

### 3. Get Stage (Current + Next)

**Request**:
```http
GET /api/presentation/stage/ HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
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

## 🎯 Deployment Architecture

```
┌────────────────────────────────────────────────┐
│              PRODUCTION DEPLOYMENT             │
└────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Frontend (React/Vite)           │
│  • Operator Page                        │
│  • Output Page                          │
│  • Stage Page                           │
│  (Deployed on Vercel/Netlify/etc)      │
└────────────┬────────────────────────────┘
             │ HTTPS Requests
             │ (Production URL)
             ▼
┌─────────────────────────────────────────┐
│      Backend (Django/Gunicorn)          │
│  • API Endpoints                        │
│  • JWT Authentication                   │
│  • State Management                     │
│  (Deployed on Heroku/AWS/DigitalOcean) │
└────────────┬────────────────────────────┘
             │ ORM Queries
             ▼
┌─────────────────────────────────────────┐
│      Database (PostgreSQL)              │
│  • PresentationState                    │
│  • Song                                 │
│  • SongSection                          │
│  • User Authentication Data             │
│  (Managed DB service)                   │
└─────────────────────────────────────────┘
```

---

## 📈 Scalability Notes

### Current Implementation (Good for small deployments)
- ✅ Single instance global state
- ✅ Simple polling (500ms)
- ✅ Suitable for 1-5 simultaneous presentations

### Future Enhancements (For larger deployments)
- WebSocket connections (real-time)
- Multiple presentation states (per-event)
- Redis caching
- Database replication
- Load balancing

---

## 🛡️ Security Considerations

```
┌─────────────────────────────────┐
│     SECURITY LAYERS             │
└─────────────────────────────────┘

Layer 1: Authentication
├─ JWT Token
├─ Token expiration
└─ Refresh token mechanism

Layer 2: Authorization
├─ IsAuthenticated permission
├─ User-specific access
└─ Role-based access (future)

Layer 3: Transport
├─ HTTPS in production
├─ Secure cookies (httpOnly)
└─ CORS configuration

Layer 4: Database
├─ SQL injection prevention
├─ ORM parameterization
└─ Migrations validation
```

---

✅ **Architecture is production-ready and follows Django best practices**
