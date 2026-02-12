# Signup Onboarding - Visual Flow Diagrams

## Complete User Signup Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER SIGNUP JOURNEY                              │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: LOGIN PAGE
┌──────────────────────────────┐
│  Nova - Gestor de Canciones  │
│                              │
│  Email: test@example.com     │
│  Contraseña: ••••••••        │
│  Full Name: John Doe         │
│                              │
│  [Registrarse Button]        │
└──────────────────────────────┘
           ↓
STEP 2: AUTH SIGNUP (Client-side)
┌──────────────────────────────────────────┐
│  Supabase Auth signUp()                  │
│  ├─ Create user in auth.users            │
│  ├─ Set email + password                 │
│  └─ Store full_name in user metadata     │
└──────────────────────────────────────────┘
           ↓
STEP 3: WORKSPACE ONBOARDING (Server-side)
┌──────────────────────────────────────────┐
│  POST /api/auth/onboard                  │
│  ├─ Create public.workspaces row         │
│  │  ├─ name: "John Doe's Workspace"      │
│  │  ├─ slug: "test"                      │
│  │  └─ owner_id: <user_id>               │
│  │                                       │
│  └─ Create public.workspace_members row  │
│     ├─ workspace_id: <workspace_id>      │
│     ├─ user_id: <user_id>                │
│     └─ role: "admin"                     │
└──────────────────────────────────────────┘
           ↓
STEP 4: REDIRECT TO OPERATOR
┌──────────────────────────────┐
│  User redirected to /operator │
│  AuthProvider fetches:        │
│  ├─ workspaces (1 found)      │
│  ├─ workspace_members         │
│  └─ Workspace auto-selected   │
└──────────────────────────────┘
           ↓
✓ READY TO USE
├─ User in operator page
├─ Workspace loaded and active
├─ Can create songs
└─ Can create slides
```

---

## Technical Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────┐                     │
│  │  app/auth/login/page.tsx             │                     │
│  │  - Email/Password input              │                     │
│  │  - Signup form state                 │                     │
│  │  - Loading feedback                  │                     │
│  └──────────────────────────────────────┘                     │
│           ↓ (calls)                                            │
│  ┌──────────────────────────────────────┐                     │
│  │  useAuth() → signUp()                │                     │
│  │  - From app/providers.tsx            │                     │
│  └──────────────────────────────────────┘                     │
│           ↓                                                     │
│  ┌──────────────────────────────────────┐                     │
│  │  supabase.auth.signUp()              │                     │
│  │  - Calls Supabase Auth               │                     │
│  │  - Creates auth.users row            │                     │
│  └──────────────────────────────────────┘                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                        ↓ (API call)
┌────────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER (API Route)                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────┐                     │
│  │  app/api/auth/onboard/route.ts       │                     │
│  │  POST /api/auth/onboard              │                     │
│  │                                      │                     │
│  │  • Receives: userId, email, fullName │                     │
│  │  • Creates workspace                 │                     │
│  │  • Creates workspace_members         │                     │
│  │  • Returns: workspace data           │                     │
│  └──────────────────────────────────────┘                     │
│           ↓                                                     │
│  ┌──────────────────────────────────────┐                     │
│  │  Supabase Admin Client               │                     │
│  │  (using Service Role Key)            │                     │
│  │                                      │                     │
│  │  ├─ INSERT workspaces                │                     │
│  │  └─ INSERT workspace_members         │                     │
│  └──────────────────────────────────────┘                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                        ↓ (data)
┌────────────────────────────────────────────────────────────────┐
│                  SUPABASE (Database + Auth)                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  DATABASE SCHEMA:                                              │
│                                                                │
│  ┌─ auth.users ────────────────────┐                          │
│  │ id: uuid                        │                          │
│  │ email: string                   │                          │
│  │ encrypted_password              │                          │
│  │ ...metadata...                  │                          │
│  └─────────────────────────────────┘                          │
│                                                                │
│  ┌─ public.workspaces ──────────────────┐                     │
│  │ id: uuid (PK)                        │ ← INSERTED          │
│  │ name: string                         │                     │
│  │ slug: string                         │                     │
│  │ owner_id: uuid (FK → auth.users) ────┼─→ User             │
│  │ created_at: timestamp                │                     │
│  │ updated_at: timestamp                │                     │
│  └──────────────────────────────────────┘                     │
│                                                                │
│  ┌─ public.workspace_members ────────────┐                    │
│  │ id: uuid (PK)                         │ ← INSERTED         │
│  │ workspace_id: uuid (FK) ──────────────┼─→ Workspace       │
│  │ user_id: uuid (FK) ────────────────────┼─→ Auth User      │
│  │ role: string ('admin')                 │                   │
│  │ created_at: timestamp                  │                   │
│  └───────────────────────────────────────┘                    │
│                                                                │
│  ┌─ public.profiles ─────────────────────┐                    │
│  │ id: uuid (FK → auth.users)            │                    │
│  │ email: string                         │                    │
│  │ full_name: string                     │                    │
│  │ ...                                   │                    │
│  └───────────────────────────────────────┘                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│               SIGNUP PAGE STATE CHANGES                     │
└─────────────────────────────────────────────────────────────┘

INITIAL STATE:
{
  email: '',
  password: '',
  fullName: '',
  isSignUp: false,
  loading: false,
  loadingStep: '',
  error: ''
}

USER CLICKS "REGISTRARSE":
↓
handleSubmit() called
{
  loading: true,
  loadingStep: '',
  error: ''
}

STEP 1: CREATING ACCOUNT
↓
setLoadingStep('Creando cuenta...')
{
  loading: true,
  loadingStep: 'Creando cuenta...',
  error: ''
}
↓
supabase.auth.signUp() completes
{
  loading: true,
  loadingStep: 'Creando cuenta...',
  error: ''
}

STEP 2: SETTING UP WORKSPACE
↓
setLoadingStep('Configurando workspace...')
{
  loading: true,
  loadingStep: 'Configurando workspace...',
  error: ''
}
↓
fetch('/api/auth/onboard') completes
{
  loading: true,
  loadingStep: 'Configurando workspace...',
  error: ''
}

FINAL STATE: SUCCESS
↓
router.push('/operator')
{
  loading: false,
  loadingStep: '',
  error: '',
  redirecting: true → (AuthProvider loads workspace)
}

OR ERROR STATE:
↓
catch(err) → setError(err.message)
{
  loading: false,
  loadingStep: '',
  error: 'Detailed error message'
}
→ User sees error, can retry
```

---

## Database Transaction Flow

```
┌────────────────────────────────────────────────────┐
│     API ROUTE DATABASE OPERATIONS FLOW             │
└────────────────────────────────────────────────────┘

REQUEST RECEIVED:
{
  userId: "user-123",
  email: "john@example.com",
  fullName: "John Doe"
}

STEP 1: VALIDATE INPUT
├─ Check userId exists ✓
├─ Check email exists ✓
└─ Proceed

STEP 2: CREATE WORKSPACE
INSERT INTO public.workspaces (
  name,
  slug,
  owner_id,
  created_at,
  updated_at
) VALUES (
  'John Doe\'s Workspace',
  'john',
  'user-123',
  NOW(),
  NOW()
)
RETURNING id, name, slug, owner_id, created_at, updated_at

RESULT: workspace = { id: "ws-456", ... }

STEP 3: CREATE MEMBERSHIP
INSERT INTO public.workspace_members (
  workspace_id,
  user_id,
  role,
  created_at
) VALUES (
  'ws-456',
  'user-123',
  'admin',
  NOW()
)

RESULT: ✓ Inserted

SUCCESS RESPONSE:
{
  success: true,
  workspace: {
    id: "ws-456",
    name: "John Doe's Workspace",
    slug: "john",
    owner_id: "user-123",
    created_at: "2026-02-09T10:00:00Z",
    updated_at: "2026-02-09T10:00:00Z"
  }
}

ON ERROR (e.g., member insert fails):
ROLLBACK:
DELETE FROM public.workspaces WHERE id = 'ws-456'

ERROR RESPONSE:
{
  error: "Failed to create workspace membership",
  details: "..."
}
```

---

## Security Flow Diagram

```
┌──────────────────────────────────────────────────────┐
│          SECURITY BOUNDARY DIAGRAM                   │
└──────────────────────────────────────────────────────┘

┌─ CLIENT SIDE (Browser) ─────────────────────────────┐
│                                                    │
│  ✓ User input validated                            │
│  ✓ HTTP request to /api/auth/onboard              │
│  ✓ Email/Password sent via HTTPS                  │
│  ✓ No secrets exposed                             │
│                                                    │
│  (ANON KEY only - limited permissions)             │
│                                                    │
└────────────────────────────────────────────────────┘
                    ↓
        ══════════════════════════
        ════ HTTPS TRANSPORT ════
        ══════════════════════════
                    ↓
┌─ SERVER SIDE (Next.js API) ────────────────────────┐
│                                                    │
│  ✓ Service Role Key loaded from ENV               │
│  ✓ Input validated before DB write                │
│  ✓ No user input in SQL (parameterized)           │
│  ✓ Errors don't leak sensitive data               │
│                                                    │
│  (SERVICE_ROLE_KEY - full access, secure)          │
│                                                    │
└────────────────────────────────────────────────────┘
                    ↓
        ══════════════════════════════
        ═══ ENCRYPTED DB TRANSPORT ═══
        ══════════════════════════════
                    ↓
┌─ DATABASE SIDE (Supabase) ─────────────────────────┐
│                                                    │
│  ✓ Service Role bypasses RLS safely               │
│  ✓ Transaction: both inserts or both rollback     │
│  ✓ User data encrypted at rest                    │
│  ✓ Access logs recorded                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Error Recovery Flow

```
┌────────────────────────────────────────────┐
│        ERROR HANDLING FLOW                 │
└────────────────────────────────────────────┘

SIGNUP ERROR (auth fails)
├─ Show error message
├─ Form stays visible
└─ User can retry signup

WORKSPACE CREATION ERROR (API fails)
├─ Show error with details
├─ Database rollback triggered
├─ Form stays visible
└─ User can retry signup

NETWORK ERROR (fetch fails)
├─ Show "Network error" message
├─ User prompted to retry
└─ Can retry signup

MISSING ENV VARIABLE
├─ Log warning to console
├─ API returns 503 error
├─ Show "Service not configured" message
├─ Instructions to set SUPABASE_SERVICE_ROLE_KEY
└─ User can't signup until fixed

PARTIAL STATE PROTECTION
├─ Auth succeeds, workspace fails
│  ├─ Auth rollback: NOT possible (user exists)
│  ├─ But API detects & shows clear error
│  └─ User can retry (will create new workspace)
│
├─ Workspace created, member fails
│  ├─ Workspace rollback: DELETE workspace
│  └─ User informed, can retry

NO ORPHANED USERS (guaranteed)
├─ User created + workspace + member: ✓
├─ User created but no workspace: Shows error, can retry
└─ Result: Either all succeed or user informed
```

---

**Visual Flow Diagrams Created:** 5 diagrams  
**Covers:** User flow, Architecture, State, Database, Security, Error handling

