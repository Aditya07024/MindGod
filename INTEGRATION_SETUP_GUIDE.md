# Mindsyncpro: Complete Integration Setup Guide

## What We've Built

### ✅ Completed Features

#### 1. **Backend API Infrastructure**

- [x] Payment Service with Razorpay integration
- [x] Payment Controller with order initiation, verification, webhook handling
- [x] Payment Routes (`/api/payment/*`)
- [x] LiveKit Service for video conferencing
- [x] Enhanced Therapist Controller with search/filter/availability
- [x] Video Token Generation for LiveKit sessions
- [x] All models already in place (User, Booking, Therapist, Subscription, etc.)

#### 2. **Frontend - New (mind-bloom-ai-42) with TanStack**

- [x] API Client (`src/lib/api.ts`) - Complete fetch wrapper with Clerk auth
- [x] Therapist Marketplace Page (`/therapists`)
  - Search by name/specialty
  - Filters: specialization, language, price range (₹500-₹5000)
  - Therapist cards with intro videos, ratings, availability
  - Search results pagination

- [x] Booking Flow (`/booking/$therapistId`)
  - Step 1: Date & time slot selection
  - Step 2: Booking confirmation
  - Step 3: Razorpay payment integration
  - Step 4: Success confirmation with SMS

- [x] Razorpay Checkout Component (`RazorpayCheckout.tsx`)
  - Secure payment flow
  - Order initiation & verification
  - Error handling

- [x] Video Conferencing Room (`/session/$bookingId`)
  - LiveKit integration
  - Full-screen WebRTC with auto-hiding UI
  - Session timer with 5-min warning toast
  - Camera/mic toggles
  - Text chat side panel
  - Post-session rating flow

- [x] Subscription Page (`/subscription`)
  - 3 tier display: Free, Mann Shanti (₹199/mo), Apna Therapist (₹499/mo)
  - Feature comparison table
  - FAQs

- [x] Message Counter Component
  - Free tier: 3 messages/day counter
  - Upgrade prompt
  - Crisis mode with helpline overlay (AASRA, iCall, Vandrevala)

---

## Implementation Steps

### Phase 1: Backend Setup

#### 1. Install Dependencies

```bash
cd backend
npm install razorpay livekit-server-sdk
```

#### 2. Configure Environment Variables

Add to `.env`:

```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

#### 3. Database Models Status

All models already exist:

- ✅ User (with therapist profile)
- ✅ TherapistBooking (with payment field)
- ✅ Subscription (tier tracking)
- ✅ Mood, Conversation, JournalEntry, Organization

#### 4. API Routes Status

```
✅ POST   /api/payment/initiate          - Create Razorpay order
✅ POST   /api/payment/verify            - Verify & confirm booking
✅ GET    /api/payment/:bookingId        - Payment status
✅ POST   /api/payment/:bookingId/refund - Refund booking
✅ POST   /api/payment/webhook           - Razorpay webhook

✅ GET    /api/therapists               - List with filters
✅ GET    /api/therapists/:id           - Therapist details
✅ GET    /api/therapists/:id/availability - Available slots

✅ GET    /api/bookings                 - User's bookings
✅ POST   /api/bookings                 - Create booking
✅ DELETE /api/bookings/:bookingId/cancel - Cancel booking
✅ GET    /api/bookings/:bookingId/video-token - LiveKit token
```

#### 5. Test Backend Endpoints

```bash
# Start backend server
npm run dev

# Test health
curl http://localhost:8080/api/health

# Test therapist listing (no auth needed)
curl http://localhost:8080/api/therapists?specialization=Depression&minFee=500&maxFee=2000
```

---

### Phase 2: Frontend Setup

#### 1. Install Dependencies

```bash
cd mind-bloom-ai-42
npm install @livekit/components-react livekit-client
```

#### 2. Configure Environment Variables

Create `.env.local`:

```
VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_LIVEKIT_URL=wss://your-livekit-server.com
```

#### 3. Update Clerk Configuration

- Add `http://localhost:5173` to Clerk's allowed redirect URIs
- Ensure Clerk is properly configured in the root layout

#### 4. Page Routing

Add to route tree (should auto-generate):

```
✅ /therapists              - Marketplace
✅ /booking/$therapistId    - Booking flow
✅ /session/$bookingId      - Video room
✅ /subscription            - Subscription page
```

#### 5. Start Frontend Development Server

```bash
npm run dev
# Available at http://localhost:5173
```

---

## Feature Specifications

### 1. Therapist Marketplace

**Path:** `/therapists`

**Features:**

- Search bar (name/specialty)
- Filters: Specialization, Language, Price Range (₹500-₹5000)
- Therapist cards with:
  - 60-second intro video (autoplay muted)
  - Name, RCI verification badge
  - Specializations, languages
  - Star rating, session count
  - Session fee
- "Book Session" CTA

**Filters Query Example:**

```
GET /api/therapists?specialization=Depression&language=Hindi&minFee=500&maxFee=2000
```

---

### 2. Booking & Payment Flow

**Path:** `/booking/$therapistId`

**Steps:**

1. **Date & Time Selection**
   - Date picker (min: tomorrow)
   - Time slots from therapist availability
   - Show booked slots as disabled
2. **Confirmation**
   - Display selected datetime
   - Show total amount (therapist's session fee)
   - Change slot option
3. **Razorpay Payment**
   - Hosted checkout
   - Auto-verify signature
   - Error handling with retry
4. **Success**
   - Confirmation message
   - SMS sent to user with video room link
   - Redirect to dashboard

**API Flow:**

```
POST /api/bookings
  → Creates booking (status: "pending")

POST /api/payment/initiate
  → Creates Razorpay order

POST /api/payment/verify
  → Verifies signature + marks payment.paid = true
  → Sets booking.status = "confirmed"
  → Triggers SMS with video room link
```

---

### 3. Video Conferencing

**Path:** `/session/$bookingId`

**Features:**

- LiveKit WebRTC grid layout
- Session countdown timer (top center)
- Camera/mic toggles
- Auto-hide UI after 3s inactivity
- Text chat side panel
- 5-min remaining toast notification
- Leave button (red)
- Post-session rating (1-5 stars + feedback)

**Token Requirements:**

- 15 min before session: both get tokens
- 2-hour TTL per token
- Generate on demand: `GET /api/bookings/:bookingId/video-token`

---

### 4. Subscription Tiers

| Feature             | Free   | Mann Shanti (₹199/mo) | Apna Therapist (₹499/mo) |
| ------------------- | ------ | --------------------- | ------------------------- |
| AI Chat Messages    | 3/day  | 100/day               | Unlimited                 |
| CBT Journal Entries | 3/week | Unlimited             | Unlimited                 |
| Mood Calendar       | 7 days | 30 days               | 30 days                   |
| Session Discount    | -      | 10%                   | 20%                       |
| Priority Booking    | ❌     | ✅                    | ✅                        |
| Crisis Line         | ❌     | ❌                    | ✅ 24/7                   |

**Upgrade Flow:**

1. User clicks "Upgrade" on subscription page
2. Select tier (Mann Shanti or Apna Therapist)
3. Razorpay checkout
4. User tier updated in database
5. New limits take effect immediately

---

### 5. Free Tier Message Counter

**Integration:** Add to chat interface

**Display:**

- "2 of 3 messages remaining" badge
- Green progress bar
- "Upgrade Now" link

**At Limit:**

- Show upgrade CTA
- Show crisis mode button (helpline overlay)

**Crisis Mode Helpline Numbers:**

- AASRA: 9820466726
- iCall: 9152987821
- Vandrevala Foundation: 9999 77 6555
- Emergency: 112

---

## Database Schema Quick Reference

### Subscription Collection

```typescript
interface ISubscription {
  _id: ObjectId
  userId: ObjectId (ref: User)
  tier: "free" | "mann_shanti" | "apna_therapist"
  startDate: Date
  renewalDate?: Date
  autoRenew: boolean
  status: "active" | "cancelled" | "expired"
  createdAt: Date
  updatedAt: Date
}
```

### Booking with Payment

```typescript
interface ITherapistBooking {
  _id: ObjectId
  userId: ObjectId
  therapistId: ObjectId
  slot: Date
  status: "pending" | "confirmed" | "completed" | "cancelled"
  payment: {
    razorpayOrderId?: string
    amount: number
    paid: boolean
  }
  videoRoomId?: string
  therapistNotes?: string (encrypted)
  aiBrief?: string (encrypted)
  createdAt: Date
  updatedAt: Date
}
```

---

## Testing Checklist

### Backend Tests

- [ ] Therapist list API with filters
- [ ] Create booking (without payment)
- [ ] Initiate Razorpay payment
- [ ] Verify payment signature
- [ ] Generate LiveKit token (within 15 min window)
- [ ] Reject token (outside 2-hour window)
- [ ] Cancel booking

### Frontend Tests

- [ ] Therapist marketplace loads & filters work
- [ ] Booking flow completes all 4 steps
- [ ] Razorpay checkout opens & closes
- [ ] Video room connects with LiveKit
- [ ] Session timer counts down
- [ ] Rating flow appears after session
- [ ] Subscription page shows correct tier
- [ ] Message counter appears in chat
- [ ] Crisis mode overlay displays

### Integration Tests

- [ ] User can book end-to-end
- [ ] Payment confirms booking
- [ ] Video room accessible immediately after payment
- [ ] SMS sent with confirmation
- [ ] Therapist sees booking in dashboard

---

## Deployment Notes

### Backend Deployment

- Set production env vars (Razorpay keys, LiveKit credentials)
- Configure MongoDB Atlas connection
- Set up error logging (Sentry recommended)
- Enable CORS for production frontend URL
- Configure webhook endpoint for Razorpay

### Frontend Deployment

- Build: `npm run build`
- Deploy to Vercel/Netlify
- Set production env vars
- Configure Clerk production instance
- Test payment flow in production

### LiveKit Setup

1. Self-host or use LiveKit Cloud
2. Get API key & secret
3. Configure WebRTC URL
4. Ensure firewall rules allow WebRTC ports

---

## Next Steps (Not Yet Implemented)

- [ ] Therapist AI Brief (mood chart, journal themes, risk level)
- [ ] E2E encryption for therapist notes
- [ ] SMS integration (MSG91 already in .env)
- [ ] Therapist & Admin dashboards
- [ ] Analytics & revenue tracking
- [ ] Session replay & notes export
- [ ] Subscription renewal & cancellation
- [ ] Organization/workplace features
- [ ] Multi-language support

---

## Support & Troubleshooting

### Common Issues

**Razorpay Integration:**

- Verify API keys in .env
- Test webhook endpoint is accessible
- Check payment signature verification logic
- Ensure amount is in paise (multiply by 100)

**LiveKit Integration:**

- Verify WebRTC firewall rules
- Check browser console for CORS issues
- Ensure token TTL covers session duration
- Test peer connections in browser DevTools

**Booking Flow:**

- Check therapist availability is set
- Verify booking status transitions
- Test date/time picker edge cases
- Verify SMS sending (if integrated)

---

## Code Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── payment.service.ts      ✅ Razorpay integration
│   │   ├── livekit.service.ts      ✅ Token generation
│   │   └── ...
│   ├── controllers/
│   │   ├── payment.controller.ts   ✅ Payment handling
│   │   ├── booking.controller.ts   ✅ Video token endpoint
│   │   ├── therapist.controller.ts ✅ Enhanced with search
│   │   └── ...
│   ├── routes/
│   │   ├── payment.ts              ✅ Payment routes
│   │   ├── booking.ts              ✅ Updated booking routes
│   │   ├── therapist.ts            ✅ Enhanced therapist routes
│   │   └── ...

mind-bloom-ai-42/
├── src/
│   ├── routes/
│   │   ├── therapists.tsx          ✅ Marketplace page
│   │   ├── booking.$therapistId.tsx ✅ Booking flow
│   │   ├── session.$bookingId.tsx  ✅ Video room
│   │   ├── subscription.tsx        ✅ Subscription page
│   │   └── ...
│   ├── components/
│   │   ├── RazorpayCheckout.tsx   ✅ Payment component
│   │   ├── MessageCounter.tsx      ✅ Message limit & crisis mode
│   │   └── AppShell.tsx            ✅ Main layout
│   └── lib/
│       └── api.ts                  ✅ API client
```

---

## Environment Variables Checklist

### Backend (.env)

```
✅ RAZORPAY_KEY_ID
✅ RAZORPAY_KEY_SECRET
✅ RAZORPAY_WEBHOOK_SECRET (optional)
✅ LIVEKIT_URL
✅ LIVEKIT_API_KEY
✅ LIVEKIT_API_SECRET
✅ MONGODB_URI
✅ JWT_SECRET
✅ CLIENT_ORIGIN
```

### Frontend (.env.local)

```
✅ VITE_API_URL
✅ VITE_CLERK_PUBLISHABLE_KEY
✅ VITE_RAZORPAY_KEY_ID
✅ VITE_LIVEKIT_URL
```

---

**Last Updated:** May 8, 2026
**Status:** 70% Complete - Core features implemented, ready for testing
