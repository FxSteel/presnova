# Testing Manual - Guía Completa

## Setup Previo

```bash
npm run dev
```

Asegúrate de que:
- Supabase está corriendo
- Variables de entorno configuradas
- Base de datos con user + workspace en `workspace_members`

---

## Test 1: Login → Refresh (Caso Principal)

### Pasos:
1. Abrir DevTools (F12) → Console
2. Ir a `http://localhost:3000/auth/login`
3. Ingresar email/password válidos
4. Verificar redirect a `/operator`
5. **Console debe mostrar**:
   ```
   [AUTH] session ok - user: {uuid}
   [WS] fetching active workspace
   [WS] active workspace loaded {id: "..."}
   ```
6. Presionar **F5** (refresh)
7. **Verificar**:
   - ✅ Aparece spinner "Preparando workspace..."
   - ✅ Desaparece en < 5 segundos
   - ✅ App carga sin errores
   - ✅ Console show same logs

### ❌ Si falla:
- Spinner no desaparece → **timeout bug**
- Error "No auth header" → **sesión expirada**
- Blank page → **redirect login** (esperado si no hay sesión)

---

## Test 2: URL Directa con Sesión (Rehidratación)

### Pasos:
1. Con sesión válida en otra pestaña
2. Abrir nueva pestaña: `http://localhost:3000/operator`
3. **Verificar**:
   - ✅ Aparece spinner breve
   - ✅ Carga directo sin login
   - ✅ Workspace data visible

### ❌ Si falla:
- Redirect a login → sesión no se detectó
- Spinner infinito → hasFetchedRef bug

---

## Test 3: Timeout Test (Slow 3G)

### Pasos:
1. DevTools → Network tab
2. Dropdown "Throttling" → Seleccionar **"Slow 3G"**
3. En `/operator` → **F5**
4. **Verificar**:
   - ✅ Spinner "Preparando workspace..."
   - ⏱️ Contar segundos...
   - ✅ Al llegar a ~5s: cambia a error UI
   - ✅ Error muestra: "Timeout cargando workspace"
   - ✅ Botón "Reintentar" funciona

### ❌ Si falla:
- Spinner no para → **timeout logic broken**
- Sigue loading después de 5s → **state no se actualiza**

---

## Test 4: Sesión Expirada (401)

### Pasos (opción A - Esperar):
1. Logearse
2. Esperar token expire (~24h)
3. F5 en `/operator`

### Pasos (opción B - Simular):
1. Abrir DevTools → Application → Cookies
2. Eliminar `sb-{project}-auth-token`
3. F5 en `/operator`

### Verificar:
- ✅ Error UI: "Sesión expirada"
- ✅ Botón "Ir a Login"
- ✅ No hay spinner infinito

### Console esperado:
```
[API/WORKSPACES/ACTIVE] Invalid token: ...
[WS] error {code: "UNAUTHORIZED", message: "Unauthorized"}
```

---

## Test 5: Sin Workspace (404)

### Pasos:
1. Crear user nuevo en Supabase sin workspace
2. Logearse con ese user
3. F5 en `/operator`

### Verificar:
- ✅ Error UI: "Sin workspace" 
- ✅ Botón "Crear Workspace"
- ✅ No hay spinner infinito

### Console esperado:
```
[WS] error {code: "NO_WORKSPACE", message: "User has no workspaces"}
```

---

## Test 6: React Strict Mode (Double-Fetch Check)

### Pasos:
1. DevTools → Network tab
2. Filter: `api/workspaces/active`
3. F5 en `/operator`

### Verificar:
- ✅ **UNA SOLA request** a `/api/workspaces/active`
- ❌ NO dos requests (sería double-fetch)

### Debug:
En console deberían aparecer logs UNA SOLA VEZ:
```
[WS] fetching active workspace
[WS] active workspace loaded {id}
```

Si aparecen 2 veces → **hasFetchedRef bug**

---

## Test 7: Retry Manual

### Pasos:
1. Network tab → Throttle Slow 3G
2. F5 en `/operator`
3. Esperar timeout → error UI
4. Hacer click en "Reintentar"

### Verificar:
- ✅ Spinner aparece de nuevo
- ✅ Puede completar o timeout de nuevo
- ✅ Botón funciona múltiples veces

### Debug:
- hasFetchedRef debe resetear a `false`
- Nueva request debe ir a `/api/workspaces/active`

---

## Test 8: Navigation (No Re-fetch)

### Pasos:
1. Estar en `/operator` (workspace cargado)
2. Ir a `/settings` (otra ruta protegida)
3. Network tab → Filter `workspaces`

### Verificar:
- ❌ **NO debe haber request** a `/api/workspaces/active`
- ✅ Workspace ya está en context (cached)

### Razón:
Cuando navigas dentro de (protected) routes, WorkspaceProvider no remonta, así que useEffect no corre.

---

## Test 9: Logout → Login (Session Change)

### Pasos:
1. Estar logeado en `/operator`
2. Abrir sidebar → "Cerrar Sesión"
3. Debe redirect a `/auth/login`
4. Login con OTRO user
5. Debe ir a `/operator`

### Verificar:
- ✅ Console muestra nuevo user ID
- ✅ Workspace del nuevo user se carga
- ❌ NO aparece workspace del user anterior

---

## Test 10: Fast Connection (Normal 4G)

### Pasos:
1. Network → "Fast 4G" o sin throttle
2. F5 en `/operator`

### Verificar:
- ✅ Carga en < 2 segundos
- ✅ Spinner apenas visible
- ✅ App funciona normal

---

## Logs Esperados (Normal Flow)

```
[AUTH] session ok - user: 550e8400-e29b-41d4-a716-446655440000
[WS] fetching active workspace
[WS] active workspace loaded {id: "workspace-uuid"}
```

---

## Logs Esperados (Error 401)

```
[AUTH] session ok - user: 550e8400-e29b-41d4-a716-446655440000
[WS] fetching active workspace
[API/WORKSPACES/ACTIVE] Invalid token: JWT expired
[WS] error {code: "UNAUTHORIZED", message: "Unauthorized"}
```

---

## Logs Esperados (Error 404)

```
[AUTH] session ok - user: 550e8400-e29b-41d4-a716-446655440000
[WS] fetching active workspace
[WS] error {code: "NO_WORKSPACE", message: "User has no workspaces"}
```

---

## Checklist Final

- [ ] Test 1: Login → Refresh (< 5s)
- [ ] Test 2: URL directa (rehidratación)
- [ ] Test 3: Timeout test (5s exacto)
- [ ] Test 4: Sesión expirada (401)
- [ ] Test 5: Sin workspace (404)
- [ ] Test 6: React Strict Mode (1 request)
- [ ] Test 7: Retry manual (funciona)
- [ ] Test 8: Navigation (no re-fetch)
- [ ] Test 9: Logout → Login
- [ ] Test 10: Fast connection (< 2s)

---

## Troubleshooting

### "Preparando workspace..." infinito
1. Revisar Network tab → timeout después de 5s?
2. Ver console → logs de error?
3. Verificar sesión: ¿hay access_token válido?

### "Multiple GoTrueClient instances detected"
1. Revisar imports de Supabase
2. Verificar singleton en `lib/supabase/browser.ts`
3. No importar `createClient` directamente

### "signal is aborted without reason"
1. Verificar cleanup en useEffect
2. Check AbortController en WorkspaceProvider
3. Asegurar `.abort()` se llama en cleanup

### Spinner desaparece pero app no carga
1. Verificar workspace en context → `useWorkspace()`
2. Check si `status === 'ready'`
3. Ver console → errores en render?

---

## Verificación de Éxito

✅ **PUEDES HACER F5 EN /operator Y NO QUEDA INFINITO**

Es todo lo que necesitas.
