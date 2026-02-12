# 🚀 Quick Start - Auth Flow

## El Flujo Simple (3 pasos)

### 1️⃣ Usuario se Registra
```typescript
// app/auth/login/page.tsx
await signUp(email, password, fullName)
// ✅ Crea auth.users solamente
// ✅ Muestra "Revisa tu correo para confirmar"
```

### 2️⃣ Usuario Confirma Email
- Supabase le envía link por email
- Usuario hace click en cliente de correo
- Vuelve a la app y da login

### 3️⃣ Usuario Inicia Sesión
```typescript
// app/providers.tsx - signIn()
await supabase.auth.signInWithPassword(email, password)
  ↓
// ✅ Automático: llamar /api/bootstrap con token
const bootstrap = await fetch('/api/bootstrap', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
})
  ↓
// ✅ Endpoint crea:
//    - profiles (id=user.id, role='operator')
//    - workspaces (owner_id=user.id)
//    - workspace_members (role='admin')
  ↓
// ✅ Redirect a /operator con workspace listo
```

---

## 📊 Flujo Gráfico

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW (No Email Auth)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Login Page]                                                │
│      ↓                                                        │
│  User clicks "Sign Up"                                       │
│      ↓                                                        │
│  Fills: email, password, full_name                           │
│      ↓                                                        │
│  await signUp(email, password, fullName)                     │
│      ↓                                                        │
│  [BACKEND] supabase.auth.signUp()                            │
│      ↓                                                        │
│  Create auth.users                                           │
│      ↓                                                        │
│  [FRONTEND] Show "Revisa tu correo" message                  │
│      ↓                                                        │
│  User checks email & clicks confirmation link                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW (After Email Confirm)         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Login Page]                                                │
│      ↓                                                        │
│  User clicks "Iniciar Sesión"                                │
│      ↓                                                        │
│  Fills: email, password                                      │
│      ↓                                                        │
│  await signIn(email, password)                               │
│      ↓                                                        │
│  [BACKEND] supabase.auth.signInWithPassword()                │
│      ↓                                                        │
│  ✅ Get session + access_token                               │
│      ↓                                                        │
│  [FRONTEND] bootstrapInProgressRef = userId                  │
│      ↓                                                        │
│  await fetch('/api/bootstrap', {                             │
│    Authorization: `Bearer ${token}`                          │
│  })                                                          │
│      ↓                                                        │
│  ┌────────────────────────────────────────────────┐          │
│  │ [BACKEND] /api/bootstrap/route.ts              │          │
│  ├────────────────────────────────────────────────┤          │
│  │ 1. Verify token → get user.id                  │          │
│  │ 2. UPSERT profiles                             │          │
│  │    id=user.id, email, full_name, role='op'     │          │
│  │ 3. Check workspace existe:                     │          │
│  │    - Si YES: usa existente                     │          │
│  │    - Si NO: crea nuevo (owner_id=user.id)      │          │
│  │ 4. UPSERT workspace_members                    │          │
│  │    role='admin', workspace_id, user_id         │          │
│  │ 5. Return { workspace_id, success: true }      │          │
│  └────────────────────────────────────────────────┘          │
│      ↓                                                        │
│  ✅ bootstrap.workspace_id obtenido                           │
│      ↓                                                        │
│  bootstrapInProgressRef = null (single-flight done)          │
│      ↓                                                        │
│  Wait 300ms (let useEffect actualizar state)                 │
│      ↓                                                        │
│  [FRONTEND] Trigger onAuthStateChange                        │
│      ↓                                                        │
│  useEffect cargar workspaces desde /api/auth/workspaces      │
│      ↓                                                        │
│  setActiveWorkspace(owned workspace)                         │
│      ↓                                                        │
│  router.push('/operator')                                    │
│      ↓                                                        │
│  ┌────────────────────────────────────────────────┐          │
│  │ [OPERATOR PAGE]                                │          │
│  ├────────────────────────────────────────────────┤          │
│  │ State: activeWorkspace = loaded ✅             │          │
│  │                                                │          │
│  │ Render 3-column layout:                        │          │
│  │ - Songs List                                   │          │
│  │ - Song Details                                 │          │
│  │ - Output Preview                               │          │
│  └────────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Components

### 1. `/api/bootstrap/route.ts` - Server-side bootstrap
```typescript
export async function POST(request: NextRequest) {
  // Recibe: Authorization Bearer token
  // Retorna: { workspace_id, user_id, role: 'admin' }
  // Hace:
  //  - UPSERT profiles
  //  - CREATE/FIND workspaces
  //  - UPSERT workspace_members
}
```

### 2. `app/providers.tsx` - AuthProvider con signIn mejorado
```typescript
const signIn = async (email: string, password: string) => {
  // 1. signInWithPassword (sin timeout)
  // 2. Llamar /api/bootstrap con token
  // 3. single-flight: no correr 2 veces para mismo user
}
```

### 3. `app/auth/login/page.tsx` - Login UI
```typescript
// Estados:
// - signUp: muestra form con full_name
// - confirmationSent: muestra "Revisa tu correo"
// - signIn: muestra form con email + password
// - loading: muestra "Iniciando sesión..."
```

### 4. `app/operator/page.tsx` - Protección de ruta
```typescript
// Estados:
// - !session: redirect /auth/login
// - pageLoading && !activeWorkspace: skeleton
// - !activeWorkspace: error + recargar
// - activeWorkspace: dashboard normal
```

---

## 🧪 Testing Local

### Escenario 1: Signup → Login (Email Confirmation)
```bash
1. npm run dev
2. Open http://localhost:3000/auth/login
3. Click "¿No tienes cuenta? Regístrate"
4. Fill: email, password, full_name
5. Click "Registrarse"
6. See "Revisa tu correo"
7. Open Supabase Dashboard → Auth → Users
8. Copy confirm email link
9. Paste link in browser (confirms email)
10. Go back to http://localhost:3000/auth/login
11. Fill: email, password
12. Click "Iniciar Sesión"
13. Should redirect to /operator con workspace listo
```

### Escenario 2: Verificar Bootstrap Status
```bash
# Necesitas token válido
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3000/api/debug/bootstrap-status

# Retorna:
{
  "user_id": "8b1a...",
  "profile": { "id", "email", "full_name", "role" },
  "memberships": [{ "workspace_id", "role": "admin" }],
  "workspaces": [{ "id", "name", "slug", "owner_id" }]
}
```

### Escenario 3: Verificar Logs
```bash
# En terminal donde corre npm run dev:

[AUTH] Sign in attempt for: user@example.com
[AUTH] Sign in successful, user: 8b1a...
[AUTH] Calling bootstrap endpoint...

# En app/api/bootstrap logs:
[BOOTSTRAP] Starting for user: 8b1a...
[BOOTSTRAP] Profile upserted for user: 8b1a...
[BOOTSTRAP] Workspace already exists: ws-123
[BOOTSTRAP] Member upserted: ws-123 / 8b1a...
[BOOTSTRAP] Complete for user: 8b1a...

[AUTH] Bootstrap success: ws-123
[AUTH] Workspaces loaded: 1
```

---

## ⚡ Troubleshooting

### "No workspace" en /operator
```
1. Abre DevTools → Console → Check logs
2. Si ves "[BOOTSTRAP] Complete" → workspace debería estar
3. Si ves error → check [BOOTSTRAP] logs
4. Intenta: GET /api/debug/bootstrap-status
5. Recargar página (Cmd+Shift+R)
```

### "Sign in timeout"
```
❌ ANTES: Promise.race con 45s timeout
✅ AHORA: Sin timeout - Supabase maneja naturalmente

Si login se demora:
- Check red (DevTools Network)
- Check console logs
- Reintenta después de 5 segundos
```

### "Stack depth limit exceeded"
```
❌ ANTES: ensureWorkspaceForUser() desde cliente
✅ AHORA: /api/bootstrap desde servidor

Si ves este error:
- Logs obsoletos
- Hard refresh (Cmd+Shift+R)
- Clear localStorage
```

---

## 📚 Más Información

- **Documentación completa**: [AUTH_REFACTORING.md](AUTH_REFACTORING.md)
- **Resumen ejecutivo**: [AUTH_REFACTORING_SUMMARY.md](AUTH_REFACTORING_SUMMARY.md)
- **Código bootstrap**: [app/api/bootstrap/route.ts](app/api/bootstrap/route.ts)
- **Código auth provider**: [app/providers.tsx](app/providers.tsx)

---

**Estado**: ✅ Listo para producción
