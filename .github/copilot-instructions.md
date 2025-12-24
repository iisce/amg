# Space Booking System - AI Coding Agent Instructions

## Project Overview

Next.js 16 coworking space booking platform for AMG Workspace in Lagos, Nigeria. Users can browse spaces, make bookings/subscriptions, and admins manage operations.

## Tech Stack

-   **Frontend**: Next.js 16 (App Router), React 19, TypeScript
-   **Backend**: Next.js Server Actions (in `actions/` folder)
-   **Database**: PostgreSQL via Prisma ORM
-   **Auth**: Custom session-based authentication with cookies
-   **State**: Zustand with persist middleware (client-side)
-   **UI**: Radix UI components with Tailwind CSS v4
-   **Styling**: `shadcn/ui` (New York variant), `class-variance-authority`, `tailwind-merge`
-   **Forms**: React Hook Form + Zod validation
-   **Icons**: Lucide React
-   **Payments**: Paystack integration (prepared)

## Architecture Patterns

### 1. Server Actions Architecture

The backend uses **Next.js Server Actions** instead of API routes. All server-side logic lives in the `actions/` folder:

```
actions/
├── index.ts          # Re-exports all actions
├── auth.ts           # Authentication (login, register, sessions)
├── spaces.ts         # Space & pricing plan CRUD
├── bookings.ts       # Booking management, check-in/out
├── subscriptions.ts  # Membership/subscription handling
├── payments.ts       # Paystack integration, payment flow
├── users.ts          # User profile, admin user management
└── admin.ts          # Dashboard stats, reports, admin operations
```

**Usage pattern in components**:

```typescript
import { getSpaces, createBooking } from '@/actions';

// In a server component
const spaces = await getSpaces();

// In a client component with form
const handleSubmit = async (data: FormData) => {
	const result = await createBooking(data);
	if (result.success) {
		/* ... */
	}
};
```

### 2. Dual User Flow Architecture

The app has **two separate authentication flows** with distinct UIs:

**Client Flow** (booking users):

-   Routes: `/login`, `/register`, `/dashboard/*`, `/booking/*`, `/spaces/*`
-   Auth: `getCurrentUser()` from `actions/auth.ts`
-   State: Zustand store for booking data persistence

**Admin Flow** (staff/management):

-   Routes: `/admin/login`, `/admin/dashboard`, `/admin/spaces/*`, `/admin/bookings/*`
-   Auth: `getCurrentAdmin()` from `actions/auth.ts`
-   Roles: `ADMIN`, `STAFF`, `SUPER_ADMIN`

Never mix admin and client components - they have different layouts and navigation patterns.

### 3. Prisma Schema Design

Database uses **kobo pricing** (prices stored as integers in smallest currency unit):

```prisma
price Int  // 550000 kobo = ₦5,500 in Naira
```

**Always multiply by 100** when storing currency, divide by 100 when displaying.

Key relationships:

-   `Booking` → `User`, `Space`, `PricingPlan`, `Payment?`
-   `Membership` → `User`, `Space`, `PricingPlan`, `Payment[]`
-   Each `Space` has multiple `PricingPlan` options (hourly/daily/monthly)
-   QR codes are unique per booking for check-in validation
-   `ActivityLog` tracks all user/admin actions

### 4. UI Component Patterns

All UI components follow shadcn/ui conventions from [components/ui/](components/ui/):

**Button with variants**:

```typescript
<Button variant="default|destructive|outline|ghost|link" size="default|sm|lg|icon">
```

**Form pattern** (react-hook-form + shadcn):

```typescript
import { useForm } from 'react-hook-form';
import { Form, FormField, FormControl } from '@/components/ui/form';
```

**Import alias**: Always use `@/` for absolute imports (configured in [tsconfig.json](tsconfig.json))

### 5. Space Types & Booking Models

Two distinct booking models in the codebase:

**Subscription Spaces** (long-term):

-   Shared desks, private offices (1-man, 2-man, 4-man)
-   Monthly/weekly/daily plans
-   No time slot selection

**Booking Spaces** (short-term):

-   Board room, training room, photo studio, lounge
-   Hourly/session-based with time slot selection
-   Check-in via QR code

Store pattern distinguishes these via `type` field (see [store/booking-store.ts](store/booking-store.ts)).

## Development Workflows

### Database Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and run migration
npx prisma migrate dev --name <migration_name>

# Seed database (run SQL script manually)
psql $DATABASE_URL < scripts/01-seed-spaces.sql

# Open Prisma Studio
npx prisma studio
```

### Development Server

```bash
pnpm dev      # Start dev server (localhost:3000)
pnpm build    # Production build
pnpm lint     # Run ESLint
```

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components follow New York style variant with Tailwind v4 (see [components.json](components.json)).

## Project-Specific Conventions

### File Naming

-   Pages: `page.tsx` (Next.js App Router convention)
-   Layouts: `layout.tsx`
-   Loading states: `loading.tsx`
-   Components: `kebab-case.tsx` (e.g., `theme-provider.tsx`)
-   Server Actions: `actions/<module>.ts`

### Routing Structure

-   Client routes: `app/<route>/page.tsx`
-   Admin routes: `app/admin/<route>/page.tsx`
-   Dynamic segments: `[id]/page.tsx` (not `[slug]`)

### Type Definitions

Centralized in [lib/types.ts](lib/types.ts):

-   Import Prisma types: `import type { User, Space } from "@prisma/client"`
-   Extended types for relations: `BookingWithRelations`, `SpaceWithPricing`
-   Form data types: `LoginFormData`, `BookingFormData`, etc.
-   Action responses follow `{ success, message, data?, error? }` pattern

### Currency Formatting

Use helper from [lib/utils/format.ts](lib/utils/format.ts):

```typescript
// Display: divide by 100
const displayPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;
```

### State Management

Zustand store at [store/booking-store.ts](store/booking-store.ts):

-   Persists to localStorage via `persist` middleware
-   Stores `subscriptionData` and `bookingData` separately
-   Clear store after payment completion

## Common Gotchas

1. **Server Actions, not API routes**: Use `import { action } from "@/actions"` pattern. No `/api/*` routes.

2. **Pricing plans**: Spaces have multiple pricing options. Always show all plans for subscription spaces.

3. **Date handling**: Use `date-fns` for formatting (already installed), not moment.js.

4. **Authentication**: Custom session-based auth with `getCurrentUser()` and `getCurrentAdmin()`.

5. **Image paths**: Public images referenced from `/` root (e.g., `/shared-coworking-space.jpg`).

6. **Loading states**: Each page has a `loading.tsx` sibling for Suspense boundaries.

7. **Password hashing**: Uses `bcryptjs` with 12 rounds.

## Key Files Reference

-   [prisma/schema.prisma](prisma/schema.prisma) - Database schema with pricing/booking models
-   [lib/db.ts](lib/db.ts) - Prisma client singleton
-   [lib/types.ts](lib/types.ts) - TypeScript types and Prisma re-exports
-   [actions/index.ts](actions/index.ts) - Re-exports all server actions
-   [store/booking-store.ts](store/booking-store.ts) - Zustand booking state
-   [components/ui/](components/ui/) - shadcn/ui component library
-   [.env.example](.env.example) - Environment variables template

## Server Actions Reference

### Authentication (`actions/auth.ts`)

-   `register(data)` - Create new user account
-   `login(email, password)` - Client login
-   `adminLogin(email, password)` - Admin/staff login
-   `logout()` / `adminLogout()` - End session
-   `getCurrentUser()` / `getCurrentAdmin()` - Get authenticated user
-   `requestPasswordReset(email)` - Send reset email
-   `resetPassword(token, password)` - Reset password with token

### Spaces (`actions/spaces.ts`)

-   `getSpaces(options?)` - List spaces with filters
-   `getSpaceById(id)` / `getSpaceBySlug(slug)` - Get single space
-   `getSubscriptionSpaces()` / `getBookingSpaces()` - Filter by type
-   `createSpace(data)` / `updateSpace(id, data)` / `deleteSpace(id)` - CRUD
-   `createPricingPlan(data)` / `updatePricingPlan(id, data)` - Manage plans

### Bookings (`actions/bookings.ts`)

-   `getBookings(options?)` - List bookings
-   `getUserBookings()` - Current user's bookings
-   `createBooking(data)` - Create new booking
-   `checkInBooking(id)` / `checkOutBooking(id)` - Manage check-in
-   `checkInByQRCode(qrCode)` - QR scanner check-in
-   `cancelBooking(id)` - Cancel booking
-   `checkAvailability(spaceId, date, start, end)` - Check slot availability

### Subscriptions (`actions/subscriptions.ts`)

-   `getSubscriptions(options?)` - List memberships
-   `getUserSubscriptions()` - Current user's subscriptions
-   `createSubscription(data)` - Create membership
-   `renewSubscription(id)` - Extend membership
-   `pauseSubscription(id)` / `cancelSubscription(id)` - Manage status
-   `assignDesk(id, deskNumber)` - Admin: assign desk

### Payments (`actions/payments.ts`)

-   `initializePayment(data)` - Start Paystack payment
-   `verifyPayment(reference)` - Verify payment status
-   `recordManualPayment(data)` - Admin: record cash/transfer
-   `refundPayment(id, reason?)` - Process refund
-   `getPaymentStats(options?)` - Revenue statistics

### Users (`actions/users.ts`)

-   `getProfile()` / `updateProfile(data)` - User profile
-   `changePassword(current, new)` - Change password
-   `getUsers(options?)` - Admin: list users
-   `createUser(data)` / `updateUser(id, data)` - Admin: manage users
-   `resetUserPassword(id, password)` - Admin: reset password

### Admin (`actions/admin.ts`)

-   `getDashboardStats()` - Overview statistics
-   `getRevenueReport(options)` - Revenue by period
-   `getSpaceUtilization(options?)` - Space usage stats
-   `getActivityLogs(options?)` - Audit trail
-   `getTodayOverview()` - Today's check-ins and bookings
-   `exportBookingsCSV(options)` - Export data
