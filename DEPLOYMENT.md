# 🚀 Deploy to Render - Quick Guide

**Repository**: https://github.com/Ayupanchal18/Talkers.git

## Step 1: Push to GitHub (2 minutes)

```bash
cd d:\portfolio_Projects\vidss

# Initialize and push
git init
git remote add origin https://github.com/Ayupanchal18/Talkers.git
git add .
git commit -m "Initial commit"
git push -u origin master
```

Or run: `push-to-github.bat`

## Step 2: Deploy to Render (10 minutes)

1. Go to: https://render.com (sign up with GitHub)
2. Click **"New +"** → **"Blueprint"**
3. Select repository: **"Talkers"**
4. Click **"Apply"**
5. Wait ~10 minutes

**Done!** You'll get:
- Frontend: `https://vidss-frontend.onrender.com`
- Backend: `https://vidss-backend.onrender.com`

## Step 3: Test

1. Open frontend URL
2. Register/login
3. Create meeting
4. Join from another browser
5. Test video/audio

---

## 📋 What Gets Deployed

The `render.yaml` file automatically creates:

1. **PostgreSQL Database** (`vidss-db`)
   - Free tier: 90 days, renewable
   - All migrations run automatically

2. **Node.js Backend** (`vidss-backend`)
   - Express + Socket.IO
   - Auto-generated JWT secrets
   - Health check: `/health`

3. **React Frontend** (`vidss-frontend`)
   - Static site on CDN
   - Always on (never sleeps)

## ⚙️ Environment Variables

All configured automatically by Blueprint:

**Backend:**
- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL` (from database)
- `JWT_SECRET` (auto-generated)
- `JWT_REFRESH_SECRET` (auto-generated)
- `FRONTEND_URL` (from frontend service)

**Frontend:**
- `VITE_API_URL` (from backend service)

---

## ⚠️ Free Tier Limits

**Backend**: Sleeps after 15 min → First request takes ~30 sec  
**Database**: Expires in 90 days → Just click "Renew" (keeps data)  
**Frontend**: Always on ✅

**Keep backend awake (optional):**
- Use [UptimeRobot](https://uptimerobot.com) to ping every 14 min

**Upgrade when ready:** $7/month backend + $7/month database = $14/month total

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check logs: Dashboard → `vidss-backend` → Logs
- Verify `DATABASE_URL` is set

**Frontend blank page:**
- Check browser console (F12)
- Verify `VITE_API_URL` points to backend

**Socket.IO fails:**
- Wait 30 sec (backend waking up)
- Clear cookies and re-login

**Video not working:**
- Grant camera/mic permissions
- Try Chrome/Edge browser
- Check HTTPS enabled (Render does this automatically)

---

## 📊 Costs

**Free (Current):** $0/month  
**Production:** $14/month (backend $7 + database $7)

Upgrade when you get regular users.

---

## 🎉 Done!

Your app is now live! Share it:
- Frontend: `https://vidss-frontend.onrender.com`
- Backend: `https://vidss-backend.onrender.com`

Monitor at: https://dashboard.render.com
