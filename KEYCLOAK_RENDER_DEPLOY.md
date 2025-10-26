# Deploy Keycloak on Render.com (100% Free)

## Why Render.com?
- ✅ **Completely FREE** (no credit card needed)
- ✅ Easiest setup for practice projects
- ✅ Automatic HTTPS
- ⚠️ Free tier: Spins down after 15 minutes of inactivity (takes ~30 seconds to wake up)

---

## Step-by-Step Deployment

### Step 1: Sign Up for Render.com

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest option)

### Step 2: Create PostgreSQL Database

Keycloak needs a database to store users and settings.

1. From Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `keycloak-db`
   - **Database:** `keycloak`
   - **User:** `keycloak_user` (auto-generated)
   - **Region:** Choose closest to you
   - **Instance Type:** **Free**
3. Click **"Create Database"**
4. Wait 1-2 minutes for database to be ready
5. **Copy the "Internal Database URL"** (we'll need this)
   - Should look like: `postgresql://keycloak_user:password@dpg-xxx/keycloak`

### Step 3: Deploy Keycloak Web Service

1. Click **"New +"** → **"Web Service"**
2. You'll see three tabs: **"Git Provider"**, **"Public Git Repository"**, and **"Existing Image"**
3. Click the **"Existing Image"** tab (should be highlighted in purple)
4. Fill in the form:

#### Source Code Section:
- **Image URL:** Replace the default with:
  ```
  quay.io/keycloak/keycloak:latest
  ```
- **Credential:** Leave as "No credential"

5. Scroll down to the **Name** field:
   - **Name:** `keycloak-auth`
   - The URL will auto-generate (like `keycloak-auth.onrender.com`)

6. Click **"Connect"** or **"Next"** button (on the right side)

7. On the next page:

#### Instance Type:
- Select **"Free"** (512 MB RAM, $0/month)

#### Region:
- Choose the same region as your PostgreSQL database (or closest to you)

#### Environment Variables:
Scroll down and you'll see an **"Environment Variables"** section.
Click **"Add Environment Variable"** button and add these one by one:

```
KC_DB=postgres
KC_DB_URL=<paste-your-internal-database-url-from-step-2>
KC_DB_USERNAME=keycloak_user
KC_DB_PASSWORD=<password-from-database-url>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KC_HEALTH_ENABLED=true
KC_METRICS_ENABLED=true
KC_HOSTNAME_STRICT=false
KC_PROXY=edge
KC_HTTP_ENABLED=true
```

**Important:**
- Replace `KC_DB_URL` with the Internal Database URL from Step 2
- Extract username and password from the database URL
- Change `KEYCLOAK_ADMIN_PASSWORD` to something more secure if you want

#### Start Command:
In **"Docker Command"** field, add:
```
start --optimized
```

4. Click **"Create Web Service"**
5. Wait 3-5 minutes for deployment (watch the logs)
6. Once deployed, you'll get a URL like: `https://keycloak-auth.onrender.com`

---

## Step 4: Configure Keycloak

### Access Keycloak Admin Console

1. Visit your Keycloak URL: `https://keycloak-auth.onrender.com`
2. Click **"Administration Console"**
3. Login with:
   - **Username:** `admin`
   - **Password:** `admin123` (or what you set)

### Create Realm

1. Click the dropdown at top left (says "master")
2. Click **"Create Realm"**
3. **Realm name:** `nextjs-realm`
4. Click **"Create"**

### Create Client

1. In the `nextjs-realm`, go to **"Clients"** (left sidebar)
2. Click **"Create client"**
3. **Client ID:** `nextjs-app`
4. Click **"Next"**
5. Enable:
   - ✅ **Client authentication:** ON
   - ✅ **Authorization:** OFF
   - ✅ **Standard flow:** ON
   - ✅ **Direct access grants:** ON
6. Click **"Next"**
7. Configure URLs:
   - **Root URL:** `https://payment-gateway-stripe-hlv2.vercel.app`
   - **Home URL:** `https://payment-gateway-stripe-hlv2.vercel.app`
   - **Valid redirect URIs:**
     ```
     https://payment-gateway-stripe-hlv2.vercel.app/*
     http://localhost:3000/*
     ```
   - **Valid post logout redirect URIs:** `*`
   - **Web origins:**
     ```
     https://payment-gateway-stripe-hlv2.vercel.app
     http://localhost:3000
     ```
8. Click **"Save"**

### Get Client Secret

1. Go to **"Clients"** → `nextjs-app`
2. Click **"Credentials"** tab
3. **Copy the "Client secret"** (you'll need this!)

---

## Step 5: Update Your Environment Variables

### Update Local .env.local

Update your `.env.local` file:

```env
# Keycloak Configuration (Render.com)
KEYCLOAK_URL="https://keycloak-auth.onrender.com"
KEYCLOAK_REALM="nextjs-realm"
KEYCLOAK_ISSUER="https://keycloak-auth.onrender.com/realms/nextjs-realm"
KEYCLOAK_CLIENT_ID="nextjs-app"
KEYCLOAK_CLIENT_SECRET="<paste-your-client-secret-here>"

# Keycloak Admin (for user creation)
KEYCLOAK_ADMIN_USERNAME="admin"
KEYCLOAK_ADMIN_PASSWORD="admin123"
```

Replace:
- `https://keycloak-auth.onrender.com` with YOUR Render URL
- `<paste-your-client-secret-here>` with the secret you copied

### Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `payment-gateway-stripe-hlv2`
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables for **Production**, **Preview**, and **Development**:

```
KEYCLOAK_URL=https://keycloak-auth.onrender.com
KEYCLOAK_REALM=nextjs-realm
KEYCLOAK_ISSUER=https://keycloak-auth.onrender.com/realms/nextjs-realm
KEYCLOAK_CLIENT_ID=nextjs-app
KEYCLOAK_CLIENT_SECRET=<your-client-secret>
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
```

5. Click **"Save"**
6. Go to **Deployments** tab
7. Click **"Redeploy"** on the latest deployment

---

## Step 6: Test Your Deployment

### Test Locally First

1. Restart your local dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/signup`
3. Try signing up with:
   - Name: Test User
   - Email: test@example.com
   - Password: test123

4. Should see: "User created successfully!"

5. Go to `http://localhost:3000/login`
6. Click **"Sign in with Keycloak SSO"**
7. Should redirect to Keycloak login
8. Login with the credentials you just created

### Test on Vercel

1. Wait for Vercel to finish redeploying (2-3 minutes)
2. Visit: `https://payment-gateway-stripe-hlv2.vercel.app/signup`
3. Sign up with new credentials
4. Try login with both:
   - ✅ Email/Password (Credentials)
   - ✅ Keycloak SSO

---

## Important Notes

### Free Tier Limitations

⚠️ **Render Free Tier:**
- Services **spin down after 15 minutes** of inactivity
- **First request after sleep** takes ~30 seconds to wake up
- Totally normal for free tier!

**Solution:** First login might be slow if Keycloak is asleep. Just wait 30 seconds.

### Keep Keycloak Awake (Optional)

If you want to prevent Keycloak from sleeping:

**Option 1: Use UptimeRobot (Free)**
1. Sign up at [https://uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - **URL:** `https://keycloak-auth.onrender.com/health`
   - **Interval:** Every 5 minutes
3. This pings Keycloak to keep it awake

**Option 2: Upgrade to Render Paid Plan**
- $7/month for always-on service
- Not necessary for practice projects

---

## Troubleshooting

### Issue: "Cannot connect to Keycloak"

**Solution:**
1. Check if Keycloak service is running on Render
2. Visit `https://keycloak-auth.onrender.com` directly
3. Wait 30 seconds if it's waking up from sleep

### Issue: "Invalid redirect URI"

**Solution:**
1. Go to Keycloak Admin Console
2. Clients → `nextjs-app` → Settings
3. Make sure Valid Redirect URIs includes:
   ```
   https://payment-gateway-stripe-hlv2.vercel.app/*
   http://localhost:3000/*
   ```

### Issue: "User not found in MongoDB"

**Solution:**
1. Make sure you sign up first (creates user in both MongoDB and Keycloak)
2. Then try SSO login
3. SSO only works for users who have signed up

### Issue: Render database connection error

**Solution:**
1. Make sure `KC_DB_URL` in environment variables is correct
2. Should be the "Internal Database URL" from PostgreSQL service
3. Username and password must match what's in the URL

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Render PostgreSQL | **FREE** (256 MB) |
| Render Web Service | **FREE** (512 MB RAM) |
| **Total** | **$0.00/month** |

---

## Alternative: Railway.app (If Render Doesn't Work)

If you prefer a service that doesn't sleep:

1. Sign up at [Railway.app](https://railway.app)
2. Get $5 free credit/month
3. Follow similar steps but Railway has easier database setup
4. More details in [KEYCLOAK_FREE_DEPLOYMENT.md](./KEYCLOAK_FREE_DEPLOYMENT.md)

---

## Summary

After completing these steps:
- ✅ Keycloak running at `https://keycloak-auth.onrender.com`
- ✅ Signup creates users in both MongoDB and Keycloak
- ✅ Login works with both Credentials and SSO
- ✅ 100% free for practice projects
- ⚠️ First request might be slow if service is asleep

---

## Need Help?

If you get stuck, check:
1. Render deployment logs for errors
2. Keycloak admin console for configuration
3. Browser console for JavaScript errors
4. Make sure all environment variables are set in Vercel

Good luck with your deployment! 🚀
