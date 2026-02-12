# 🔄 Flujo Mejorado: Bootstrap + Workspace Loading

## ANTES vs DESPUÉS

### ❌ FLUJO ANTERIOR (Buggy)

```
USER CLICKS LOGIN
    ↓
signIn(email, password)
    ├─ supabase.auth.signInWithPassword() ✅
    ├─ /api/bootstrap (sin retry, sin timeout) ❌
    │   └─ signal: AbortSignal.timeout(undefined) ← cuelga
    └─ setTimeout(300ms) ← insuficiente ❌
    
    Mientras tanto:
    → router.push('/operator')
    → useEffect workspaces ejecuta
    → /api/auth/workspaces retorna [] (bootstrap aún en progreso)
    → activeWorkspace = null
    
    Result:
    ❌ operator/page → "No hay workspace"
    ❌ console → "signal is aborted without reason"
```

### ✅ FLUJO MEJORADO (Fixed)

```
USER CLICKS LOGIN
    ↓
signIn(email, password)
    ├─ supabase.auth.signInWithPassword() ✅
    ├─ bootstrapInProgressRef = userId (previene duplicados)
    ├─ Retry Loop (máximo 3 intentos):
    │  ├─ Intento 1: /api/bootstrap
    │  │  ├─ AbortSignal.timeout(10000) ✅
    │  │  ├─ Profile upsert ✅
    │  │  ├─ Workspace upsert (o use existing) ✅
    │  │  ├─ workspace_members upsert ✅
    │  │  └─ Return workspace_id ✅
    │  │
    │  ├─ Si fail: espera 500ms
    │  ├─ Intento 2: reintentar
    │  │  └─ Si fail: espera 1000ms
    │  └─ Intento 3: reintentar
    │     └─ Si fail: console.warn, continue anyway ✅
    │
    ├─ bootstrapCompletedRef.current.add(userId) ✅ (mark as done)
    └─ handleSubmit() espera máximo 3s, luego router.push()
    
    Mientras tanto:
    → useEffect de session actualiza
    → Workspaces useEffect ejecuta
    → /api/auth/workspaces consulta:
    │  ├─ GET memberships para user_id
    │  ├─ Si memberships.length > 0:
    │  │  └─ GET workspaces por IDs
    │  └─ Retorna workspaces (del bootstrap anterior)
    │
    → setWorkspaces([...])
    → setActiveWorkspace(first_or_owned)
    
    Result:
    ✅ operator/page → Renderiza con activeWorkspace
    ✅ Songs list carga correctamente
    ✅ Sin "signal is aborted"
    ✅ Sin "No workspace"
```

## SECUENCIA DE TIMING

### Escenario Normal (3s total)

```
Time 0ms
  ├─ signIn() inicia
  ├─ → supabase.auth.signInWithPassword() → ~500ms
  ├─ → /api/bootstrap (intento 1) → ~1000ms
  │  └─ ✅ Éxito
  ├─ → bootstrapCompletedRef.add()
  └─ → signIn() completa → ~1.5s total

Time 1500ms
  ├─ handleSubmit espera máximo 3s
  ├─ → router.push('/operator') → ~2s
  
Time 2s
  ├─ Workspaces useEffect corre
  ├─ → /api/auth/workspaces → ~500ms
  │  ├─ Query memberships ✅
  │  └─ Query workspaces ✅
  ├─ → setActiveWorkspace()
  └─ → operator/page actualiza → ~2.5s total

Time 2500ms
  ├─ ✅ Página renderiza con workspace
  ├─ Songs list carga
  └─ ✅ SUCCESS
```

### Escenario Lento (Bootstrap tarda, pero retry) (~4s total)

```
Time 0ms
  └─ signIn() inicia

Time ~1s
  ├─ /api/bootstrap intento 1
  ├─ → timeout después 10s (network slow)
  └─ → fail

Time 1500ms
  ├─ Espera 500ms de backoff
  └─ /api/bootstrap intento 2 inicia

Time ~2s
  ├─ /api/bootstrap intento 2
  ├─ → ✅ ÉXITO
  ├─ bootstrapCompletedRef.add()
  └─ signIn() completa

Time 2500ms
  ├─ handleSubmit() espera máximo 3s
  └─ router.push('/operator')

Time 3000ms
  ├─ Workspaces useEffect
  ├─ → /api/auth/workspaces ✅
  └─ → setActiveWorkspace()

Time 3500ms
  └─ ✅ Página renderiza
```

### Escenario Falla Total (Pero graceful fallback) (~4s)

```
Time 0ms
  └─ signIn() inicia

Time ~1s
  ├─ /api/bootstrap intento 1 → fail
  └─ espera 500ms

Time ~2s
  ├─ /api/bootstrap intento 2 → fail
  └─ espera 1000ms

Time ~3.5s
  ├─ /api/bootstrap intento 3 → fail
  ├─ console.warn('Bootstrap failed after retries')
  └─ signIn() completa (NO lanza error) ← graceful

Time 4s
  ├─ handleSubmit() → router.push('/operator')
  
Time 4.5s
  ├─ Workspaces useEffect
  ├─ → /api/auth/workspaces
  ├─ → memberships = [] (no bootstrap data)
  ├─ → workspaces = []
  ├─ → activeWorkspace = null
  │
  └─ operator/page:
     ❌ "No se pudo cargar el workspace"
     [Recargar] ← User can retry
     [Volver a Login] ← Or go back
```

## STATE MANAGEMENT

### AuthContext State

```typescript
// Primary
session: Session | null
user: User | null
workspaces: Workspace[]
activeWorkspace: Workspace | null
loading: boolean

// New
workspacesLoading: boolean

// Private refs
bootstrapInProgressRef: { current: string | null }
bootstrapCompletedRef: { current: Set<string> }
```

**Flow**:
1. `loading` = true mientras se autentica usuario
2. `session` se setea cuando Supabase retorna
3. `workspacesLoading` = true mientras se cargan workspaces
4. `activeWorkspace` se setea cuando workspaces cargan

## ERROR BOUNDARIES

### Network Errors
```
Network fail in bootstrap
  ↓ Retry 1 fails
  ↓ Wait 500ms
  ↓ Retry 2 fails
  ↓ Wait 1000ms
  ↓ Retry 3 fails
  ↓ signIn() completa igual (graceful)
  ↓ Workspaces endpoint intenta cargar
  ↓ Si no hay data → UI fallback
```

### RLS/Permission Errors
```
/api/auth/workspaces retorna 401/403
  ↓ Error logged
  ↓ setWorkspaces([])
  ↓ activeWorkspace = null
  ↓ operator/page muestra fallback
```

### Timeout Errors
```
AbortSignal.timeout(10000) se dispara
  ↓ Error capturado en catch
  ↓ Retry logic maneja
  ↓ Si 3 retries fallan → graceful fallback
```

## LOGGING PATTERN

```typescript
// Cada operación logueada con prefijo
[AUTH]       → AuthProvider changes
[LOGIN]      → Login page submit
[BOOTSTRAP]  → /api/bootstrap server
[WORKSPACES] → /api/auth/workspaces server
[OPERATOR]   → operator/page loading

// Tres niveles
console.log('[PREFIX] ✅ ...')  → Success
console.warn('[PREFIX] ⚠️ ...')  → Warning
console.error('[PREFIX] ❌ ...')  → Error

// Ejemplo completo
[AUTH] Sign in attempt for: juan@example.com
[AUTH] Sign in successful, user: abc-123
[AUTH] Calling bootstrap endpoint (attempt 1/3)...
[BOOTSTRAP] Starting for user: abc-123
[BOOTSTRAP] ✅ Profile upserted for user: abc-123
[BOOTSTRAP] ✅ Workspace already exists: xyz-789
[BOOTSTRAP] ✅ Member upserted: xyz-789 / abc-123
[BOOTSTRAP] ✅ Complete for user: abc-123
[AUTH] Workspaces useEffect triggered
[WORKSPACES] Fetching workspaces for user: abc-123
[WORKSPACES] Found 1 memberships
[WORKSPACES] ✅ Returning 1 workspaces
[AUTH] ✅ Workspaces loaded successfully: 1
[OPERATOR] No session, redirecting to login
```

## PREVENCIÓN DE PROBLEMAS

### Prevención: Múltiples Bootstraps
```typescript
if (bootstrapCompletedRef.current.has(userId)) {
  return // Ya se ejecutó esta sesión
}

// Después de éxito:
bootstrapCompletedRef.current.add(userId)

// En signOut:
bootstrapCompletedRef.current.clear() // Reset para próxima sesión
```

### Prevención: Race Conditions
```typescript
// Bootstrap completa antes de workspaces:
- wait 500ms después de bootstrap éxito
- workspaces useEffect triggerean DESPUÉS de session

// Workspaces solo trigger si session cambia:
useEffect(() => {
  if (!session?.user) return
  // ... load workspaces
}, [session?.user])
```

### Prevención: Stuck UIs
```typescript
// Timeout máximo 3s en login:
const maxWait = 3000
while (Date.now() - start < maxWait) {
  await sleep(100)
}
// Always push, even if not ready

// Operator/page tiene fallback:
if (!activeWorkspace) {
  return <FallbackUI /> // Botones para recuperarse
}
```

---

**Status**: ✅ Flujo completamente mejorado y documentado
