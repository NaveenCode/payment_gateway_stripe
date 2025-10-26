# Quick Start - Deploy Keycloak & Fix Login

## Problem
Your login/signup doesn't work on Vercel because Keycloak is running on `localhost:8080` which isn't accessible from the internet.

## Solution
Deploy Keycloak for free on Render.com

---

## 5-Minute Quick Start

### 1. Deploy Keycloak on Render.com

**📋 Follow:** [KEYCLOAK_RENDER_DEPLOY.md](./KEYCLOAK_RENDER_DEPLOY.md)

**Quick Steps:**
1. Sign up at [render.com](https://render.com) with GitHub
2. Create PostgreSQL database
3. Deploy Keycloak using Docker image: `quay.io/keycloak/keycloak:latest`
4. Get your Keycloak URL (e.g., `https://keycloak-auth.onrender.com`)

### 2. Configure Keycloak

1. Access Admin Console at your Keycloak URL
2. Login: `admin` / `admin123`
3. Create Realm: `nextjs-realm`
4. Create Client: `nextjs-app`
5. Add redirect URI: `https://payment-gateway-stripe-hlv2.vercel.app/*`
6. Copy Client Secret

### 3. Update Vercel Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables

Add these:
```
KEYCLOAK_URL=https://your-keycloak-url.onrender.com
KEYCLOAK_ISSUER=https://your-keycloak-url.onrender.com/realms/nextjs-realm
KEYCLOAK_CLIENT_ID=nextjs-app
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_REALM=nextjs-realm
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
```

### 4. Redeploy Vercel

1. Go to Vercel → Deployments
2. Click "Redeploy" on latest deployment

### 5. Test

1. Visit: `https://payment-gateway-stripe-hlv2.vercel.app/signup`
2. Sign up with email/password
3. Login with Keycloak SSO
4. ✅ Done!

---

## What You'll Get

- ✅ Working signup/login on live site
- ✅ Both Credentials and SSO login work
- ✅ 100% FREE hosting
- ⚠️ First login might take 30s if Keycloak is asleep (normal for free tier)

---

## Files to Read

1. **[KEYCLOAK_RENDER_DEPLOY.md](./KEYCLOAK_RENDER_DEPLOY.md)** - Full deployment guide
2. **[REDIRECT_LOOP_FIX.md](./REDIRECT_LOOP_FIX.md)** - Fix redirect issues
3. **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Vercel configuration

---

## Need Help?

Check the troubleshooting section in [KEYCLOAK_RENDER_DEPLOY.md](./KEYCLOAK_RENDER_DEPLOY.md)
