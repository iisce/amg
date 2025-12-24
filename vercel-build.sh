#!/bin/bash

# Vercel Build Script for Prisma
# This ensures Prisma client is properly generated before build

echo "🔧 Starting Vercel build process..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Build Next.js
echo "🏗️  Building Next.js application..."
pnpm run build

echo "✅ Build completed successfully!"
