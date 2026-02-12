# 🧪 Testing Phase 4: Email Confirmation Callback

## Status: ✅ **DEV SERVER RUNNING** on http://localhost:3000

The dev server is now live. Use these instructions to test the email confirmation callback flow.

---

## 📋 Test Scenarios

### **Scenario 1: NEW USER → EMAIL CONFIRMATION FLOW** ⭐ (PRIORITY)

**What's being tested**: Phase 4 - Callback route with workspace polling

**Steps**:
1. Open http://localhost:3000/auth/login
2. Click "Crear una cuenta"
3. Enter test email (e.g., `test-phase4-$(date +%s)@example.com`)
4. Enter password (e.g., `TestPass123!`)
5. **Expected**: Redirects to `/auth/callback` with message "Preparando tu cuenta..."
6. **Wait ~5-6 seconds** for workspace to be created
7. **Expected**: Auto-redirects to `/operator` with workspace loaded

**What to verify in Console**:
```
[CALLBACK] ✅ Session found for user: [UUID]
[CALLBACK] Starting workspace polling...
[CALLBACK] ⏳ Attempt 1/12: No workspaces found yet
[CALLBACK] ⏳ Attempt 2/12: No workspaces found yet
...
[CALLBACK] ✅ Found 1 workspace(s) on attempt [N]
[CALLBACK] ✅ Redirecting to operator with workspace: [UUID]
```

**Success Criteria**:
- ✅ No "signal is aborted" errors
- ✅ Callback page appears with polling UI
- ✅ Within ~6 seconds, redirects to /operator
- ✅ Workspace is loaded and active
- ✅ Operator page shows songs list

**Failure Scenarios**:
- ❌ Stuck on "Preparando tu cuenta..." → Bootstrap endpoint not working
- ❌ "Aún estamos preparando tu cuenta" after 6s → Max polling attempts exceeded
- ❌ Redirects to login instead of callback → Session not found (auth issue)

---

### **Scenario 2: EXISTING USER → NORMAL LOGIN** ⭐ (PRIORITY)

**What's being tested**: Phase 3 - Normal login should skip callback

**Steps**:
1. Use an existing test user from previous testing
2. Open http://localhost:3000/auth/login
3. Enter email and password
4. Click "Iniciar sesión"
5. **Expected**: Should NOT go to callback route
6. **Expected**: Redirects directly to `/operator`
7. **Expected**: Workspace loads in 2-3 seconds

**What to verify in Console**:
```
[AUTH] ✅ Session restored
[AUTH] Bootstrap in progress for user: [UUID]
[BOOTSTRAP] ✅ Profile upserted
[BOOTSTRAP] ✅ Workspace created/verified
[BOOTSTRAP] ✅ Members relationship verified
[AUTH] ✅ Bootstrap completed successfully
[WORKSPACES] Querying workspaces for user: [UUID]
[WORKSPACES] ✅ Found [N] workspace(s)
```

**Success Criteria**:
- ✅ No callback route visited
- ✅ Direct redirect to /operator
- ✅ Workspace loads in 2-3 seconds
- ✅ No "No workspace" error

---

### **Scenario 3: CALLBACK TIMEOUT FALLBACK**

**What's being tested**: Fallback UI when workspace isn't ready after 6s

**Steps**:
1. Manually test fallback UI by:
   - Open DevTools → Network tab → Slow 3G throttling
   - Follow Scenario 1 (NEW USER)
   - Wait for "Aún estamos preparando tu cuenta" message
2. **Expected**: Two buttons appear: [Reintentar] [Volver a iniciar sesión]
3. Click [Reintentar] → Should re-poll workspaces
4. Click [Volver a iniciar sesión] → Redirects to `/auth/login`

**Success Criteria**:
- ✅ Fallback UI displays correctly
- ✅ [Reintentar] button works
- ✅ [Volver a iniciar sesión] button works
- ✅ No crashes or console errors

---

### **Scenario 4: REACT STRICT MODE GUARD**

**What's being tested**: Double-execution prevention in Strict Mode

**Steps**:
1. Open DevTools → Elements/Inspector
2. Filter console for `[CALLBACK]`
3. Count log entries in "Preparando tu cuenta..." phase
4. **Expected**: Should see exactly 1 "Starting workspace polling..." log (not 2)
5. **Expected**: Should see 1-12 "Attempt X/12" logs, not doubled

**Success Criteria**:
- ✅ No duplicate logs (Strict Mode guard working)
- ✅ `pollingStartedRef` is functioning correctly
- ✅ No double API calls

---

### **Scenario 5: BOOTSTRAP RETRY LOGIC** (Phase 3)

**What's being tested**: Retry mechanism during bootstrap

**Steps**:
1. Check console logs during Scenario 1 or 2
2. Look for patterns like:
   ```
   [BOOTSTRAP] ✅ Profile upserted
   [BOOTSTRAP] ✅ Workspace created/verified
   [BOOTSTRAP] ✅ Members relationship verified
   ```
3. If bootstrap fails on first attempt, should see:
   ```
   [BOOTSTRAP] ❌ Error...
   [AUTH] Retrying bootstrap (attempt 2 of 3)...
   ```

**Success Criteria**:
- ✅ Bootstrap completes on first or subsequent attempt
- ✅ Retry logic is visible in logs (if applicable)
- ✅ Max 3 attempts, exponential backoff (500/1000/1500ms)

---

## 🔍 Console Filters

Open DevTools Console and use these filters to track progress:

```javascript
// Show only callback logs
console.filter('[CALLBACK]')

// Show only auth logs
console.filter('[AUTH]')

// Show only bootstrap logs
console.filter('[BOOTSTRAP]')

// Show only workspaces logs
console.filter('[WORKSPACES]')

// Or in Firefox DevTools, use the filter bar at the top
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: "Stuck on 'Preparando tu cuenta...'"
**Cause**: Bootstrap endpoint not creating workspace or taking >6s

**Fix**:
1. Check if `/api/bootstrap` is being called (should see logs in server terminal)
2. Verify Supabase tables exist: `profiles`, `workspaces`, `workspace_members`
3. Check RLS policies are not blocking writes
4. Increase MAX_ATTEMPTS from 12 to 15-20 in `/auth/callback/page.tsx`

### Issue: "No workspace after redirect"
**Cause**: Workspace created but `/api/auth/workspaces` not returning it

**Fix**:
1. Check user has `workspace_members` record (RLS policy issue?)
2. Verify SELECT permission on `workspaces` table for authenticated user
3. Check bearer token is being passed correctly

### Issue: "Signal is aborted" during callback
**Cause**: Request timeout or abort signal triggered

**Fix**:
1. Increase `AbortSignal.timeout(10000)` to 15000ms in providers.tsx
2. Check network latency (use throttling to diagnose)
3. Verify bootstrap endpoint responds in <10s

### Issue: "Callback visited for existing user"
**Cause**: Supabase redirect URL always points to /auth/callback

**Fix**:
1. Check Supabase project settings → Authentication → URL Configuration
2. Ensure redirect URL is set to `http://localhost:3000/auth/callback`
3. Consider adding logic to skip callback if user already has workspace

---

## ✅ Success Checklist

- [ ] **Scenario 1**: New user signup → callback → workspace loaded
- [ ] **Scenario 2**: Existing user login → direct to operator (no callback)
- [ ] **Scenario 3**: Callback timeout shows fallback UI
- [ ] **Scenario 4**: No duplicate logs (Strict Mode guard works)
- [ ] **Scenario 5**: Bootstrap retry logic visible and working
- [ ] **Console**: Clean logs with ✅/❌ indicators, no errors
- [ ] **Performance**: Signup flow takes ~5-6s, login flow takes ~2-3s
- [ ] **No crashes**: App handles all scenarios without crashes

---

## 📊 Performance Targets

| Scenario | Expected Time | Max Acceptable |
|----------|---------------|-----------------|
| Existing user login | 2-3s | 5s |
| New user callback | 5-6s | 8s |
| Bootstrap (single) | 1-2s | 3s |
| Callback timeout | 6s | 7s |

---

## 🚀 Next Steps After Testing

1. ✅ If all scenarios pass → Ready for production
2. ⚠️ If some scenarios fail → Debug per troubleshooting guide
3. 🔧 If performance issues → Check database indexes, RLS policies, network

---

**Dev Server**: http://localhost:3000  
**Test Started**: $(date)  
**Phase**: 4 - Email Confirmation Callback Flow

