# Xfrizon Deployment Guide - Railway

## Prerequisites
- GitHub account (to host repo)
- Railway.app account (free tier available)
- Domain name (you said you have one)
- MySQL database (either Railway MySQL or existing)

## Step 1: Push Code to GitHub

```bash
cd C:\Users\User\Desktop\Xfrizon
git init
git config user.name "Your Name"
git config user.email "your@email.com"
git remote add origin https://github.com/YOUR_USERNAME/xfrizon.git
git add .
git commit -m "Initial commit: Full stack Xfrizon app"
git branch -M main
git push -u origin main
```

## Step 2: Create Railway Projects

### Backend Setup on Railway:

1. Go to **railway.app** → Sign up/login
2. Click **"New Project"** → Select **"Deploy from GitHub"**
3. Connect GitHub and select your **xfrizon** repo
4. Select **Spring Boot** service
5. Add these environment variables:
   ```
   SPRING_DATASOURCE_URL=jdbc:mysql://{RAILWAY_MYSQL_HOST}:3306/xfrizon_ts
   SPRING_DATASOURCE_USERNAME={DB_USER}
   SPRING_DATASOURCE_PASSWORD={DB_PASSWORD}
   STRIPE_API_KEY=sk_test_YOUR_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   JWT_SECRET=your-production-secret-key
   CORS_ALLOWED_ORIGINS=https://yourdomainname.com
   UPLOAD_PATH=/tmp/uploads
   SERVER_PORT=8081
   ```

6. Add **MySQL** plugin:
   - Click **"Add Services"** → **"Add Database"** → **"MySQL"**
   - Railway will auto-populate DB vars

7. Deploy (Railway detects Spring Boot automatically)

### Frontend Setup on Railway:

**Option A: Railway (Recommended for full-stack together)**
1. Create a new Railway project in same workspace
2. Add your **xfrizon-ui** as service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run preview` OR use **Nginx** to serve dist
5. Environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-railway-domain/api/v1
   ```

**Option B: Vercel (Simpler for frontend only)**
1. Go to **vercel.com** → Import project
2. Select xfrizon-ui repo
3. Set **VITE_API_BASE_URL** to your Railway backend URL
4. Deploy

## Step 3: Connect Domain

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Railway:
   - Backend → Settings → Domains → Add custom domain
   - Frontend → Settings → Domains → Add custom domain
3. Update domain DNS records (Railway provides instructions)

## Step 4: Database Migration

### Option 1: Auto-create via Spring Boot
- Set `spring.jpa.hibernate.ddl-auto=create-drop` in `application-prod.properties`
- App will create schema on first startup

### Option 2: Manual Migration
1. Export local MySQL schema:
   ```bash
   mysqldump -u root -p xfrizon_ts --no-data > schema.sql
   ```
2. Connect to Railway MySQL via Railway CLI:
   ```bash
   railway connect mysql
   ```
3. Import schema:
   ```bash
   mysql -h {RAILWAY_HOST} -u root -p xfrizon_ts < schema.sql
   ```

## Step 5: Test Deployment

1. Check backend logs:
   - Railway Dashboard → Backend service → Logs tab
   - Look for "Tomcat started on port 8081"

2. Test endpoints:
   ```bash
   curl https://your-backend-domain/api/v1/health
   ```

3. Test frontend:
   - Navigate to your domain in browser
   - Check Network tab for API calls

## Step 6: Upload Pre-built Artifacts (Faster Deployment)

Instead of letting Railway build, pre-build locally:

```bash
# Backend
cd xfrizon-be
mvn clean package -DskipTests
# Creates target/xfrizon-be-0.0.1-SNAPSHOT.jar

# Frontend
cd xfrizon-ui
npm run build
# Creates dist/ folder
```

Push `target/*.jar` and `xfrizon-ui/dist` to GitHub, Railway picks them up.

## Testing Functions Checklist

- [ ] User registration/login working
- [ ] Event creation and ticket tier setup
- [ ] Ticket purchase flow (Stripe integration)
- [ ] Ticket download PDFs
- [ ] Organizer dashboard payouts
- [ ] Ticket scanner (validate-ticket endpoint)
- [ ] File uploads (flyer, profile photo)
- [ ] Email confirmations sending

## Troubleshooting

**App crashes on startup:**
```bash
# Check logs in Railway Dashboard
# Common: Missing env vars, DB connection failed
```

**API calls getting 404:**
- Verify `VITE_API_BASE_URL` matches backend domain
- Check CORS settings in backend

**Database connection refused:**
- Verify DB_HOST, DB_USER, DB_PASSWORD in Railway
- Ensure MySQL is started in Railway

**Cold start timeout:**
- Railway free tier may take 30s to start
- Upgrade to paid tier for faster boots

## Costs

**Free tier includes:**
- 5GB disk storage
- 160 hours/month per service
- MySQL database
- 100MB bandwidth/month

**Typical production costs:**
- Backend: ~$5-7/month
- Database: ~$5-10/month  
- CDN/Domain: $10-15/year

## Next Steps

1. Deploy backend first, verify API works
2. Deploy frontend, test integration
3. Run through test checklist
4. Monitor logs in Railway Dashboard
5. Set up error tracking (Sentry recommended)
