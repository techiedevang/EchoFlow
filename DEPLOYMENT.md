# EchoFlow Deployment Guide

## Deployment Architecture

- **Frontend:** React + TypeScript (Vite) → Render Static Site
- **Backend:** Flask (Python) → Render Web Service
- **Database:** MongoDB Atlas
- **CI/CD:** GitHub Actions

---

## Prerequisites

Before deployment, ensure you have:

1. **GitHub Account** - Push code to repository
2. **Render Account** - https://render.com (free tier available)
3. **MongoDB Atlas Account** - https://www.mongodb.com/cloud/atlas
4. **Environment Variables:**
   - Google Generative AI API Key
   - Clerk Authentication Keys (if using Clerk)

---

## Step 1: Set Up MongoDB Atlas

### 1.1 Create a MongoDB Atlas Account
- Go to https://www.mongodb.com/cloud/atlas
- Sign up for a free account
- Create a new project named "EchoFlow"

### 1.2 Create a Cluster
- Click "Create Deployment"
- Select **M0 Free Tier**
- Choose your preferred cloud provider and region (e.g., AWS, US-EAST-1)
- Click "Create Deployment"
- Wait for cluster to deploy (5-10 minutes)

### 1.3 Set Up Database Access
- Go to **Database Access** (left sidebar)
- Click "Add Database User"
- Create a username and password
- Set privileges to **Read and write to any database**
- Click "Add User"

### 1.4 Configure Network Access
- Go to **Network Access** (left sidebar)
- Click "Add IP Address"
- Select "Allow access from anywhere" (0.0.0.0/0) for development
- Click "Confirm"

### 1.5 Get Connection String
- Go to your **Cluster** (left sidebar)
- Click "Connect"
- Choose "Connect your application"
- Copy the connection string:
  ```
  mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- Replace `<username>` and `<password>` with your credentials
- Replace `<database>` with `echoflow`
- **Save this string** - you'll need it for environment variables

---

## Step 2: Prepare Your GitHub Repository

### 2.1 Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/EchoFlow.git
git push -u origin main
```

### 2.2 Create GitHub Secrets
- Go to your repository on GitHub
- Navigate to **Settings** → **Secrets and variables** → **Actions**
- Add the following secrets:

| Secret Name | Value |
|---|---|
| `RENDER_API_KEY` | Your Render API key (from Render Dashboard) |
| `RENDER_SERVICE_ID` | Your Render service ID (generated after initial deployment) |
| `MONGODB_URI` | MongoDB connection string from Step 1.5 |
| `GOOGLE_API_KEY` | Your Google Generative AI API key |
| `CLERK_SECRET_KEY` | Your Clerk secret key (if using Clerk) |

---

## Step 3: Deploy to Render

### 3.1 Create Backend Service

1. Go to https://render.com and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Fill in the details:
   - **Name:** `echoflow-backend`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python backend/app.py`
   - **Plan:** Free
5. Click **Create Web Service**
6. Note your **service ID** from the URL: `https://dashboard.render.com/web/srv-xxxxx`

### 3.2 Add Environment Variables to Backend

In the Render dashboard, go to your backend service:
- Click **Environment**
- Add the following variables:

```
FLASK_ENV=production
MONGODB_URI=<your_connection_string>
GOOGLE_API_KEY=<your_api_key>
CLERK_SECRET_KEY=<your_clerk_key>
PORT=5000
```

### 3.3 Create Frontend Service

1. In Render, click **New** → **Static Site**
2. Connect your GitHub repository
3. Fill in the details:
   - **Name:** `echoflow-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** Free
4. Click **Create Static Site**

### 3.4 Add Environment Variables to Frontend

In the Render dashboard, go to your frontend service:
- Click **Environment**
- Add the following variable:

```
VITE_API_URL=https://echoflow-backend.onrender.com
```

---

## Step 4: Update Your Local Environment

### 4.1 Create `.env` file locally
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=https://echoflow-backend.onrender.com
FLASK_ENV=production
MONGODB_URI=<your_mongodb_uri>
GOOGLE_API_KEY=<your_api_key>
CLERK_SECRET_KEY=<your_clerk_secret_key>
```

---

## Step 5: Test Deployment Locally

### 5.1 Test Frontend Build
```bash
npm run build
npm run preview
```

### 5.2 Test Backend
```bash
cd backend
python app.py
```

Access the app at `http://localhost:5173` (frontend)

---

## Step 6: Deploy

### 6.1 Automatic Deployment with GitHub Actions

Every push to `main` branch will trigger:
1. Linting and build checks
2. Automatic deployment to Render

### 6.2 Manual Deployment

If needed, manually trigger deployment:
1. Go to Render Dashboard
2. Select your service
3. Click **Manual Deploy**

---

## Troubleshooting

### Frontend Won't Load
- Check `VITE_API_URL` in Render environment
- Verify backend service is running
- Check browser console for CORS errors

### Backend Connection Issues
- Verify MongoDB URI in Render environment
- Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
- Check backend logs in Render dashboard

### CORS Errors
- Update `app.py` backend CORS settings:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://echoflow-frontend.onrender.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are in `requirements.txt`
- Verify `package.json` has correct scripts

---

## Monitoring & Maintenance

### View Logs
- **Render Dashboard** → Select Service → **Logs** tab

### Update Dependencies
```bash
npm update
pip install --upgrade -r backend/requirements.txt
```

### Monitor Database Usage
- MongoDB Atlas Dashboard → **Metrics** tab

---

## Deployment Status

Your services will be available at:
- **Frontend:** https://echoflow-frontend.onrender.com
- **Backend:** https://echoflow-backend.onrender.com

---

## Quick Reference

| Task | Command |
|---|---|
| Local dev (frontend) | `npm run dev` |
| Local dev (backend) | `cd backend && python app.py` |
| Build frontend | `npm run build` |
| Deploy to Render | `git push origin main` |
| View Render logs | Render Dashboard → Logs |
| View MongoDB | MongoDB Atlas → Metrics |

