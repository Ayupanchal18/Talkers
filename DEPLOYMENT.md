# 🚀 Deployment Guide - Render.com

This guide walks you through deploying the vidss video calling platform to Render.com.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Git Repository** - Push your code to GitHub

## 🎯 Deployment Options

### Option 1: Blueprint (Automated - Recommended)

This is the easiest method. Render will automatically create all services from `render.yaml`.

#### Steps:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository containing `render.yaml`
   - Click **"Apply"**

3. **Wait for deployment** (5-10 minutes)
   - Render will create:
     - PostgreSQL database (`vidss-db`)
     - Backend service (`vidss-backend`)
     - Frontend static site (`vidss-frontend`)

4. **Get your URLs**
   - Backend: `https://vidss-backend.onrender.com`
   - Frontend: `https://vidss-frontend.onrender.com`

---

### Option 2: Manual Setup (Step-by-Step)

If you prefer manual control or Blueprint doesn't work:

#### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `vidss-db`
   - **Database**: `vidss`
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Free
3. Click **"Create Database"**
4. **Save the Internal Database URL** (you'll need it for backend)

#### Step 2: Deploy Backend (Node.js)

1. Go to Render Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vidss-backend`
   - **Region**: Oregon (same as database)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**: 
     ```bash
     cd server && npm install && npm run build && npx prisma generate
     ```
   - **Start Command**: 
     ```bash
     cd server && npx prisma migrate deploy && npm start
     ```
   - **Plan**: Free

4. **Add Environment Variables**:
   Click **"Advanced"** → Add these variables:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | *Paste the Internal Database URL from Step 1* |
   | `JWT_SECRET` | *Generate a random 64-char string* |
   | `JWT_REFRESH_SECRET` | *Generate another random 64-char string* |
   | `FRONTEND_URL` | *Leave empty for now, we'll add after frontend is deployed* |

   **Generate secrets online**: [randomkeygen.com](https://randomkeygen.com/)

5. Click **"Create Web Service"**
6. Wait for deployment (~5 minutes)
7. **Save your backend URL**: `https://vidss-backend.onrender.com`

#### Step 3: Deploy Frontend (Static Site)

1. Go to Render Dashboard → **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vidss-frontend`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: 
     ```bash
     cd client && npm install && npm run build
     ```
   - **Publish Directory**: 
     ```
     client/dist
     ```

4. **Add Environment Variable**:
   Click **"Advanced"** → Add:
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://vidss-backend.onrender.com` (your backend URL) |

5. **Add Rewrite Rule** (for React Router):
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: Rewrite

6. Click **"Create Static Site"**
7. Wait for deployment (~3 minutes)
8. **Save your frontend URL**: `https://vidss-frontend.onrender.com`

#### Step 4: Update Backend with Frontend URL

1. Go to your backend service (`vidss-backend`)
2. Click **"Environment"** tab
3. Add/update the `FRONTEND_URL` variable:
   ```
   https://vidss-frontend.onrender.com
   ```
4. Save changes (backend will auto-redeploy)

---

## ✅ Verify Deployment

1. **Test Backend Health**:
   ```
   https://vidss-backend.onrender.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend**:
   - Open: `https://vidss-frontend.onrender.com`
   - Try to register/login
   - Create a meeting
   - Join from another browser/device

3. **Test WebRTC**:
   - Create a meeting room
   - Share the room code
   - Join from another device/browser tab
   - Verify video/audio works

---

## 🔧 Post-Deployment Configuration

### Custom Domains (Optional)

**Backend:**
1. Go to `vidss-backend` → **"Settings"** → **"Custom Domains"**
2. Add your domain: `api.yourdomain.com`
3. Update DNS with provided CNAME record
4. Update `FRONTEND_URL` in backend env vars

**Frontend:**
1. Go to `vidss-frontend` → **"Settings"** → **"Custom Domains"**
2. Add your domain: `yourdomain.com`
3. Update DNS with provided CNAME record
4. Update `VITE_API_URL` in frontend env vars to `https://api.yourdomain.com`

### Database Renewal

The free PostgreSQL database expires after 90 days. To renew:
1. Go to database settings
2. Click **"Renew"** before expiration
3. Data is preserved during renewal

---

## ⚠️ Important Notes

### Free Tier Limitations

1. **Backend Auto-Sleep**: 
   - Spins down after 15 minutes of inactivity
   - Cold start takes ~30 seconds on first request
   - **Solution**: Upgrade to paid plan ($7/month) for always-on

2. **Database Expiry**:
   - Free PostgreSQL expires after 90 days
   - Must manually renew (data preserved)
   - **Solution**: Upgrade to paid database ($7/month) for permanent

3. **Build Minutes**:
   - 500 free build minutes/month
   - Each redeploy uses ~2-3 minutes
   - **Solution**: Upgrade or minimize deployments

### WebRTC Considerations

1. **STUN Servers**: 
   - Currently using free Google STUN servers
   - Works for most networks but may fail behind strict firewalls

2. **TURN Servers** (Optional for production):
   - For users behind restrictive NATs/firewalls
   - Consider services like:
     - [Twilio TURN](https://www.twilio.com/stun-turn)
     - [Metered TURN](https://www.metered.ca/)
   - Update `MEETING_CONFIG.ICE_SERVERS` in `server/src/shared/constants.ts`

### Security Checklist

- ✅ JWT secrets are auto-generated (Blueprint) or manually set
- ✅ CORS configured for production
- ✅ Helmet security headers enabled
- ✅ Database credentials never committed to Git
- ✅ HTTPS enabled by default (Render provides SSL)

---

## 🐛 Troubleshooting

### Backend won't start

**Check logs**: Render Dashboard → `vidss-backend` → **"Logs"**

Common issues:
1. **Database connection failed**: 
   - Verify `DATABASE_URL` is correct
   - Check database is in same region

2. **Prisma migration failed**:
   - Manually run: `npx prisma migrate reset` (in shell)
   - Then redeploy

3. **Port binding error**:
   - Ensure `PORT` env var is `10000`
   - Check `src/index.ts` uses `process.env.PORT`

### Frontend can't reach backend

1. **Check `VITE_API_URL`**:
   - Must be full URL: `https://vidss-backend.onrender.com`
   - NOT `http://` (must be HTTPS)

2. **CORS error**:
   - Verify `FRONTEND_URL` in backend matches frontend URL exactly
   - Check browser console for error details

3. **Network tab shows 404**:
   - API routes must start with `/api/`
   - Example: `https://backend.onrender.com/api/auth/login`

### Socket.IO connection fails

1. **Check browser console** for connection errors

2. **Verify WebSocket support**:
   - Render supports WebSockets on free tier
   - Check if blocked by corporate firewall

3. **Cold start issue**:
   - First request after sleep may timeout
   - Refresh page after 30 seconds

### Video/Audio not working

1. **HTTPS required**: Browser APIs require secure context
   - Render provides HTTPS by default ✅

2. **Permissions denied**:
   - User must grant camera/microphone access
   - Check browser settings

3. **Black screen / No video**:
   - Check browser console errors
   - Try different browser (Chrome recommended)
   - Verify STUN servers are reachable

---

## 📊 Monitoring

### Render Dashboard

Monitor your services:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Events**: Deployments, restarts, errors

### Health Checks

Render automatically pings `/health` endpoint:
- Unhealthy service triggers alert
- Auto-restart on repeated failures

---

## 🚀 Upgrade Paths

When you're ready to scale:

1. **Starter Plan** ($7/month per service):
   - No auto-sleep
   - 0.5 GB RAM
   - Good for low-traffic production

2. **Standard Plan** ($25/month):
   - 2 GB RAM
   - Better performance
   - Supports moderate traffic

3. **Database Pro** ($7/month):
   - No 90-day expiry
   - Automated backups
   - Point-in-time recovery

---

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/orm/prisma-client/deployment)
- [Socket.IO Deployment](https://socket.io/docs/v4/deployment/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

---

## 🎉 You're Live!

Your video calling platform is now deployed and accessible worldwide!

**Next steps**:
- Share your frontend URL with users
- Monitor performance in Render dashboard
- Consider adding analytics (PostHog, Mixpanel)
- Add error tracking (Sentry, LogRocket)

**Need help?** Check Render community or open an issue on GitHub.
