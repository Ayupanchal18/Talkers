# 🚀 Quick Start - Deploy to Render in 5 Minutes

The fastest way to get your video calling app live on the internet!

## Prerequisites
- ✅ GitHub account
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ Code pushed to GitHub

## Step 1: Push to GitHub

```bash
# In your vidss directory
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vidss.git
git push -u origin main
```

## Step 2: Deploy with Blueprint

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → Select **"Blueprint"**
3. **Connect GitHub** (if not already connected)
4. **Select your repository**: `vidss`
5. **Click "Apply"**

That's it! Render will automatically:
- ✅ Create PostgreSQL database
- ✅ Deploy backend (Node.js + Socket.IO)
- ✅ Deploy frontend (React static site)
- ✅ Configure all environment variables
- ✅ Run database migrations
- ✅ Enable HTTPS

## Step 3: Get Your URLs

After ~5-10 minutes, you'll have:

- **Frontend**: `https://vidss-frontend.onrender.com`
- **Backend**: `https://vidss-backend.onrender.com`
- **Health Check**: `https://vidss-backend.onrender.com/health`

## Step 4: Test Your App

1. Open your frontend URL
2. Register a new account
3. Create a meeting
4. Share room code with a friend (or open in another browser)
5. Test video/audio calling!

---

## 🎉 You're Done!

Your app is now live and accessible worldwide!

## What's Included?

✅ **Free Hosting** - Frontend, backend, and database  
✅ **HTTPS/SSL** - Automatic secure connections  
✅ **Auto-Deploy** - Every git push updates your app  
✅ **WebRTC Ready** - Video calling works out of the box  
✅ **Socket.IO** - Real-time signaling configured  
✅ **Database** - PostgreSQL with Prisma ORM  

## Free Tier Limits

⚠️ **Backend sleeps after 15 min** - First request after sleep takes ~30 seconds  
⚠️ **Database expires in 90 days** - Can renew for free (keeps data)  
✅ **Frontend is always on** - No sleep!

## Upgrade Options (Optional)

When you're ready to scale:
- **$7/month** - Backend that never sleeps
- **$7/month** - Permanent database
- **Total: $14/month** for production-ready hosting

---

## 📖 More Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[README.md](./README.md)** - Full project documentation

## 🆘 Troubleshooting

**Backend won't start?**
- Check logs: Dashboard → vidss-backend → Logs tab

**Frontend can't reach backend?**
- Verify environment variables in Dashboard

**Video not working?**
- Ensure HTTPS is enabled (Render does this automatically)
- Grant browser permissions for camera/microphone

## 🎯 What's Next?

1. **Custom Domain** - Add your own domain (e.g., `mycoolvideoapp.com`)
2. **Monitoring** - Set up uptime alerts
3. **Analytics** - Track user behavior
4. **Scaling** - Upgrade when you get popular!

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions!
