# Vercel Deployment Checklist

This checklist ensures your AMG Workspace application deploys successfully to Vercel with all required configurations.

## ✅ Pre-Deployment Checklist

### 1. Prisma Configuration

-   [x] `postinstall` script added to `package.json`
    ```json
    "scripts": {
      "postinstall": "prisma generate"
    }
    ```
-   [ ] Database URL configured (use Neon, Supabase, or other Postgres provider)
-   [ ] All migrations applied to production database
-   [ ] Connection pooling enabled (recommended for serverless)

### 2. Environment Variables

Required variables to add in Vercel dashboard:

#### Database

-   [ ] `DATABASE_URL` - PostgreSQL connection string
    ```
    postgresql://user:password@host:5432/dbname?sslmode=require
    ```

#### Application

-   [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel domain
    ```
    https://your-app.vercel.app
    ```
-   [ ] `NODE_ENV` - Set to `production`

#### Authentication

-   [ ] `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
-   [ ] `SESSION_EXPIRY_DAYS` - Default: `30`
-   [ ] `ADMIN_SESSION_EXPIRY_HOURS` - Default: `12`

#### Payments (Paystack)

-   [ ] `PAYSTACK_SECRET_KEY` - Use **live** key (starts with `sk_live_`)
-   [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Use **live** key (starts with `pk_live_`)
-   [ ] `PAYSTACK_WEBHOOK_SECRET` - Get from Paystack dashboard

#### Email (SMTP)

-   [ ] `SMTP_HOST` - SMTP server (e.g., `smtp.gmail.com`)
-   [ ] `SMTP_PORT` - Usually `587`
-   [ ] `SMTP_USER` - SMTP username/email
-   [ ] `SMTP_PASSWORD` - SMTP password or app password
-   [ ] `SMTP_FROM` - From address (e.g., `AMG Workspace <noreply@amgworkspace.com>`)
-   [ ] `ADMIN_EMAIL` - Admin email for notifications

#### Optional Services

-   [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For location maps
-   [ ] `SUPPORT_EMAIL` - Support contact
-   [ ] `SUPPORT_PHONE` - Support phone number

### 3. Code Quality

-   [ ] No TypeScript errors: `pnpm run build`
-   [ ] No ESLint errors: `pnpm run lint`
-   [ ] All environment variables referenced in code exist

### 4. Database Setup

-   [ ] Production database created
-   [ ] All migrations applied:
    ```bash
    npx prisma migrate deploy
    ```
-   [ ] Seed data added (spaces, pricing plans):
    ```bash
    psql $DATABASE_URL < scripts/01-seed-spaces.sql
    ```
-   [ ] Admin user created in database

### 5. Security

-   [ ] No sensitive data in `.env` file committed to Git
-   [ ] `.env.example` updated with all variables
-   [ ] Production secrets are unique (not test keys)
-   [ ] CORS configured correctly (if needed)

## 🚀 Deployment Steps

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository: `space-booking-system`

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify:

-   **Framework Preset:** Next.js
-   **Build Command:** `pnpm run build` or `npm run build`
-   **Output Directory:** `.next` (default)
-   **Install Command:** `pnpm install` or `npm install`

### Step 3: Add Environment Variables

1. Go to Project Settings → Environment Variables
2. Add all variables from checklist above
3. Set environment for each: **Production**, **Preview**, **Development**

Example:

```
Name: DATABASE_URL
Value: postgresql://user:pass@host:5432/dbname?sslmode=require
Environment: Production
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Vercel will run:
    - `pnpm install`
    - `prisma generate` (via postinstall script)
    - `pnpm run build`

### Step 5: Verify Deployment

-   [ ] Application loads at Vercel URL
-   [ ] Database connection works (test login)
-   [ ] Authentication works (register new user)
-   [ ] Email sending works (registration email received)
-   [ ] Payments work (test booking with Paystack)
-   [ ] Admin panel accessible

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain: `www.amgworkspace.com`
3. Configure DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### 2. Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.co/#/settings/webhooks)
2. Add webhook URL: `https://your-app.vercel.app/api/webhooks/paystack`
3. Copy webhook secret
4. Update `PAYSTACK_WEBHOOK_SECRET` in Vercel

### 3. Email Configuration

Test email sending:

1. Register a new user
2. Check email inbox
3. Request password reset
4. Verify emails are received

If emails not working:

-   Check SMTP credentials in Vercel
-   Verify SMTP provider allows sending
-   Check Vercel function logs for errors

### 4. Database Maintenance

Set up regular backups:

-   Neon: Automatic backups included
-   Supabase: Configure backup schedule
-   Self-hosted: Set up `pg_dump` cron job

## 🐛 Troubleshooting

### Build Fails

```
Error: Cannot find module '@prisma/client'
```

**Solution:** Ensure `postinstall` script is in `package.json`

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solutions:**

-   Verify `DATABASE_URL` is correct
-   Check database is accessible from Vercel IPs
-   Ensure `?sslmode=require` is in connection string

### Authentication Not Working

```
Error: AUTH_SECRET not set
```

**Solution:** Add `AUTH_SECRET` to Vercel environment variables

### Emails Not Sending

```
Error: Invalid login
```

**Solutions:**

-   Verify SMTP credentials
-   For Gmail: Use app password, not account password
-   Check SMTP port (587 or 465)
-   Verify SMTP host is correct

### Paystack Webhook Verification Failed

```
Error: Invalid signature
```

**Solution:** Update `PAYSTACK_WEBHOOK_SECRET` in Vercel

### Prisma Client Out of Sync

```
Error: Prisma schema and client are out of sync
```

**Solution:** Redeploy to trigger `prisma generate`

## 📊 Monitoring

### Vercel Analytics

-   Enable Vercel Analytics in project settings
-   Monitor page load times and Core Web Vitals

### Error Tracking

Consider adding error tracking:

-   [Sentry](https://sentry.io/)
-   [LogRocket](https://logrocket.com/)
-   [Datadog](https://www.datadoghq.com/)

### Database Monitoring

-   Monitor database connection pool usage
-   Set up alerts for slow queries
-   Track database size and growth

### Email Monitoring

-   Track email delivery rates
-   Monitor bounce rates
-   Check spam folder placement

## 🔄 Continuous Deployment

After initial deployment:

1. All pushes to `main` branch trigger automatic deployments
2. Pull requests create preview deployments
3. Vercel automatically runs build and tests

### Branch Preview Deployments

-   Each pull request gets a unique preview URL
-   Test changes before merging to production
-   Share preview links with team/clients

## 📝 Environment Variable Management

### Development vs Production

```env
# Development (.env.local)
DATABASE_URL="postgresql://localhost:5432/amg_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PAYSTACK_SECRET_KEY="sk_test_..."

# Production (Vercel)
DATABASE_URL="postgresql://prod-host:5432/amg_prod"
NEXT_PUBLIC_APP_URL="https://amgworkspace.com"
PAYSTACK_SECRET_KEY="sk_live_..."
```

### Updating Environment Variables

1. Go to Vercel Project Settings → Environment Variables
2. Edit variable
3. Redeploy to apply changes

## 🎯 Performance Optimization

### Database

-   Use connection pooling (e.g., PgBouncer)
-   Enable Prisma connection pooling:
    ```
    DATABASE_URL="postgresql://...?pgbouncer=true"
    ```
-   Index frequently queried columns

### Caching

-   Enable Next.js ISR for static pages
-   Cache API responses where appropriate
-   Use Vercel Edge Caching

### Images

-   Use Next.js Image component
-   Optimize images before upload
-   Consider using Cloudinary or Imgix

## 🔐 Security Checklist

-   [ ] HTTPS enabled (automatic with Vercel)
-   [ ] Environment variables not exposed to client
-   [ ] API routes protected with authentication
-   [ ] Admin routes require admin role
-   [ ] SQL injection prevented (Prisma handles this)
-   [ ] XSS protection (React handles this)
-   [ ] CSRF protection implemented
-   [ ] Rate limiting configured
-   [ ] Security headers configured in `next.config.mjs`

## 📚 Additional Resources

-   [Vercel Documentation](https://vercel.com/docs)
-   [Next.js Deployment](https://nextjs.org/docs/deployment)
-   [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
-   [Neon Database](https://neon.tech/docs/introduction)
-   [Paystack Integration](https://paystack.com/docs/guides/)

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review function logs for errors
3. Check database connection
4. Verify environment variables
5. Contact support if needed

---

**Deployment Date:** ********\_********
**Deployed By:** ********\_********
**Production URL:** ********\_********
**Last Updated:** January 2024
