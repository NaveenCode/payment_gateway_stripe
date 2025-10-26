# Free Keycloak Deployment Guide

## Option 1: Railway.app (Recommended - Easiest)

### Why Railway?
- ✅ $5 free credit per month (enough for practice)
- ✅ One-click Docker deployment
- ✅ Automatic HTTPS
- ✅ Persistent storage
- ✅ No credit card required for trial

### Step-by-Step Deployment

#### 1. Sign Up
1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub (easiest)

#### 2. Create New Project
1. Click **"New Project"**
2. Select **"Deploy PostgreSQL"** first (Keycloak needs a database)
3. Note the PostgreSQL connection details

#### 3. Add Keycloak Service
1. Click **"New Service"** → **"Empty Service"**
2. Go to **Settings** → **Source**
3. Select **"Docker Image"**
4. Enter: `quay.io/keycloak/keycloak:latest`

#### 4. Configure Environment Variables
Click on your Keycloak service → **Variables** → Add these:

```env
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=your-secure-password
KC_HEALTH_ENABLED=true
KC_HTTP_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_PROXY=edge
```

#### 5. Get Your Public URL
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get a URL like: `https://keycloak-production-xxxx.up.railway.app`

#### 6. Configure Keycloak Realm
1. Visit your Keycloak URL
2. Login with admin credentials
3. Create realm: `nextjs-realm`
4. Create client: `nextjs-app`
5. Add Valid Redirect URIs:
   ```
   https://payment-gateway-stripe-hlv2.vercel.app/*
   http://localhost:3000/*
   ```

#### 7. Update Your .env.local

```env
# Keycloak Configuration (Railway)
KEYCLOAK_URL="https://keycloak-production-xxxx.up.railway.app"
KEYCLOAK_REALM="nextjs-realm"
KEYCLOAK_ISSUER="https://keycloak-production-xxxx.up.railway.app/realms/nextjs-realm"
KEYCLOAK_CLIENT_ID="nextjs-app"
KEYCLOAK_CLIENT_SECRET="your-client-secret-from-keycloak"

# Keycloak Admin (for user creation)
KEYCLOAK_ADMIN_USERNAME="admin"
KEYCLOAK_ADMIN_PASSWORD="your-secure-password"
```

#### 8. Set in Vercel Dashboard
Add the same environment variables to your Vercel project:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add all the Keycloak variables above

---

## Option 2: Render.com (Free with Sleep)

### Pros & Cons
- ✅ Completely free (no credit needed)
- ⚠️ Spins down after 15 min of inactivity
- ⚠️ Takes ~30s to wake up

### Quick Deploy
1. Go to [https://render.com](https://render.com)
2. New → Web Service
3. Deploy from Docker: `quay.io/keycloak/keycloak:latest`
4. Add environment variables (same as Railway)
5. Get your URL: `https://your-app.onrender.com`

**Note:** Free tier sleeps after inactivity, so first login may be slow.

---

## Option 3: Fly.io (Good Performance)

### Setup
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create app
flyctl launch --image quay.io/keycloak/keycloak:latest

# Set secrets
flyctl secrets set KEYCLOAK_ADMIN=admin
flyctl secrets set KEYCLOAK_ADMIN_PASSWORD=your-password
flyctl secrets set KC_PROXY=edge

# Deploy
flyctl deploy
```

Your URL: `https://your-app.fly.dev`

---

## Option 4: Oracle Cloud Always Free (Best for Long-term)

### Why Oracle Cloud?
- ✅ **Forever free** (not trial)
- ✅ 2 VMs with 1GB RAM each
- ✅ No automatic billing
- ⚠️ More complex setup

### Setup Steps
1. Sign up at [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
2. Create a VM instance (Ubuntu)
3. Install Docker on the VM
4. Run Keycloak container:
   ```bash
   docker run -d \
     --name keycloak \
     -p 8080:8080 \
     -e KEYCLOAK_ADMIN=admin \
     -e KEYCLOAK_ADMIN_PASSWORD=admin \
     quay.io/keycloak/keycloak:latest start-dev
   ```
5. Configure firewall to allow port 8080
6. Use Oracle's public IP or set up a domain

---

## Recommended for Your Use Case

Since this is a **practice project**, I recommend:

### 🥇 **Railway.app** - Best for Quick Practice
- Easy setup (5 minutes)
- Reliable uptime
- $5 credit covers basic usage
- Perfect for portfolio projects

### 🥈 **Render.com** - If You Want Completely Free
- Setup time: 10 minutes
- Sleep after inactivity (acceptable for demos)
- Good for learning and testing

---

## After Deployment Checklist

Once Keycloak is deployed:

1. ✅ Visit your Keycloak admin console
2. ✅ Create realm: `nextjs-realm`
3. ✅ Create client: `nextjs-app`
4. ✅ Configure client:
   - Client authentication: ON
   - Valid redirect URIs: `https://payment-gateway-stripe-hlv2.vercel.app/*`
   - Web origins: `https://payment-gateway-stripe-hlv2.vercel.app`
5. ✅ Get client secret from Credentials tab
6. ✅ Update environment variables in Vercel
7. ✅ Redeploy your Vercel app
8. ✅ Test SSO login

---

## Cost Comparison

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Railway** | $5/month credit | Quick setup, reliable |
| **Render** | Unlimited (with sleep) | Zero cost, can tolerate delays |
| **Fly.io** | 3 free VMs | Good performance |
| **Oracle** | Forever free 2 VMs | Long-term projects |

---

## Need Help?

If you want me to help you set this up:
1. Choose a platform (I recommend Railway)
2. Let me know once you've created an account
3. I can help configure the environment variables and Keycloak settings

Would you like me to help you deploy on Railway? It's the fastest option for your use case!
