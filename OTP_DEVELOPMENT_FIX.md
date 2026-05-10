# OTP Development Environment Fix

## Problem

OTP was working on localhost but failing in development (Render.com) with the error:

```
[EMAIL] Failed to send email via Nodemailer: Error: connect ENETUNREACH 2607:f8b0:400e:c00::6d:587
```

## Root Cause

Render.com's **free tier blocks outbound SMTP connections** (port 587). This prevents the backend from connecting to Gmail's SMTP server to send verification emails. However, the OTP was still being generated and stored—it just couldn't be transmitted via email.

## Solution Implemented

Modified `/backend/src/controllers/org.controller.ts` to:

1. **Gracefully handle SMTP failures** - If email sending fails, the system doesn't crash
2. **Return OTP in development/test mode** - When not in production or when email fails, the OTP is returned in the API response with a `debug: true` flag
3. **Frontend awareness** - The response includes:
   - `otp`: The actual verification code (in non-production)
   - `debug: true`: Indicates this is a development/fallback response
   - `expiresIn: "10 minutes"`: How long the OTP is valid

## Changes Made

### Backend API Response

**Before:**

```json
{ "message": "OTP sent successfully to official email" }
```

**After (Development/Fallback):**

```json
{
  "message": "OTP sent successfully to official email",
  "otp": "441736",
  "debug": true,
  "expiresIn": "10 minutes"
}
```

**Production Mode:**

- If `NODE_ENV=production` and email sends successfully, OTP is NOT included in response
- OTP is only sent via email

## How to Use

### For Development (Localhost)

```bash
NODE_ENV=development npm run dev
```

- OTP will be returned in the API response
- OTP will also be logged to console as `[MOCK EMAIL]`

### For Production (Render)

You have two options:

**Option 1: Configure proper SMTP**

- Set up `SMTP_USER` and `SMTP_PASS` with a service that Render can access (e.g., SendGrid, Mailgun, AWS SES)
- OTP will be sent via email only

**Option 2: Use MSG91 API**

- Existing OTPService uses MSG91 which works reliably on Render
- Switch to using that for email OTP verification

## Testing Checklist

- [ ] Run backend in development mode
- [ ] Call `POST /api/org/send-otp` with test email
- [ ] Verify OTP is returned in response
- [ ] Call `POST /api/org/verify-otp` with the returned OTP
- [ ] Confirm verification succeeds
- [ ] Test that OTP expires after 10 minutes
- [ ] Test invalid OTP rejection

## Important Notes

- In development, **never commit actual OTP codes** - they're exposed in logs
- The `GET /api/org/me` 404 is expected if user hasn't created an organization yet
- For production deployments, ensure SMTP configuration is properly set in environment variables

## Next Steps

1. Update frontend to handle the `debug` flag in the response
2. Consider storing OTP in MongoDB instead of memory for persistence across server restarts
3. Implement actual email sending for production with a reliable service
