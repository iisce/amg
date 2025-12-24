# Prisma Vercel Deployment Fix

## Problem

Error on Vercel: `Cannot find module '@prisma/client-runtime-utils'`

## Solution Applied

### 1. Updated `prisma/schema.prisma`

**Removed custom output directory** (causes issues with Vercel's serverless environment):

```prisma
generator client {
  provider = "prisma-client-js"
  // output = "../node_modules/.prisma/client" ❌ REMOVED
}
```

### 2. Updated `package.json`

**Enhanced build script** to ensure Prisma generates before Next.js build:

```json
{
	"scripts": {
		"build": "prisma generate && next build",
		"postinstall": "prisma generate"
	}
}
```

### 3. Created `vercel.json`

**Configured Vercel build settings** for optimal Prisma deployment:

```json
{
	"functions": {
		"app/**/*.tsx": {
			"memory": 3008,
			"maxDuration": 30
		}
	},
	"buildCommand": "prisma generate && pnpm run build"
}
```

### 4. Updated `next.config.mjs`

**Added Prisma as external package** for proper serverless bundling:

```javascript
const nextConfig = {
	// ... other config
	experimental: {
		serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines'],
	},
};
```

## Deployment Steps

### Step 1: Commit Changes

```bash
git add .
git commit -m "fix: Configure Prisma for Vercel deployment"
git push
```

### Step 2: Redeploy on Vercel

1. Go to Vercel Dashboard
2. Your project will auto-deploy from the push
3. OR manually redeploy: **Deployments → ... → Redeploy**

### Step 3: Verify Environment Variables

Ensure these are set in Vercel:

-   `DATABASE_URL` - Production PostgreSQL connection string
-   `AUTH_SECRET`
-   `SMTP_*` variables
-   All other required env vars

## Why This Happens

Prisma 7 has a different module structure compared to earlier versions. When using a custom output directory in serverless environments like Vercel:

1. **Module Resolution Issues**: Custom paths can confuse the serverless bundler
2. **Runtime Dependencies**: The `@prisma/client-runtime-utils` isn't included in the bundle
3. **pnpm Specifics**: pnpm's hoisting behavior differs from npm/yarn

## Alternative Fix (If Above Doesn't Work)

If the error persists, try these additional steps:

### Option A: Use npm instead of pnpm

In Vercel project settings:

-   Override install command: `npm install`
-   Override build command: `npm run build`

### Option B: Add runtime utilities explicitly

In `package.json`:

```json
{
	"dependencies": {
		"@prisma/client": "7.2.0",
		"@prisma/engines": "7.2.0"
	}
}
```

### Option C: Use Prisma 6 (if compatibility issues)

```bash
pnpm add @prisma/client@6 prisma@6
```

## Testing Locally

Before deploying, test the build locally:

```bash
# Clean previous builds
rm -rf .next node_modules/.prisma

# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Build the project
pnpm run build

# Start production server
pnpm start
```

## Common Vercel Errors & Fixes

### Error: `Prisma Client is not configured for this environment`

**Fix**: Ensure `DATABASE_URL` is set in Vercel environment variables

### Error: `PrismaClient is unable to run in this browser environment`

**Fix**: Check that you're not importing Prisma in client components (use server actions instead)

### Error: `prisma.config.ts not found`

**Fix**: Ensure `prisma.config.ts` is committed to git and not in `.gitignore`

### Build Timeout

**Fix**: Increase build timeout in `vercel.json`:

```json
{
	"builds": [
		{
			"src": "package.json",
			"use": "@vercel/next",
			"config": { "maxLambdaSize": "50mb" }
		}
	]
}
```

## Database Connection Pooling

For production, use connection pooling to avoid exhausting database connections:

### Neon (Recommended)

```env
# Use pooled connection string
DATABASE_URL="postgresql://user:pass@host-pooler.us-east-1.aws.neon.tech:5432/db?sslmode=require"
```

### Supabase

```env
# Use connection pooler port (6543)
DATABASE_URL="postgresql://user:pass@db.supabase.co:6543/postgres?pgbouncer=true"
```

## Verification Checklist

After deployment:

-   [ ] Visit your site URL (e.g., `https://your-app.vercel.app`)
-   [ ] Navigate to `/spaces` page (where error occurred)
-   [ ] Check Vercel function logs for any errors
-   [ ] Test authentication (login/register)
-   [ ] Test database queries (booking creation)
-   [ ] Verify email functionality
-   [ ] Check payment flow

## Still Having Issues?

1. **Check Vercel Logs**:

    - Go to Vercel Dashboard → Your Project → Deployments
    - Click on the latest deployment → View Function Logs

2. **Enable Verbose Logging**:

    ```env
    DEBUG=prisma:*
    ```

3. **Contact Vercel Support**:
    - Attach deployment logs
    - Mention you're using Prisma 7 with Next.js 16

---

**Status**: ✅ Configuration applied and ready for deployment
**Last Updated**: December 24, 2025
