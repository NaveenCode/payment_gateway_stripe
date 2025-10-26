# Vercel Deployment Setup Guide

## Fix for Infinite Redirect Loop

The infinite redirect loop was caused by `NEXTAUTH_URL` being set to `http://localhost:3000` instead of your production URL.

## Required Steps to Deploy on Vercel

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard:
1. Navigate to: **Settings** → **Environment Variables**
2. Add the following variables for **Production**:

```
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://payment-gateway-stripe-hlv2.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
MONGODB_URI=your-mongodb-uri
RESEND_API_KEY=your-resend-api-key
```

**Note:** Copy the actual values from your local `.env.local` file.

**⚠️ Important Notes:**
- **NEXTAUTH_URL** must match your Vercel domain exactly
- If you're using a custom domain, update `NEXTAUTH_URL` to that domain
- You cannot use Keycloak on `localhost:8080` in production (see below)

### 2. Keycloak Configuration Issue

Your current Keycloak configuration points to `localhost:8080`:
```
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_ISSUER=http://localhost:8080/realms/nextjs-realm
```

**This will NOT work on Vercel** because:
- Vercel's servers cannot access your local machine
- You need to deploy Keycloak to a public URL

**Solutions:**
1. **Option A: Disable Keycloak for Production**
   - Comment out the Keycloak provider in `auth.ts`
   - Only use credentials login

2. **Option B: Deploy Keycloak Publicly (Recommended)**
   - See [KEYCLOAK_FREE_DEPLOYMENT.md](./KEYCLOAK_FREE_DEPLOYMENT.md) for detailed guide
   - Recommended: Railway.app ($5 free credit/month)
   - Alternative: Render.com (completely free with sleep)
   - Update environment variables with the public URL
   - Add the Vercel URL to Keycloak's allowed redirect URIs

### 3. After Setting Environment Variables

1. Redeploy your app from Vercel dashboard
2. Or push a new commit to trigger auto-deployment
3. Test the login flow at: `https://payment-gateway-stripe-hlv2.vercel.app/login`

### 4. Verify the Fix

Visit your site and check:
- ✅ No infinite redirects
- ✅ Login page loads correctly
- ✅ Can log in with credentials
- ✅ Session persists after refresh

## Using Different URLs for Development vs Production

Update your [.env.local](/.env.local) for local development:

```env
# For local development
NEXTAUTH_URL=http://localhost:3000
```

And set in Vercel dashboard for production:
```env
# For production (set in Vercel dashboard)
NEXTAUTH_URL=https://payment-gateway-stripe-hlv2.vercel.app
```

## Alternative: Dynamic NEXTAUTH_URL

You can also use environment detection in your code, but it's cleaner to set different values in Vercel dashboard.

## Quick Commands

```bash
# Redeploy from CLI (if you have Vercel CLI installed)
vercel --prod

# Check deployment logs
vercel logs https://payment-gateway-stripe-hlv2.vercel.app
```

## Troubleshooting

If you still see redirect issues:
1. Clear browser cookies and cache
2. Check Vercel deployment logs for errors
3. Verify all environment variables are set correctly
4. Make sure you redeployed after setting variables
