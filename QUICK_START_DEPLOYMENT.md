# 🚀 Quick Deployment Guide - Render

Follow these steps to deploy EchoFlow to Render in **5 minutes**:

## Step 1: Set Up MongoDB Atlas (2 min)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create a **free cluster**
3. Create a database user (Settings → Database Access)
4. Allow all IP addresses (Settings → Network Access → 0.0.0.0/0)
5. Click **Connect** → Copy your connection string
   ```
   mongodb+srv://username:password@cluster.mongodb.net/echoflow
   ```
6. **Save this string** ✅

## Step 2: Push Code to GitHub (1 min)

```bash
# If not already done
git init
git add .
git commit -m "Deploy ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/EchoFlow.git
git push -u origin main
```

## Step 3: Deploy to Render (2 min)

### Deploy Backend

1. Go to https://render.com (create account if needed)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Fill in:
   - **Name:** `echoflow-backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python backend/app.py`
   - **Plan:** Free

5. Click **Create Web Service**
6. Go to **Environment** tab and add:

```
FLASK_ENV=production
MONGODB_URI=<paste_your_mongodb_uri>
GOOGLE_API_KEY=<your_google_api_key>
CLERK_SECRET_KEY=<your_clerk_secret_key>
PORT=5000
```

**Copy your backend URL** (e.g., https://echoflow-backend.onrender.com) ✅

### Deploy Frontend

1. In Render, click **New** → **Static Site**
2. Connect your GitHub repository
3. Fill in:
   - **Name:** `echoflow-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** Free

4. Click **Create Static Site**
5. Go to **Environment** tab and add:

```
VITE_API_URL=https://echoflow-backend.onrender.com
```

## Step 4: Verify Deployment ✅

- **Frontend:** https://echoflow-frontend.onrender.com
- **Backend:** https://echoflow-backend.onrender.com/api/health (or any API endpoint)

---

## Getting API Keys

### Google Generative AI Key
1. Go to https://ai.google.dev
2. Create API key
3. Copy and paste in Render environment

### Clerk Keys (if using authentication)
1. Go to https://dashboard.clerk.com
2. Copy Secret Key and Publishable Key
3. Paste in Render environment

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend can't reach backend | Update `VITE_API_URL` in frontend environment |
| MongoDB connection fails | Check URI and IP whitelist (should be 0.0.0.0/0) |
| Build fails | Check logs in Render dashboard |
| CORS errors | Backend CORS is configured for `echoflow-frontend.onrender.com` |

---

## Auto-Deployment Setup

Every time you push to `main`, Render automatically rebuilds and deploys.

```bash
# Make changes and push
git add .
git commit -m "Fix bug"
git push origin main
# Automatically deploying...
```

---

## Next Steps

1. ✅ Deployment complete!
2. Share your app: https://echoflow-frontend.onrender.com
3. Monitor logs: Render Dashboard → Logs
4. Update `.env` locally for development

Need help? Check `DEPLOYMENT.md` for detailed instructions.
