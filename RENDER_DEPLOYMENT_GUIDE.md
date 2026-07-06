# 🚀 Deploy Talkers to Render.com

**Repository**: https://github.com/Ayupanchal18/Talkers.git

This guide will help you deploy your video calling platform to Render in minutes.

---

## 📋 What You'll Deploy

- ✅ **PostgreSQL Database** - Free tier (90 days, renewable)
- ✅ **Node.js Backend** - Express + Socket.IO for WebRTC signaling
- ✅ **React Frontend** - Static site with global CDN
- ✅ **HTTPS/SSL** - Automatic secure connections
- ✅ **Auto-deploy** - Updates on every git push

---

## 🎯 Deployment Steps

### Step 1: Push Latest Changes to GitHub

```bash
# Make sure you're in the vidss directory
cd d:\portfolio_Projects\vidss

# Add all new deployment files
git add .

# Commit the changes
git commit -m "Add Render deployment configuration"

# Push to GitHub
git push origin main
```

**Files added for Render deployment:**
- ✅ `render.yaml` - Blueprint configuration (automates everything!)
- ✅ `DEPLOYMENT.md` - Detailed deployment instructions
- ✅ `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- ✅ `QUICK_START.md` - 5-minute quick start guide
- ✅ `README.md` - Complete project documentation
- ✅ `server/Dockerfile` - Docker configuration (optional)
- ✅ `.dockerignore` - Docker ignore file
- ✅ `.gitignore` - Updated git ignore

### Step 2: Sign Up on Render

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Render to access your GitHub repositories

### Step 3: Deploy Using Blueprint (Automated)

1. **Go to Dashboard**: https://dashboard.render.com

2. **Click "New +"** → Select **"Blueprint"**

3. **Connect Repository**:
   - If prompted, authorize Render to access your GitHub account
   - Select: `Ayupanchal18/Talkers`

4. **Review Configuration**:
   - Render will detect `render.yaml`
   - You'll see 3 services to be created:
     - 🗄️ `vidss-db` (PostgreSQL Database)
     - 🖥️ `vidss-backend` (Web Service)
     - 🌐 `vidss-frontend` (Static Site)

5. **Click "Apply"**

6. **Wait for Deployment** (~5-10 minutes):
   - Database creates first (~2 min)
   - Backend builds and deploys (~5 min)
   - Frontend builds and deploys (~3 min)

### Step 4: Get Your Live URLs

After deployment completes, you'll have:

- **🌐 Frontend**: `https://vidss-frontend.onrender.com`
- **🖥️ Backend**: `https://vidss-backend.onrender.com`
- **✅ Health Check**: `https://vidss-backend.onrender.com/health`

---

## 🧪 Testing Your Deployed App

### 1. Test Backend Health
```bash
curl https://vidss-backend.onrender.com/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### 2. Test Frontend
- Open: `https://vidss-frontend.onrender.com`
- Should load the app homepage

### 3. Test Full Flow
1. **Register** a new account
2. **Login** with your credentials
3. **Create Meeting** - Get a room code
4. **Open in another browser/tab** (or share with a friend)
5. **Join Meeting** - Enter the room code
6. **Enable camera/mic** when prompted
7. **Test video/audio** - You should see/hear each other!
8. **Test chat** - Send messages in the meeting

---

## 🔧 Configuration Details

### Environment Variables (Auto-Configured by Blueprint)

**Backend (`vidss-backend`):**
| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Set by Blueprint |
| `PORT` | `10000` | Render default |
| `DATABASE_URL` | `postgresql://...` | Auto from `vidss-db` |
| `JWT_SECRET` | *auto-generated* | Render generates |
| `JWT_REFRESH_SECRET` | *auto-generated* | Render generates |
| `FRONTEND_URL` | `https://vidss-frontend.onrender.com` | Auto from `vidss-frontend` |

**Frontend (`vidss-frontend`):**
| Variable | Value | Source |
|----------|-------|--------|
| `VITE_API_URL` | `https://vidss-backend.onrender.com` | Auto from `vidss-backend` |

**All these are configured automatically by the Blueprint!** 🎉

---

## ⚠️ Important: Free Tier Limitations

### Backend Auto-Sleep
- ⏰ **Spins down after 15 minutes** of no traffic
- 🕐 **First request after sleep**: ~30-45 seconds to wake up
- ⚡ **Subsequent requests**: Instant

**User Experience:**
- First visitor of the day will see a loading screen for ~30 seconds
- After that, works instantly for all users
- Sleeps again after 15 min of no activity

**Solutions:**
- ✅ **Free**: Use [UptimeRobot](https://uptimerobot.com) to ping every 14 minutes (keeps it awake)
- 💰 **Paid** ($7/month): Upgrade to Starter plan (never sleeps)

### Database Expiry
- 📅 **Free tier**: Expires after 90 days
- 🔄 **Renewal**: Manual renewal before expiry (keeps all data)
- 💰 **Paid** ($7/month): Permanent database

### Build Minutes
- 📊 **Free tier**: 500 build minutes/month
- 🔨 **Each deploy**: ~3-5 minutes (backend + frontend)
- 💡 **Tip**: ~100 deploys per month available

---

## 🚨 Troubleshooting

### Issue: Backend Build Fails

**Check Logs:**
1. Go to: https://dashboard.render.com
2. Click on `vidss-backend`
3. Go to **"Logs"** tab
4. Look for error messages

**Common Causes:**
- ❌ Prisma migration failed
- ❌ TypeScript compilation error
- ❌ Missing dependencies

**Fix:**
```bash
# Test build locally first
cd server
npm install
npm run build
npx prisma generate
```

### Issue: Frontend Shows Blank Page

**Check Browser Console:**
1. Open frontend URL
2. Press `F12` (Developer Tools)
3. Go to **Console** tab
4. Look for errors

**Common Causes:**
- ❌ `VITE_API_URL` not set correctly
- ❌ CORS error (backend rejects frontend)
- ❌ Build failed

**Fix:**
- Verify `VITE_API_URL` in Render Dashboard → `vidss-frontend` → Environment
- Should be: `https://vidss-backend.onrender.com` (no trailing slash)

### Issue: Can't Connect to Backend

**Error:** "Failed to fetch" or "Network Error"

**Causes:**
- Backend is sleeping (first request after 15 min)
- CORS misconfiguration

**Fix:**
1. Wait 30-45 seconds and try again
2. Check backend logs for CORS errors
3. Verify `FRONTEND_URL` matches your actual frontend URL

### Issue: Socket.IO Connection Fails

**Error in Console:** "WebSocket connection failed"

**Causes:**
- Backend is sleeping
- Token authentication failed
- Firewall blocking WebSockets

**Fix:**
1. Wait for backend to wake up (~30 seconds)
2. Clear browser cookies and re-login
3. Check backend logs: Dashboard → `vidss-backend` → Logs

### Issue: Video/Audio Not Working

**Camera/Mic Access Denied:**
- Browser needs HTTPS (Render provides this ✅)
- User must grant permissions

**No Video Stream:**
- Check browser console for WebRTC errors
- Try Chrome/Edge (best WebRTC support)
- Check if behind corporate firewall (may block WebRTC)

**STUN Server Issues:**
- App uses Google's free STUN servers
- May not work behind very restrictive firewalls
- Consider adding TURN server (see below)

---

## 🎨 Customization

### Custom Domain (Optional)

**Backend Custom Domain:**
1. Go to `vidss-backend` → Settings → Custom Domains
2. Add domain: `api.yourdomain.com`
3. Add CNAME record in your DNS:
   - **Name**: `api`
   - **Value**: `vidss-backend.onrender.com`
4. Update `FRONTEND_URL` in backend env to use custom domain

**Frontend Custom Domain:**
1. Go to `vidss-frontend` → Settings → Custom Domains
2. Add domain: `yourdomain.com`
3. Add CNAME record in your DNS:
   - **Name**: `@` or `www`
   - **Value**: `vidss-frontend.onrender.com`
4. Update `VITE_API_URL` in frontend env to use backend custom domain

### Add TURN Server (Optional)

For better connectivity behind firewalls:

1. Sign up for free TURN service:
   - [Metered.ca](https://www.metered.ca/) - 50GB/month free
   - [Twilio](https://www.twilio.com/stun-turn) - Pay as you go

2. Update `server/src/shared/constants.ts`:
```typescript
export const MEETING_CONFIG = {
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    },
  ],
} as const;
```

3. Redeploy to Render

---

## 📊 Monitoring

### Render Dashboard
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Events**: Deployments, health checks, errors

### External Monitoring (Optional)

**Uptime Monitoring:**
- [UptimeRobot](https://uptimerobot.com) - Free, monitors 50 sites
- [Pingdom](https://www.pingdom.com) - Free tier available

**Setup:**
1. Add your backend health endpoint: `https://vidss-backend.onrender.com/health`
2. Set check interval to 5 minutes
3. Get email/SMS alerts on downtime

**Error Tracking:**
- [Sentry](https://sentry.io) - Free for hobby projects
- [LogRocket](https://logrocket.com) - Session replay

---

## 💰 Cost Breakdown

### Current Setup (Free)
| Service | Plan | Cost |
|---------|------|------|
| Frontend | Static Site | **$0** |
| Backend | Free Web Service | **$0** |
| Database | Free PostgreSQL | **$0** |
| SSL/HTTPS | Included | **$0** |
| **Total** | | **$0/month** ✅ |

### Recommended Production Setup
| Service | Plan | Cost |
|---------|------|------|
| Frontend | Static Site | **$0** |
| Backend | Starter (512MB RAM) | **$7** |
| Database | Starter (256MB RAM) | **$7** |
| SSL/HTTPS | Included | **$0** |
| **Total** | | **$14/month** 💰 |

**Benefits of upgrading:**
- ✅ Backend never sleeps (instant responses)
- ✅ Database never expires
- ✅ Better performance and reliability
- ✅ Priority support

---

## 🎓 Next Steps

### After Successful Deployment

1. **✅ Test Everything**
   - Register/login
   - Create meetings
   - Video/audio calls
   - Chat functionality

2. **📱 Share with Friends**
   - Get feedback
   - Test with real users
   - Monitor for issues

3. **🔍 Monitor Performance**
   - Check Render dashboard daily
   - Set up uptime monitoring
   - Review logs for errors

4. **🚀 Improve**
   - Add features based on feedback
   - Optimize performance
   - Fix bugs

5. **💰 Plan for Growth**
   - Monitor usage metrics
   - Upgrade when traffic grows
   - Consider adding TURN servers

---

## 📚 Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Prisma Deployment**: https://www.prisma.io/docs/orm/prisma-client/deployment
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **WebRTC Guide**: https://webrtc.org/getting-started/overview

---

## 🆘 Need Help?

**Render Support:**
- Dashboard → Help & Support
- Community: https://community.render.com

**Project Issues:**
- GitHub Issues: https://github.com/Ayupanchal18/Talkers/issues
- Create issue with:
  - Error message/logs
  - Steps to reproduce
  - Screenshots

**Quick Questions:**
- Check `DEPLOYMENT.md` for detailed guides
- Check `DEPLOYMENT_CHECKLIST.md` for common issues

---

## 🎉 Congratulations!

Your video calling platform is now live on the internet! 🚀

**Your Live URLs:**
- 🌐 **App**: `https://vidss-frontend.onrender.com`
- 🖥️ **API**: `https://vidss-backend.onrender.com`

Share it with the world! 🌍

---

**Made with ❤️ by [Ayu Panchal](https://github.com/Ayupanchal18)**
