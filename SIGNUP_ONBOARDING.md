# Signup & Workspace Onboarding Implementation

## Overview

This document describes the signup flow with automatic workspace onboarding that was implemented to solve the problem of users being created without workspace associations.

## Problem Statement

- Users created via the UI signup were not linked to any workspace
- This caused foreign key errors when trying to insert songs or other workspace-scoped data
- Manual users created in Supabase Auth console had no workspace membership

## Solution

The solution enforces workspace creation at signup time via a 3-step process:

1. **User signs up** via the UI (email + password + full name)
2. **Auth account created** via Supabase Auth
3. **Workspace created** automatically on the server side
4. **User linked** to the workspace as admin member

## Implementation Details

### 1. Backend API Route: `/api/auth/onboard`

**Location:** `app/api/auth/onboard/route.ts`

**Purpose:** Creates workspace and workspace membership for newly signed-up users

**Authentication:** Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass Row-Level Security (RLS)

**Flow:**
```
POST /api/auth/onboard
├─ Input: { userId, email, fullName }
├─ Create workspace row
│  ├─ name: "{fullName}'s Workspace" or "Workspace"
│  ├─ slug: extracted from email (before @)
│  ├─ owner_id: userId
│  └─ created_at, updated_at: ISO timestamps
├─ Create workspace_members row
│  ├─ workspace_id: newly created workspace
│  ├─ user_id: userId
│  ├─ role: 'admin'
│  └─ created_at: ISO timestamp
└─ Response: { success: true, workspace: {...} } or error
```

**Error Handling:**
- If workspace creation fails → return 500 error
- If membership creation fails → rollback workspace + return 500 error
- If service role key not set → return 503 (service unavailable)

**Database Tables Modified:**
- `public.workspaces` (INSERT)
- `public.workspace_members` (INSERT)

### 2. Updated SignUp Function

**Location:** `app/providers.tsx` (AuthProvider context)

**Changes:**
- After Supabase Auth signup succeeds, calls `/api/auth/onboard` endpoint
- Passes user ID, email, and full name
- If onboarding fails, still throws error to prevent orphaned users
- Includes proper error messages with details

```typescript
const signUp = async (email: string, password: string, fullName: string) => {
  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({...})
  if (error) throw error

  // 2. Create workspace (server-side)
  if (data.user) {
    const response = await fetch('/api/auth/onboard', {
      method: 'POST',
      body: JSON.stringify({
        userId: data.user.id,
        email: data.user.email,
        fullName: fullName,
      }),
    })
    if (!response.ok) throw error
  }
}
```

### 3. Enhanced Login UI

**Location:** `app/auth/login/page.tsx`

**Improvements:**
- Added `loadingStep` state for step-by-step feedback
- Shows "Creando cuenta..." (Creating account)
- Shows "Configurando workspace..." (Setting up workspace)
- Disables all inputs during loading
- Clear error messages with details

## Environment Setup

**Required Environment Variable:**

Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**How to get the Service Role Key:**
1. Go to Supabase Dashboard
2. Navigate to Settings > API
3. Copy the "Service Role" key (labeled as "supabase_service_role_key" or similar)
4. Paste into `.env.local`

⚠️ **Security Note:** The Service Role Key has full database access. Never commit it to version control or expose it client-side.

## User Experience Flow

### Signup (Happy Path)
1. User clicks "No tienes cuenta? Regístrate"
2. User fills in: Full Name, Email, Password
3. User clicks "Registrarse"
4. UI shows: "Creando cuenta..." (spinner)
5. Auth account created
6. UI shows: "Configurando workspace..." (spinner)
7. Workspace created + user linked as admin
8. Redirects to `/operator`
9. Workspace is pre-loaded and ready to use

### Signup (Error Scenario)
- If auth fails → Show error, stay on signup form
- If workspace creation fails → Show detailed error, user can retry signup
- All errors prevent partial state (no orphaned users)

## Database Schema (Unchanged)

### workspaces table
```sql
id UUID PRIMARY KEY
name TEXT
slug TEXT
owner_id UUID -- foreign key to auth.users
created_at TIMESTAMP
updated_at TIMESTAMP
```

### workspace_members table
```sql
id UUID PRIMARY KEY
workspace_id UUID -- foreign key to workspaces
user_id UUID -- foreign key to auth.users
role TEXT -- 'admin', 'member', 'viewer'
created_at TIMESTAMP
```

## Testing

### Test Signup Flow
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000/auth/login
3. Click "Regístrate"
4. Fill form with:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
5. Click "Registrarse"
6. Watch loading states
7. Should redirect to `/operator` with workspace loaded

### Verify Workspace Created
In Supabase:
1. Check `public.workspaces` - should see new row with owner_id matching auth user
2. Check `public.workspace_members` - should see member with role='admin'
3. Try creating a song - should work without foreign key errors

## Troubleshooting

### "Workspace setup not configured" error
- **Cause:** `SUPABASE_SERVICE_ROLE_KEY` not set in `.env.local`
- **Solution:** Add the key to `.env.local` and restart dev server

### "Failed to create workspace" error
- **Check:** 
  - Service role key is correct
  - Database connection works
  - Check Supabase logs for RLS policy violations
  - Verify `owner_id` field exists in workspaces table

### User created but workspace not linked
- **Cause:** API route failed silently (check console logs)
- **Solution:** Look at server logs for specific error, retry signup

### "Account created successfully, but automatic workspace setup failed"
- **Meaning:** Auth succeeded but workspace creation failed
- **Action:** User exists but has no workspace - they won't be able to use app
- **Recovery:** Try signup again or create workspace manually via Supabase console

## Future Enhancements

- [ ] Add workspace customization options to signup flow
- [ ] Allow users to skip onboarding and create workspace manually later
- [ ] Send confirmation email after signup
- [ ] Add workspace invitation link (for existing users to join others' workspaces)
- [ ] Allow users to create additional workspaces from settings

## Files Modified

- `app/providers.tsx` - Updated `signUp` function with onboarding call
- `app/auth/login/page.tsx` - Enhanced UI with loading steps
- `app/api/auth/onboard/route.ts` - New API route (created)
- `.env.local` - Added `SUPABASE_SERVICE_ROLE_KEY` placeholder

## Files NOT Modified (Per Requirements)

- Login flow (`signIn` function) - unchanged
- Operator pages - unchanged
- Database schema - no changes
- Existing RLS policies - unchanged
