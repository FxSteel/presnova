# ✅ Sistema Completo - Lista de Pruebas

## 🎯 Estado Actual

**Dev Server**: ✅ **ACTIVO** en http://localhost:3000

**Fases Completadas**:
- ✅ **Phase 1**: Email confirmation UI polish (removed header, added email display)
- ✅ **Phase 3**: Comprehensive bug fix (retry logic, timeouts, single-flight tracking)
- ✅ **Phase 4**: Email callback route with polling (188 lines, ready to test)

**Build Status**: ✅ Compiled successfully in 3.3s (zero errors)

---

## 🧪 Pruebas Pendientes

### PRIORITY 1: Email Confirmation Flow (Phase 4)

```
[ ] Test Case 1: New User Signup → Email Confirm → Callback
    1. Navigate to http://localhost:3000/auth/login
    2. Click "Crear una cuenta"
    3. Enter email: test-$(date +%s)@example.com
    4. Enter password: TestPass123!
    5. WAIT FOR: "Preparando tu cuenta..." message
    6. EXPECTED: Auto-redirect to /operator within 5-6 seconds
    7. VERIFY IN CONSOLE:
       - [CALLBACK] ✅ Session found for user: [UUID]
       - [CALLBACK] ✅ Found 1 workspace(s) on attempt [N]
       - [CALLBACK] ✅ Redirecting to operator with workspace: [UUID]
    8. SUCCESS: Workspace visible, songs list displayed

[ ] Test Case 2: Existing User Normal Login (Phase 3)
    1. Login with existing user
    2. EXPECTED: Direct redirect to /operator (no callback)
    3. EXPECTED: Loads in 2-3 seconds
    4. VERIFY IN CONSOLE:
       - [AUTH] ✅ Session restored
       - [BOOTSTRAP] ✅ Profile upserted
       - [BOOTSTRAP] ✅ Workspace created/verified
       - No [CALLBACK] logs should appear
    5. SUCCESS: Workspace loads normally
```

### PRIORITY 2: Error Handling

```
[ ] Test Case 3: Callback Fallback UI (Timeout)
    1. Open DevTools → Network → Slow 3G throttling
    2. Create new user (Test Case 1 with throttling)
    3. EXPECTED: "Aún estamos preparando tu cuenta" after 6 seconds
    4. Click [Reintentar] → Re-polls workspaces
    5. Click [Volver a iniciar sesión] → Redirects to login
    6. SUCCESS: Both buttons work, no crashes

[ ] Test Case 4: React Strict Mode Guard
    1. Filter console for [CALLBACK]
    2. Create new user and check callback flow
    3. EXPECTED: Exactly 1 "Starting workspace polling..." log (not 2)
    4. EXPECTED: 1-12 "Attempt X/12" logs (not doubled)
    5. SUCCESS: No duplicate API calls or logs
```

### PRIORITY 3: Performance & Reliability

```
[ ] Test Case 5: Retry Logic (Bootstrap)
    1. Create new user
    2. Monitor console for [BOOTSTRAP] and [AUTH] logs
    3. EXPECTED: Bootstrap completes in 1-2 seconds
    4. IF FAILURE: Should see "Retrying bootstrap (attempt 2 of 3)"
    5. SUCCESS: Max 3 attempts, exponential backoff visible

[ ] Test Case 6: No Infinite Loading
    1. Rapid signup + email confirm clicks
    2. EXPECTED: No stuck loaders or infinite "Preparando..."
    3. EXPECTED: Eventually redirects to operator or shows error
    4. SUCCESS: App stays responsive, no frozen UI
```

---

## 🎬 Pasos para Ejecutar Pruebas

### Step 1: Open Browser DevTools
```
1. Open http://localhost:3000/auth/login
2. Press F12 to open DevTools
3. Go to Console tab
4. Filter for: [CALLBACK], [AUTH], [BOOTSTRAP]
```

### Step 2: Create Test User (Test Case 1)
```
1. Click "Crear una cuenta"
2. Email: test-$(date +%s)@example.com (get current timestamp)
   Example: test-1704067200@example.com
3. Password: TestPass123!
4. WATCH: Console for [CALLBACK] logs
5. WATCH: UI for "Preparando tu cuenta..." message
6. WAIT: 5-6 seconds for redirect
```

### Step 3: Confirm Email (Manual)
```
1. Go to: https://app.supabase.co/project/pqxkikxeebjszwzsrinl
2. Navigate to: Authentication → Users
3. Find the test user by email
4. Click the user row
5. Click "Verify" next to email address
6. Check app → Should now see callback route
```

### Step 4: Monitor Server Logs
```
Terminal 2:
tail -f ~/.npm/_logs/... (if available)
OR
Just watch the DevTools console for client-side logs
```

---

## 📊 Expected Log Output

### Successful Callback Flow:
```
[CALLBACK] ✅ Session found for user: 550e8400-e29b-41d4-a716-446655440000
[CALLBACK] Starting workspace polling...
[CALLBACK] ⏳ Attempt 1/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 2/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 3/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 4/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 5/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 6/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 7/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 8/12: No workspaces found yet
[CALLBACK] ✅ Found 1 workspace(s) on attempt 8
[CALLBACK] ✅ Redirecting to operator with workspace: 660e8400-e29b-41d4-a716-446655440001
```

### Successful Normal Login:
```
[AUTH] ✅ Session restored
[AUTH] Bootstrap in progress for user: 550e8400-e29b-41d4-a716-446655440000
[BOOTSTRAP] ✅ Profile upserted
[BOOTSTRAP] ✅ Workspace created/verified
[BOOTSTRAP] ✅ Members relationship verified
[AUTH] ✅ Bootstrap completed successfully
[WORKSPACES] Querying workspaces for user: 550e8400-e29b-41d4-a716-446655440000
[WORKSPACES] ✅ Found 1 workspace(s)
```

---

## ⚠️ Known Issues to Watch For

| Issue | Cause | Fix |
|-------|-------|-----|
| Stuck on "Preparando tu cuenta..." | Bootstrap taking >6s | Check Supabase network, increase MAX_ATTEMPTS |
| "Aún estamos preparando..." appears | Workspace not created in time | Verify `/api/bootstrap` endpoint creates workspace |
| No callback route | Session not verified | Check if `getSession()` returns valid session |
| Infinite loading | Strict Mode double-mount | Check `pollingStartedRef` guard is working |
| "Signal is aborted" | Timeout before bootstrap done | Not expected to happen - Phase 3 should prevent this |

---

## 🚀 After Tests Pass

Once all test cases pass:

1. ✅ Commit changes to git
2. ✅ Document any modifications made
3. ✅ Consider production deployment
4. ✅ Monitor real user flows in production
5. ✅ Update documentation with findings

---

## 📁 Useful Files for Reference

- [TESTING_PHASE_4_CALLBACK.md](TESTING_PHASE_4_CALLBACK.md) - Detailed test scenarios
- [TESTING_MANUAL_BUG_FIX.md](TESTING_MANUAL_BUG_FIX.md) - Bug fix testing guide
- [BUG_FIX_SIGNAL_ABORT.md](BUG_FIX_SIGNAL_ABORT.md) - Technical details on fix
- [QUICK_START_BUG_FIX.md](QUICK_START_BUG_FIX.md) - Quick reference

---

## 🔗 Quick Links

- **Dev Server**: http://localhost:3000
- **Supabase Dashboard**: https://app.supabase.co/project/pqxkikxeebjszwzsrinl
- **DevTools Filter**: Use Chrome DevTools Console filter

---

**Status**: 🟢 **READY FOR TESTING**  
**Test Start Time**: Now  
**Next Milestone**: All test cases passing  

