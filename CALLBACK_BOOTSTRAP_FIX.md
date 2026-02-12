# ✅ Fixed: "signal is aborted without reason" en Callback

## Problema
Después de que el usuario confirma su email y es redirigido desde Supabase:
```
❌ AbortError: signal is aborted without reason
❌ No se pudo cargar el workspace
```

## Causa Raíz
El callback route (`/auth/callback`) intentaba hacer **polling** para workspace, pero el workspace **nunca se había creado** porque:

1. El bootstrap solo se ejecutaba en el flujo de `signIn()` (login manual)
2. Cuando el usuario es redirigido desde email confirmation, **no pasa por `signIn()`**
3. El usuario iba directo a callback sin workspace
4. El polling fallaba porque no encontraba nada
5. El AbortSignal abortaba la solicitud después de 10 segundos

## Solución

### 1. Agregar Bootstrap en el Callback
El callback ahora ejecuta el bootstrap ANTES de hacer polling:

```typescript
// app/auth/callback/page.tsx
const startPolling = async () => {
  // Step 1: Bootstrap workspace (create profile, workspace, membership)
  const bootstrapResponse = await fetch('/api/bootstrap', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  })
  
  // Step 2: Poll for workspace membership
  // (only after bootstrap is done or attempted)
}
```

### 2. Aumentar Timeouts
Aumenté los timeouts de 10s a 20s en `providers.tsx`:
- Bootstrap: `AbortSignal.timeout(20000)`
- Workspaces: `AbortSignal.timeout(20000)`

Y a 15s en el callback:
- Bootstrap: `AbortSignal.timeout(15000)`

## Flujo Correcto Ahora

```
1. Usuario confirma email → Supabase redirige a /auth/callback
2. Callback obtiene sesión del usuario
3. Callback llama a /api/bootstrap para crear workspace
   ✅ Crea profile, workspace, workspace_members
4. Callback intenta polling a /api/auth/workspaces
   ✅ Ahora encuentra el workspace (porque ya fue creado en paso 3)
5. Después de encontrar workspace → Redirect a /operator
   ✅ Usuario ve el dashboard con workspace cargado
```

## Cambios Realizados

### app/auth/callback/page.tsx
- Agregar llamada a `/api/bootstrap` antes del polling
- Usar token de la sesión actual
- Manejo de errores para no bloquear el polling si bootstrap falla
- Timeout de 15 segundos para bootstrap

### app/providers.tsx
- Aumentar timeout de bootstrap de 10s a 20s
- Agregar timeout de 20s a workspaces endpoint

## Resultado

**Antes:**
```
[CALLBACK] Starting workspace polling...
[CALLBACK] ⏳ Attempt 1/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 2/12: No workspaces found yet
... (12 intentos, todos fallan)
❌ AbortError: signal is aborted without reason
```

**Después:**
```
[CALLBACK] ✅ Session found for user: [UUID]
[CALLBACK] 🔄 Running bootstrap endpoint...
[CALLBACK] ✅ Bootstrap successful: [workspace-id]
[CALLBACK] Starting workspace polling...
[CALLBACK] ⏳ Attempt 1/12: No workspaces found yet
[CALLBACK] ✅ Found 1 workspace(s) on attempt 2
[CALLBACK] ✅ Redirecting to operator with workspace: [workspace-id]
✅ Usuario ve el dashboard
```

## Prueba

1. Crear cuenta nueva en http://localhost:3000/auth/login
2. Confirmar email en Supabase dashboard
3. Será redirigido a /auth/callback automáticamente
4. Verá "Preparando tu cuenta..." mientras se ejecuta bootstrap y polling
5. Después de ~5-10 segundos → Redirect automático a /operator
6. Dashboard cargado con workspace

## Build Status
✅ Dev Server: http://localhost:3000  
✅ Compilación exitosa
✅ Sin errores

---

**Status**: 🟢 FIXED - Ahora el callback crea el workspace automáticamente  
**Timeouts**: Bootstrap: 15s (callback) / 20s (login), Workspaces: 20s

