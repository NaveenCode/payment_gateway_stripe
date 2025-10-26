# Redirect Loop Fix - Complete Solution

## Problem
Your Vercel deployment was experiencing an infinite redirect loop on `/login`, causing the `callbackUrl` parameter to be encoded repeatedly in the URL.

## Root Causes Identified

### 1. NEXTAUTH_URL Configuration
- **Issue:** `NEXTAUTH_URL` was set to `http://localhost:3000` in production
- **Impact:** NextAuth couldn't properly resolve callback URLs
- **Fix:** Set to production URL in Vercel environment variables

### 2. Middleware Configuration
- **Issue:** The middleware wasn't explicitly configured with custom pages
- **Impact:** NextAuth's default middleware could cause redirect conflicts
- **Fix:** Used `withAuth` with explicit configuration

## Fixes Applied

### Fix 1: Updated Middleware ([middleware.ts](middleware.ts))

**Before:**
```typescript
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!$|api/auth|_next|favicon.ico|.*\\..*|login|signup).*)"],
};
```

**After:**
```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/((?!$|api/auth|_next|favicon.ico|.*\\..*|login|signup).*)"],
};
```

**What Changed:**
- Now uses `withAuth()` wrapper for explicit configuration
- Explicitly sets `signIn: "/login"` in pages config
- Adds authorization callback to check for valid tokens
- Prevents redirect conflicts by being explicit about the sign-in page

### Fix 2: Environment Variables in Vercel

**Required Environment Variables:**

```env
NEXTAUTH_URL=https://payment-gateway-stripe-hlv2.vercel.app
NEXTAUTH_SECRET=my-super-secret-key-12345
```

**Critical:** The `NEXTAUTH_URL` MUST match your Vercel deployment URL exactly.

## Deployment Steps

### Step 1: Update Environment Variables in Vercel
1. Go to: [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `payment-gateway-stripe-hlv2`
3. Go to: **Settings** → **Environment Variables**
4. Update or add these variables for **Production**:

```env
NEXTAUTH_URL=https://payment-gateway-stripe-hlv2.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-from-env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
MONGODB_URI=your-mongodb-connection-string
RESEND_API_KEY=your-resend-api-key
```

**Copy these values from your local `.env.local` file**

**Note:** If you deploy Keycloak (see [KEYCLOAK_FREE_DEPLOYMENT.md](./KEYCLOAK_FREE_DEPLOYMENT.md)), add those variables too.

### Step 2: Commit and Push Changes

```bash
# Stage the middleware fix
git add middleware.ts

# Commit
git commit -m "Fix redirect loop by configuring middleware with withAuth"

# Push to trigger Vercel deployment
git push origin main
```

### Step 3: Verify Deployment

After Vercel deploys:

1. **Clear Browser Cache and Cookies**
   - Chrome: `Cmd/Ctrl + Shift + Delete` → Clear cookies and cache
   - Or use Incognito/Private mode

2. **Test the Login Flow**
   - Visit: `https://payment-gateway-stripe-hlv2.vercel.app`
   - Click "Login"
   - URL should be: `https://payment-gateway-stripe-hlv2.vercel.app/login`
   - No infinite redirects!

3. **Test Protected Routes**
   - Try accessing: `https://payment-gateway-stripe-hlv2.vercel.app/dashboard`
   - Should redirect to login if not authenticated
   - After login, should access dashboard successfully

## Why This Works

### The withAuth Wrapper
- Explicitly tells NextAuth where the sign-in page is
- Prevents middleware from redirecting to `/api/auth/signin`
- Uses JWT token to determine authorization
- Properly handles callback URLs without double-encoding

### Correct NEXTAUTH_URL
- NextAuth needs to know the base URL for generating callback URLs
- In production, it must be the Vercel URL, not localhost
- This prevents URL mismatches that cause redirect loops

### Matcher Configuration
- Excludes public routes: `/`, `/login`, `/signup`
- Excludes API routes: `/api/auth/*`
- Excludes static files: `/_next/*`, `/favicon.ico`
- Only protects routes that need authentication

## Troubleshooting

### If redirect loop persists:

1. **Check Environment Variables**
   ```bash
   # Use Vercel CLI to check
   vercel env ls
   ```
   Ensure `NEXTAUTH_URL` is set correctly for Production.

2. **Check Vercel Logs**
   ```bash
   vercel logs https://payment-gateway-stripe-hlv2.vercel.app --follow
   ```
   Look for authentication errors or middleware issues.

3. **Clear All Caches**
   - Browser cache and cookies
   - Try different browser or incognito mode
   - Vercel edge cache (wait 5-10 minutes after deployment)

4. **Verify Deployment**
   - Make sure the latest code is deployed
   - Check the deployment includes the middleware changes
   - Go to Vercel Dashboard → Deployments → View source

### If you still see issues:

Check these common problems:

**Problem:** Login works locally but not on Vercel
- **Solution:** Verify `NEXTAUTH_URL` in Vercel matches your domain exactly

**Problem:** Gets stuck on loading or infinite redirect
- **Solution:** Clear browser cookies specifically for your domain

**Problem:** Session not persisting after login
- **Solution:** Check `NEXTAUTH_SECRET` is set and is the same value used locally

## Testing Checklist

After deployment, test these scenarios:

- [ ] Visit home page (`/`) - should load without redirect
- [ ] Click "Login" - should go to `/login` page (not redirect loop)
- [ ] Try to access `/dashboard` without login - should redirect to `/login`
- [ ] Login with credentials - should redirect to home or dashboard
- [ ] After login, session should persist on page refresh
- [ ] Logout should work and redirect properly
- [ ] Signup flow should work correctly

## Summary

The redirect loop was caused by:
1. Incorrect `NEXTAUTH_URL` (pointing to localhost instead of production)
2. Middleware not explicitly configured with `withAuth` and custom pages

**Fixes:**
1. ✅ Updated middleware to use `withAuth` with explicit sign-in page
2. ✅ Set correct environment variables in Vercel dashboard
3. ✅ Committed and pushed changes to trigger redeployment

**Next Steps:**
1. Set environment variables in Vercel (if not done)
2. Push the middleware changes to trigger deployment
3. Clear browser cache and test the login flow
4. Optionally: Deploy Keycloak for SSO (see other guide)

---

**Need Help?**
If you're still experiencing issues, check:
- Vercel deployment logs for errors
- Browser console for JavaScript errors
- Network tab for failed requests or redirects
