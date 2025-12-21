# Frontend Integration Guide - Presentation State

## 📝 Overview

El backend de PresNova ahora tiene un sistema centralizado de estado de presentación. Este documento explica cómo el frontend debe consumir estas APIs.

---

## 🔗 API Endpoints

### Base URL
```
http://localhost:8000/api/presentation/
```

### Endpoints
- `GET /state/` - Obtener estado actual
- `POST /state/` - Setear/limpiar estado
- `GET /output/` - Obtener slide para Output Display
- `GET /stage/` - Obtener current + next para Stage Display

**Nota**: Todos requieren `Authorization: Bearer <token>`

---

## 📦 Implementation Checklist

### 1. **Operator Page** (Setea el estado)

**Responsabilidad**: Cuando el operador selecciona una sección, enviar POST a `/api/presentation/state/`

```typescript
// src/pages/OperatorPage.tsx

import { useState } from 'react';

export function OperatorPage() {
  const [loading, setLoading] = useState(false);

  const handleSelectSection = async (sectionId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token'); // Get from AuthContext
      const response = await fetch(
        'http://localhost:8000/api/presentation/state/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ section_id: sectionId })
        }
      );
      const data = await response.json();
      console.log('State updated:', data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render sections, when clicked call handleSelectSection */}
    </div>
  );
}
```

**Key Points**:
- El frontend NO debe guardar el estado en su propio state (fuente de verdad es el backend)
- Solo envía el comando POST
- No necesita esperar confirmación (puede hacerlo en background)
- Puede mostrar optimisticamente mientras se actualiza

---

### 2. **Output Page** (Lee el estado)

**Responsabilidad**: Obtener el slide activo y mostrarlo

```typescript
// src/pages/OutputPage.tsx

import { useEffect, useState } from 'react';

interface SlideData {
  id: number;
  song_id: number;
  song_title: string;
  section_type: string;
  order: number;
  text: string;
}

export function OutputPage() {
  const [slide, setSlide] = useState<SlideData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOutput = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'http://localhost:8000/api/presentation/output/',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setSlide(data.active); // Can be null
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch inicial
    fetchOutput();

    // Poll cada 500ms (o usa WebSocket para mejor performance)
    const interval = setInterval(fetchOutput, 500);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!slide) {
    return <div className="text-center text-gray-400">No slide active</div>;
  }

  return (
    <div className="output-container">
      <div className="song-title">{slide.song_title}</div>
      <div className="section-type">{slide.section_type}</div>
      <div className="slide-text">{slide.text}</div>
    </div>
  );
}
```

**Key Points**:
- Hacer GET a `/api/presentation/output/` periódicamente
- Mostrar null si no hay slide activo
- Información disponible: id, song_id, song_title, section_type, order, text
- Ideal para mostrar en pantalla grande

---

### 3. **Stage Page** (Lee current + next)

**Responsabilidad**: Mostrar el slide actual y el siguiente

```typescript
// src/pages/StagePage.tsx

import { useEffect, useState } from 'react';

interface SlideData {
  id: number;
  song_id: number;
  song_title: string;
  section_type: string;
  order: number;
  text: string;
}

interface StageData {
  current: SlideData | null;
  next: SlideData | null;
}

export function StagePage() {
  const [stage, setStage] = useState<StageData>({
    current: null,
    next: null
  });
  const [loading, setLoading] = useState(true);

  const fetchStage = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'http://localhost:8000/api/presentation/stage/',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setStage(data); // { current: {...}, next: {...} }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch inicial
    fetchStage();

    // Poll cada 500ms
    const interval = setInterval(fetchStage, 500);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="stage-container">
      <div className="current-section">
        <h2>Current</h2>
        {stage.current ? (
          <div>
            <h3>{stage.current.song_title}</h3>
            <p className="section-type">{stage.current.section_type}</p>
            <div className="text">{stage.current.text}</div>
          </div>
        ) : (
          <p className="text-gray-400">No current slide</p>
        )}
      </div>

      <div className="next-section">
        <h2>Next</h2>
        {stage.next ? (
          <div>
            <h3>{stage.next.song_title}</h3>
            <p className="section-type">{stage.next.section_type}</p>
            <div className="text">{stage.next.text}</div>
          </div>
        ) : (
          <p className="text-gray-400">No next slide</p>
        )}
      </div>
    </div>
  );
}
```

**Key Points**:
- Hacer GET a `/api/presentation/stage/` periódicamente
- Recibe current y next (ambos pueden ser null)
- Perfecto para que el operador vea qué viene
- next será null si ya estamos en el último slide

---

## 🎯 Integration Strategy

### Architecture
```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Operator Page   │      │  Output Page     │      │  Stage Page      │
│  (Sets state)    │      │  (Shows slide)   │      │  (Shows current) │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                        │
         │ POST /state/            │ GET /output/          │ GET /stage/
         │ { section_id: 5 }       │ (every 500ms)         │ (every 500ms)
         │                         │                        │
         └────────────┬────────────┴────────────┬───────────┘
                      │                        │
                      ▼                        ▼
              ┌──────────────────────────────────────┐
              │   Backend - Presentation State       │
              │   (Single source of truth)           │
              │   - active_song_id = 6               │
              │   - active_section_id = 5            │
              │   - updated_at = timestamp           │
              └──────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Environment Variables (frontend .env)
```
VITE_API_URL=http://localhost:8000
```

### API Client Setup (src/api/client.ts)
```typescript
const API_BASE = process.env.VITE_API_URL || 'http://localhost:8000';

export function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function fetchPresentation(endpoint: string) {
  const response = await fetch(
    `${API_BASE}/api/presentation/${endpoint}/`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('API Error');
  return response.json();
}

export async function setPresentationState(data: any) {
  const response = await fetch(
    `${API_BASE}/api/presentation/state/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }
  );
  if (!response.ok) throw new Error('API Error');
  return response.json();
}
```

---

## 🔄 Polling vs WebSocket

### Current Implementation (Polling)
```typescript
// Simple polling every 500ms
useEffect(() => {
  const interval = setInterval(fetchData, 500);
  return () => clearInterval(interval);
}, []);
```

**Pros**: Simple, works everywhere
**Cons**: Latency, network overhead

### Future Enhancement (WebSocket)
```typescript
// Real-time updates
const ws = new WebSocket('ws://localhost:8000/ws/presentation/');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setSlide(data.active);
};
```

---

## 🧪 Testing Steps

### 1. Start Backend
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### 2. Create Test Data
```bash
# Use cURL or REST client to create a song with sections
# See TESTING_WITH_CURL.md for examples
```

### 3. Test Operator Page
- Open Operator page
- Select a section
- Should POST to /api/presentation/state/
- Check browser DevTools Network tab

### 4. Test Output Page
- Open Output page in new window
- Select a section from Operator
- Output should update (may need to refresh)
- Try different sections

### 5. Test Stage Page
- Open Stage page in new window
- Select a section from Operator
- Stage should show current and next
- Navigate to last section - next should be null

---

## ⚠️ Error Handling

### Common Errors

**401 Unauthorized**
```json
{ "detail": "Authentication credentials were not provided." }
```
**Solution**: Ensure token is in localStorage and included in header

**404 Not Found**
```json
{ "error": "Section with id 999 not found" }
```
**Solution**: Verify section ID exists in database

**400 Bad Request**
```json
{ "error": "Expected either section_id or clear parameter" }
```
**Solution**: Check POST body has correct format

### Recommended Error Handling
```typescript
try {
  const response = await fetch(url, options);
  if (response.status === 401) {
    // Redirect to login
    redirectToLogin();
  } else if (!response.ok) {
    const error = await response.json();
    showError(error.detail || error.error);
  }
  return response.json();
} catch (error) {
  console.error('Network error:', error);
  showError('Connection failed');
}
```

---

## 🔐 Security Notes

- ✅ Always include JWT token in Authorization header
- ✅ Token should be in localStorage (consider httpOnly cookies for production)
- ✅ Never expose token in logs or error messages
- ✅ Implement token refresh logic (see `/api/auth/refresh/`)

---

## 📊 Performance Tips

1. **Reduce Polling Frequency**
   - Currently 500ms - consider 1000ms if acceptable
   - Use binary exponential backoff on errors

2. **Batch Requests**
   - If multiple components need data, fetch once and share via Context

3. **Cache Responses**
   - Cache previous response to avoid flicker
   - Only update when data actually changes

4. **Consider WebSocket** (future)
   - Real-time updates without polling
   - Better for responsive UI

---

## 📝 Example Context Hook

```typescript
// src/context/PresentationContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';

interface PresentationContextType {
  output: SlideData | null;
  stage: { current: SlideData | null; next: SlideData | null };
  setActiveSlide: (sectionId: number) => Promise<void>;
  clearState: () => Promise<void>;
}

const PresentationContext = createContext<PresentationContextType>(null!);

export function PresentationProvider({ children }: any) {
  const [output, setOutput] = useState<SlideData | null>(null);
  const [stage, setStage] = useState({ current: null, next: null });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [outputRes, stageRes] = await Promise.all([
        fetch('http://localhost:8000/api/presentation/output/', { headers }),
        fetch('http://localhost:8000/api/presentation/stage/', { headers })
      ]);

      const outputData = await outputRes.json();
      const stageData = await stageRes.json();

      setOutput(outputData.active);
      setStage(stageData);
    };

    const interval = setInterval(fetchData, 500);
    return () => clearInterval(interval);
  }, []);

  const setActiveSlide = async (sectionId: number) => {
    const token = localStorage.getItem('auth_token');
    await fetch('http://localhost:8000/api/presentation/state/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ section_id: sectionId })
    });
  };

  const clearState = async () => {
    const token = localStorage.getItem('auth_token');
    await fetch('http://localhost:8000/api/presentation/state/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clear: true })
    });
  };

  return (
    <PresentationContext.Provider value={{ output, stage, setActiveSlide, clearState }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  return useContext(PresentationContext);
}
```

**Usage**:
```typescript
function MyComponent() {
  const { output, stage, setActiveSlide } = usePresentation();
  return (
    <div>
      <button onClick={() => setActiveSlide(5)}>Select Section 5</button>
      <div>{output?.text}</div>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Backend is running (`python manage.py runserver`)
- [ ] Database migrated (`python manage.py migrate`)
- [ ] Test data created (songs with sections)
- [ ] Operator Page can POST to `/api/presentation/state/`
- [ ] Output Page displays active slide
- [ ] Stage Page shows current and next
- [ ] Error handling implemented
- [ ] Token management working
- [ ] No console errors

---

## 🚀 Next Steps

1. Implement the three pages (Operator, Output, Stage)
2. Test with cURL or REST client first
3. Integrate with frontend components
4. Add error handling and loading states
5. Consider WebSocket for real-time updates
6. Add tests for API calls

¡Listo para empezar! 🎉
