# Email Configuration Guide

This document explains how to set up and configure email functionality for the AMG Workspace booking system.

## Overview

The application uses **nodemailer** to send transactional emails for various user actions. Email functionality includes:

### Email Scenarios (15 total)

#### Authentication Emails

1. **Welcome Email** - Sent when a new user registers
2. **Password Reset Request** - Sent when user requests password reset
3. **Password Reset Success** - Confirmation when password is successfully changed

#### Booking Emails

4. **Booking Confirmation** - Sent after successful payment for a booking
5. **Booking Cancellation** - Sent when user or admin cancels a booking
6. **Check-in Notification** - Sent when user checks in to a booking

#### Subscription Emails

7. **Subscription Confirmation** - Sent after successful payment for membership
8. **Subscription Renewal** - Sent when membership is renewed
9. **Subscription Cancellation** - Sent when membership is cancelled
10. **Subscription Paused** - Sent when membership is temporarily paused

#### Enquiry Emails

11. **Enquiry Received (Admin)** - Notification to admin when enquiry submitted
12. **Enquiry Confirmation (User)** - Confirmation to user that enquiry was received

#### Payment Emails

13. **Payment Failed** - Sent when payment verification fails
14. **Payment Refund** - Sent when payment is refunded

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"              # Your SMTP server
SMTP_PORT="587"                         # Port (587 for TLS, 465 for SSL)
SMTP_USER="your-email@gmail.com"        # SMTP username
SMTP_PASSWORD="your-app-password"       # SMTP password or app password
SMTP_FROM="AMG Workspace <noreply@amgworkspace.com>"  # From address

# Admin Email
ADMIN_EMAIL="admin@amgworkspace.com"    # Receives enquiry notifications
```

### 2. Gmail Setup (Recommended for Development)

If using Gmail:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate an App Password:
    - Visit: https://myaccount.google.com/apppasswords
    - Select "Mail" and "Other (Custom name)"
    - Name it "AMG Workspace"
    - Copy the 16-character password
4. Use the app password in `SMTP_PASSWORD`

Example configuration:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"  # 16-char app password
```

### 3. Alternative SMTP Providers

#### SendGrid

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="SG.your-sendgrid-api-key"
```

#### Mailgun

```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASSWORD="your-mailgun-smtp-password"
```

#### AWS SES

```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-aws-smtp-username"
SMTP_PASSWORD="your-aws-smtp-password"
```

### 4. Vercel Deployment

When deploying to Vercel:

1. Go to your project settings → Environment Variables
2. Add all SMTP variables:
    - `SMTP_HOST`
    - `SMTP_PORT`
    - `SMTP_USER`
    - `SMTP_PASSWORD`
    - `SMTP_FROM`
    - `ADMIN_EMAIL`
3. Redeploy your application

**Important:** Never commit actual SMTP credentials to version control.

## Code Architecture

### Email Service (`/lib/email.ts`)

Core email sending functionality:

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
	to: 'user@example.com',
	subject: 'Welcome!',
	html: '<h1>Welcome to AMG Workspace</h1>',
});
```

Features:

-   Automatic SMTP configuration from environment variables
-   Mock email mode for development (when SMTP not configured)
-   Error handling and logging
-   HTML email support with responsive design

### Email Templates (`/lib/email-templates.ts`)

Pre-built template functions:

```typescript
import {
	createWelcomeEmail,
	createBookingConfirmationEmail,
} from '@/lib/email-templates';

// Welcome email
const welcomeHtml = createWelcomeEmail({
	userName: 'John Doe',
	userEmail: 'john@example.com',
});

// Booking confirmation
const bookingHtml = createBookingConfirmationEmail({
	userName: 'John Doe',
	bookingId: 'BK-1234',
	spaceName: 'Board Room',
	date: '2024-01-15',
	startTime: '09:00',
	endTime: '12:00',
	totalAmount: 5500000, // Amount in kobo
	qrCode: 'QR-CODE-STRING',
});
```

All templates:

-   Responsive HTML design
-   Consistent AMG Workspace branding
-   Professional email formatting
-   Currency formatting (₦ symbol, kobo to naira conversion)

## Email Triggers

### Authentication (`/actions/auth.ts`)

-   `register()` → Welcome email
-   `requestPasswordReset()` → Password reset email
-   `resetPassword()` → Password reset success email

### Bookings (`/actions/bookings.ts`)

-   `cancelBooking()` → Cancellation email
-   `checkInBooking()` → Check-in notification

### Payments (`/actions/payments.ts`)

-   `processSuccessfulPayment()` → Booking or subscription confirmation
-   `verifyPayment()` → Payment failed email (on failure)
-   `refundPayment()` → Refund confirmation

### Subscriptions (`/actions/subscriptions.ts`)

-   `renewSubscription()` → Renewal email
-   `cancelSubscription()` → Cancellation email
-   `pauseSubscription()` → Pause notification

### Enquiries (`/actions/enquiries.ts`)

-   `createEnquiry()` → User confirmation + Admin notification

## Testing

### Development Mode (No SMTP)

When SMTP is not configured, emails are mocked and logged to console:

```bash
[EMAIL] Mock email sent to: user@example.com
Subject: Welcome to AMG Workspace
```

### Test Email Sending

1. Set up SMTP configuration in `.env`
2. Register a new user
3. Check your email inbox
4. Verify email received with proper formatting

### Test All Scenarios

```typescript
// Test registration
await register({
	name: 'Test User',
	email: 'test@example.com',
	password: 'password123',
});

// Test password reset
await requestPasswordReset('test@example.com');

// Test booking confirmation (requires payment)
await createBooking({
	/* booking data */
});
```

## Troubleshooting

### Emails Not Sending

1. **Check environment variables**: Verify all SMTP variables are set
2. **Check SMTP credentials**: Test credentials with your provider
3. **Check firewall**: Ensure outbound SMTP ports (587/465) are open
4. **Check logs**: Look for error messages in server logs

### Gmail "Less Secure Apps"

Gmail no longer supports "less secure apps". You **must** use an app password:

-   Enable 2-Step Verification
-   Generate app password
-   Use app password in `SMTP_PASSWORD`

### SendGrid Issues

-   Verify your sender identity
-   Check API key permissions
-   Review SendGrid activity logs

### Rate Limiting

Most SMTP providers have rate limits:

-   Gmail: ~100 emails/day for free accounts
-   SendGrid: 100 emails/day on free tier
-   Mailgun: 5,000 emails/month on free tier

For production, consider upgrading to paid plans.

## Best Practices

1. **Use dedicated email service** - Don't use personal Gmail for production
2. **Monitor delivery rates** - Track bounce and spam rates
3. **Implement retry logic** - Handle temporary failures
4. **Log email activity** - Track sent emails in database (optional)
5. **Test email rendering** - Use tools like [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/)

## Email Content Guidelines

All emails follow these standards:

-   **Subject lines**: Clear and action-oriented
-   **Preheader text**: Summarizes email content
-   **Branding**: AMG Workspace logo and colors
-   **Call-to-action**: Clear next steps for users
-   **Footer**: Contact info, unsubscribe link (where applicable)
-   **Responsive design**: Works on mobile and desktop
-   **Accessibility**: Proper HTML semantics and alt text

## Future Enhancements

Potential improvements:

-   [ ] Email queue system (Bull/BullMQ)
-   [ ] Email templates in database (editable by admin)
-   [ ] Email analytics (open rates, click rates)
-   [ ] Unsubscribe functionality
-   [ ] Email preferences per user
-   [ ] HTML/text dual formats
-   [ ] Attachment support (invoices, receipts)
-   [ ] Localization (multi-language support)

## Support

For issues with email configuration:

1. Check [nodemailer documentation](https://nodemailer.com/)
2. Review provider-specific guides
3. Contact AMG Workspace support: support@amgworkspace.com

---

**Last Updated:** January 2024
**Version:** 1.0.0
