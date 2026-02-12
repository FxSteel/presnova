# 🧪 TESTING MANUAL: Bug Fix Verification

## Pre-Flight Checks

```bash
# 1. Verificar que compila sin errores
npm run build
# Esperado: ✓ Compiled successfully

# 2. Iniciar dev server
npm run dev
# Esperado: ready - started server on 0.0.0.0:3000

# 3. Abrir DevTools Console (F12 → Console)
# Filtrar por: [AUTH], [LOGIN], [BOOTSTRAP], [WORKSPACES], [OPERATOR]
```

## Test 1: Signup Nuevo Usuario

### Steps
```
1. Abrir http://localhost:3000/auth/login
2. Click "¿No tienes cuenta? Regístrate"
3. Llenar:
   - Nombre Completo: "Test User 001"
   - Email: "test001@example.com"
   - Contraseña: "Test@123456"
4. Click "Registrarse"
```

### Esperado
```
Console:
  [LOGIN] Starting sign up...
  [LOGIN] Sign up successful

UI:
  ✅ Toast: "Cuenta creada. Revisa tu correo para confirmar."
  ✅ Pantalla cambiar a "Email de confirmación enviado"
  ✅ Email mostrado: "test001@example.com"
  ✅ Botón: "Volver a iniciar sesión"
```

### ❌ Si Falla
```
Toast no aparece:
  → Check Sonner import en providers.tsx
  → Check `toast.success()` en signUp return

Pantalla no cambia:
  → Check `setConfirmationSent(true)` en handleSubmit
```

---

## Test 2: Confirmar Email

### Prerequisitos
- Base de datos Supabase con email confirmation habilitado
- Access a Supabase dashboard O mailtrap/similar service

### Steps
```
1. Ir a Supabase Dashboard
2. Auth → Users → Buscar "test001@example.com"
3. Click en usuario
4. Marcar "Email confirmed" ✅
   O confirmar via enlace en email

5. Volver a navegador
```

### Esperado
```
Cambios en BD:
  ✅ profiles table: new row con id=user.id, email, full_name
  ✅ users_metadata: { full_name: "Test User 001" }
  ✅ Email confirmed en auth.users
```

---

## Test 3: Login Después de Email Confirmado

### Steps
```
1. Click "Volver a iniciar sesión"
2. Llenar:
   - Email: "test001@example.com"
   - Contraseña: "Test@123456"
3. Click "Iniciar Sesión"
4. Observar console mientras ocurre
```

### Esperado - Console Logs (En orden)

```
[AUTH] Sign in attempt for: test001@example.com

[AUTH] Sign in successful, user: <UUID>

[AUTH] Calling bootstrap endpoint (attempt 1/3)...

[BOOTSTRAP] Starting for user: <UUID>
[BOOTSTRAP] ✅ Profile upserted for user: <UUID>
[BOOTSTRAP] ✅ Workspace created: <WORKSPACE_ID>
[BOOTSTRAP] ✅ Member upserted: <WORKSPACE_ID> / <UUID>
[BOOTSTRAP] ✅ Complete for user: <UUID>

[AUTH] Workspaces useEffect triggered

[WORKSPACES] Fetching workspaces for user: <UUID>
[WORKSPACES] Found 1 memberships
[WORKSPACES] ✅ Returning 1 workspaces

[AUTH] ✅ Workspaces loaded successfully: 1

[OPERATOR] No session, redirecting to login  ← (Debería NO aparecer)

Usuario redirigido a /operator
```

### Esperado - UI

```
✅ NO "signal is aborted without reason" en console
✅ NO toast de error
✅ Redirect a /operator
✅ Página carga con:
   - Songs list (vacía)
   - "Selecciona una canción para ver detalles"
   - Output preview (vacío)
✅ No aparece "No hay workspace"
```

### ❌ Si Falla

#### "signal is aborted without reason"
```
Causa: Timeout insuficiente
Fix:
  → Check AbortSignal.timeout(10000) en bootstrap fetch
  → Check que no hay setTimeout manual abortando
```

#### "No workspace"
```
Causa: Bootstrap no se ejecutó o workspaces endpoint falló
Debug:
  → Check console por [BOOTSTRAP] logs
  → Si no aparecen: bootstrap fetch falló
  → Check network tab: /api/bootstrap 200 OK?
  → Check Supabase service role key configurado
```

#### Página cuelga
```
Causa: Timeout infinito o loop
Fix:
  → Check maxWait = 3000 en handleSubmit
  → Check que router.push siempre se ejecuta
  → Check que no hay loops en useEffect
```

#### Toast de error pero sin especificar
```
Causa: Error genérico
Debug:
  → Check console error completo
  → Buscar [BOOTSTRAP] ❌ logs
```

---

## Test 4: Login Usuario Existente (Sin Duplicados)

### Prerequisites
- Usuario "test001@example.com" ya existe en BD
- Profile, workspace, members ya creados del Test 3

### Steps
```
1. Click logout (si aún logueado)
2. Login nuevamente con:
   - Email: "test001@example.com"
   - Contraseña: "Test@123456"
3. Observar console
```

### Esperado - Console

```
[BOOTSTRAP] Starting for user: <SAME_UUID>
[BOOTSTRAP] ✅ Profile upserted for user: <SAME_UUID>
[BOOTSTRAP] ✅ Workspace already exists: <SAME_WORKSPACE_ID>
  ← Key line: "already exists"
[BOOTSTRAP] ✅ Member upserted: <SAME_WORKSPACE_ID> / <SAME_UUID>
[BOOTSTRAP] ✅ Complete for user: <SAME_UUID>

[WORKSPACES] ✅ Returning 1 workspaces
  ← Debe retornar 1, no 2
```

### Esperado - DB

```
✅ profiles: Still 1 row for user
✅ workspaces: Still 1 row
✅ workspace_members: Still 1 row for this user+workspace
✅ No duplicados creados
```

### ❌ Si Falla - Duplicados

```
[BOOTSTRAP] ✅ Workspace created: <NEW_WORKSPACE_ID>
  ← BAD: No debería crear nuevo

Causa: Logic error en workspace lookup
Fix:
  → Check: .eq('owner_id', userId).maybeSingle()
  → Asegurarse que busca por owner_id correctamente
```

---

## Test 5: Network Fail - Retry Logic

### Setup
```
1. Abrir Network tab en DevTools
2. Marcar "Throttling" → Very slow 3G (para simular latencia)
```

### Steps
```
1. Click logout
2. Login con credenciales válidas
3. Observar console mientras ocurre
```

### Esperado

```
[AUTH] Calling bootstrap endpoint (attempt 1/3)...
  → Wait ~10s (timeout)
  → Fail

[AUTH] Calling bootstrap endpoint (attempt 2/3)...
  → Wait ~10s (timeout)
  → Fail

[AUTH] Calling bootstrap endpoint (attempt 3/3)...
  → Posiblemente éxito si network se recupera
  → O fail después 3 intentos

Si fail 3 intentos:
[AUTH] Bootstrap failed after retries, workspaces will load from API
  ← Graceful degradation
  ← No error toast (solo login si workspaces fallan también)

[WORKSPACES] Fetching workspaces...
  → Si existe workspace anterior: SUCCESS
  → Si no existe: activeWorkspace = null → fallback UI
```

### Esperado - UI

```
✅ No cuelga indefinidamente
✅ Eventualmente redirige a /operator (después 30+ segundos)
✅ Si hay workspace anterior: carga
✅ Si no hay: fallback UI con botones
```

---

## Test 6: Strict Mode - No Doble Bootstrap

### Prerequisites
- React.StrictMode habilitado en development
- (Generalmente por defecto en Next.js)

### Steps
```
1. Logout
2. Login
3. Observar console durante 5 segundos
```

### Esperado

```
[BOOTSTRAP] Starting for user: <UUID> ← Once
[BOOTSTRAP] ✅ Complete for user: <UUID> ← Once

NO duplicados de:
  "Profile upserted"
  "Workspace created" (si nuevo)
  "Complete for user"
```

### ❌ Si Aparecen Doble

```
Causa: Bootstrap ejecutándose dos veces
Fix:
  → Check bootstrapInProgressRef logic
  → Check bootstrapCompletedRef.add(userId) se ejecuta
  → Verificar que workspaces useEffect no triggerean duplicados
```

---

## Test 7: Signup → Logout → Login (Same User)

### Steps
```
1. Signup nuevo usuario: "test007@example.com"
2. Confirmar email (en Supabase)
3. Login con credenciales
4. Logout (si hay botón)
5. Login nuevamente
```

### Esperado - Console

```
First login (step 3):
[BOOTSTRAP] ✅ Workspace created: <WID1>

Logout (step 4):
[AUTH] Signing out...
bootstrapCompletedRef.current.clear() ← (interno)

Second login (step 5):
[BOOTSTRAP] ✅ Workspace already exists: <WID1>
  ← Same workspace ID, not duplicated
```

---

## Test 8: Error Messages - Sonner Toasts

### Test 8a: Signup - Nombre Vacío
```
1. Click "Regístrate"
2. Nombre: "" (vacío)
3. Email/Password: válidos
4. Click "Registrarse"

Esperado:
✅ Toast rojo: "El nombre completo es requerido"
✅ No redirect
```

### Test 8b: Login - Credenciales Inválidas
```
1. Email: "nonexistent@example.com"
2. Password: "wrong"
3. Click "Iniciar Sesión"

Esperado:
✅ Toast rojo: "Invalid login credentials" (Supabase error)
✅ No redirect
```

### Test 8c: Signup - Email Duplicado
```
1. Email: "test001@example.com" (ya existe)
2. Nombre/Password: nuevos
3. Click "Registrarse"

Esperado:
✅ Toast rojo: "User already registered" (Supabase error)
✅ No redirect
```

---

## Test 9: Fallback UI - No Workspace

### Prerequisitos
- Simular que bootstrap falla completamente
- Opción 1: Supabase service role key inválido
- Opción 2: Network siempre offline

### Steps (Opción 1: Simular Service Role Key Inválido)
```
1. En app/api/bootstrap/route.ts, change:
   const supabaseAdmin = createClient(supabaseUrl, "INVALID_KEY")
2. npm run dev
3. Login user
```

### Esperado

```
[BOOTSTRAP] ❌ Multiple retries fail
[AUTH] Bootstrap failed after retries
[WORKSPACES] ✅ Returning 0 workspaces
  (because bootstrap never ran)

Redirect a /operator:
✅ Fallback UI muestra:
   - Icono warning (rojo)
   - "No se pudo cargar el workspace"
   - [Recargar] button
   - [Volver a Login] button
```

### Esperado - User Can Recover
```
1. Fix el service role key en route.ts
2. Click [Recargar] button
   → Page refreshes
   → Bootstrap retry (ahora con key válida)
   → Workspace carga
   ✅ SUCCESS
```

---

## Test 10: Performance - Timing

### Steps
```
1. Open DevTools → Performance tab
2. Start recording
3. Login con credenciales válidas
4. Wait para redirect a /operator
5. Stop recording
```

### Esperado Timings

```
- signIn(): ~500ms
- /api/bootstrap: ~1000ms
- Wait: 500ms
- Workspaces load: ~500ms
- Total: ~2-3 segundos

Breakdown:
├─ Auth sign in: 500ms
├─ Bootstrap endpoint: 1000ms
├─ Workspaces query: 500ms
└─ Render: 100ms
Total: ~2.1s
```

### ⚠️ Si Tarda > 10 segundos
```
Posibles causas:
- Network slow
- Supabase latency
- Multiple retries en bootstrap

Normal en dev. En prod debería ser < 5s
```

---

## Test Checklist

```
☐ Test 1: Signup nuevo user
☐ Test 2: Email confirmed en DB
☐ Test 3: Login - bootstrap ejecuta, workspaces cargan
☐ Test 4: Login existente - sin duplicados
☐ Test 5: Retry logic con network lento
☐ Test 6: Strict mode - no doble bootstrap
☐ Test 7: Logout + Login same user
☐ Test 8a: Error toast - nombre vacío
☐ Test 8b: Error toast - credenciales inválidas
☐ Test 8c: Error toast - email duplicado
☐ Test 9: Fallback UI - no workspace
☐ Test 10: Performance - timing reasonable

Build Status:
☐ npm run build: ✓ Compiled successfully
☐ npm run dev: ready - started server
☐ No errors in console
☐ No TypeScript errors

Overall Result:
☐ ✅ All tests pass
☐ ✅ No "signal is aborted"
☐ ✅ No "No workspace"
☐ ✅ Toasts working
☐ ✅ Retry logic working
☐ ✅ Ready for production
```

---

## Troubleshooting

### Console Muestra ❌ pero UI parece normal
```
→ Probablemente fallback graceful
→ Check operator/page rendering
→ Check si workspaces vacío o hay valores
```

### Toast no aparece
```
→ Check DevTools: element <section aria-label="Notifications">
→ Si no existe: Toaster component no se renderiza
→ Check app/auth/login/page.tsx imports Toaster
```

### Stuck en loading spinner
```
→ Check setPageLoading(false) se ejecuta
→ Check máximo 3s wait en handleSubmit
→ Si > 10s: probablemente bootstrap timeout + retries
```

### Database inconsistencies
```
→ Check workspace_members tiene row para user
→ Check profiles existe con correct user.id
→ Check workspaces.owner_id = user.id
```

---

**Status**: 🧪 Testing manual listo
**Expected Duration**: 30-45 minutos para todos los tests
**Success Criteria**: Todos los tests pasan sin "signal is aborted" ni "No workspace"
