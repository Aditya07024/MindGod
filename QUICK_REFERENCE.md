# 🚀 MindGod Frontend-Backend Integration - Quick Reference

## Frontend Routes (TanStack Router)

### Public Routes (No Auth Required)

```
GET  /                          Home page (dashboard)
GET  /therapists                Therapist marketplace (search & filter)
GET  /onboarding                User onboarding flow
GET  /subscription              Subscription plans (Free/Mann Shanti/Apna Therapist)
```

### Protected Routes (Requires Login)

```
GET  /dashboard                 Main dashboard
GET  /booking/:therapistId      Booking flow (4 steps)
GET  /session/:bookingId        Video conferencing room
POST /subscription/:tierId      Upgrade subscription (Razorpay)
GET  /chat                      AI chat with message counter
GET  /journal                   Journal entries
GET  /mood                      Mood tracking & calendar
GET  /breathe                   Breathing exercises
```

---

## Backend API Endpoints

### 🔍 Therapist Discovery

```bash
# List therapists with search/filters
GET /api/therapists
Query Params:
  - specialization: "Depression|Anxiety|Trauma|..."
  - language: "English|Hindi|Marathi|..."
  - minFee: 500
  - maxFee: 5000
  - verified: true
  - limit: 50
  - skip: 0

Response:
{
  therapists: [{
    id, name, specializations, languages, rating, sessionCount,
    sessionFee, verified, bio, introVideoUrl, availability
  }],
  pagination: { total, limit, skip, pages }
}

# Get therapist details
GET /api/therapists/:id
Response: { id, name, rciNumber, verified, specializations, ... }

# Check available slots for a date
GET /api/therapists/:id/availability?date=2024-05-15
Response: {
  date, availableSlots: ["09:00", "10:00", ...],
  bookedSlots: ["11:00", ...], openSlots: [...]
}
```

### 📅 Booking Management

```bash
# Create booking
POST /api/bookings
Body: { therapistId: "...", slot: "2024-05-15T14:00:00Z" }
Auth: Bearer <jwt_token>
Response: { booking: { id, status: "pending", amount } }

# Get user's bookings
GET /api/bookings
Auth: Bearer <jwt_token>
Response: { bookings: [{ id, therapistId, therapistName, slot, status, amount, paid, videoRoomId }] }

# Cancel booking
DELETE /api/bookings/:bookingId/cancel
Auth: Bearer <jwt_token>
Response: { message: "Booking cancelled successfully", bookingId }

# Get video room token (for LiveKit)
GET /api/bookings/:bookingId/video-token
Auth: Bearer <jwt_token>
Response: { token, url: "wss://...", roomName }
```

### 💳 Payment Processing

```bash
# Initiate payment (create Razorpay order)
POST /api/payment/initiate
Body: { bookingId: "..." }
Auth: Bearer <jwt_token>
Response: { orderId, amount, currency, keyId, bookingId, userName }

# Verify payment (called after Razorpay checkout)
POST /api/payment/verify
Body: {
  bookingId: "...",
  orderId: "order_...",
  paymentId: "pay_...",
  signature: "signature_..."
}
Auth: Bearer <jwt_token>
Response: { message: "Payment verified and booking confirmed", booking: { status, paid } }

# Check payment status
GET /api/payment/:bookingId
Auth: Bearer <jwt_token>
Response: { bookingId, paid, amount, razorpayOrderId, status }

# Refund payment
POST /api/payment/:bookingId/refund
Auth: Bearer <jwt_token>
Response: { message: "Booking refunded successfully" }

# Razorpay Webhook (automatic)
POST /api/payment/webhook
Header: x-razorpay-signature
Auto-processes payment confirmations/failures
```

### 💬 Chat & Messaging

```bash
# Send message
POST /api/chat/send
Body: { sessionId: "...", message: "..." }
Auth: Bearer <jwt_token>

# Get chat history
GET /api/chat/:sessionId
Auth: Bearer <jwt_token>
Response: { messages: [{ role, content, timestamp }] }
```

### 😊 Mood Tracking

```bash
# Create mood entry
POST /api/mood
Body: { score: 7, tags: ["anxious", "excited"], note: "..." }
Auth: Bearer <jwt_token>

# Get mood history
GET /api/mood
Auth: Bearer <jwt_token>
Response: { moods: [{ date, score, tags, note }] }
```

### 📔 Journal Entries

```bash
# Create journal entry
POST /api/journal
Body: { title: "...", content: "...", tags: [] }
Auth: Bearer <jwt_token>

# Get journal entries
GET /api/journal
Auth: Bearer <jwt_token>
Response: { entries: [{ id, title, content, createdAt }] }
```

### 📋 Subscription

```bash
# Get current subscription
GET /api/subscription
Auth: Bearer <jwt_token>
Response: { tier, startDate, renewalDate, status }

# Upgrade subscription
POST /api/subscription/upgrade
Body: { tier: "mann_shanti|apna_therapist" }
Auth: Bearer <jwt_token>
(Triggers Razorpay checkout)
```

### 👤 User Profile

```bash
# Get current user
GET /api/user
Auth: Bearer <jwt_token>
Response: { id, phoneHash, fullName, role, tier, ... }

# Update profile
PUT /api/user
Body: { fullName, location, emergencyContact, ... }
Auth: Bearer <jwt_token>
```

---

## Component Usage Examples

### RazorpayCheckout.tsx

```tsx
import RazorpayCheckout from "@/components/RazorpayCheckout";

<RazorpayCheckout
  bookingId="booking-id"
  amount={1800}
  userName="Therapist Name"
  onSuccess={() => console.log("Paid!")}
  onError={(err) => console.error(err)}
/>;
```

### MessageCounter.tsx

```tsx
import { MessageCounter, CrisisMode } from "@/components/MessageCounter";

const [crisisMode, setCrisisMode] = useState(false);

<div>
  <MessageCounter onCrisisMode={setCrisisMode} />
  <CrisisMode active={crisisMode} onClose={() => setCrisisMode(false)} />
</div>;
```

---

## Environment Variables Setup

### Backend (.env)

```env
# Existing
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_ORIGIN=http://localhost:3000

# NEW - Add these
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Existing (already in .env)
GROQ_API_KEY=gsk_...
MSG91_TEMPLATE_ID=69fdfa...
MSG91_AUTH_KEY=514528...
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_LIVEKIT_URL=wss://your-livekit-server.com
```

---

## Authentication Flow

1. **User logs in via Clerk**
   - Frontend: Sign-in form captures credentials
   - Clerk returns JWT token
   - Stored in browser memory

2. **API Requests**
   - Frontend: Fetch JWT from Clerk: `getAuth().getToken()`
   - Add to header: `Authorization: Bearer <token>`
   - Backend: Verify token via Clerk middleware

3. **Protected Routes**
   - Middleware: `requireAuth` validates JWT
   - Extracts: `req.user.sub` (user ID)
   - Attaches to: `req` object

---

## Data Models Reference

### Therapist Availability

```typescript
// In User.therapistProfile
availability: [
  { day: 0, slots: ["09:00", "10:00", "14:00", "15:00", ...] },
  { day: 1, slots: ["09:00", "10:00", ...] },
  // ... day 0 = Sunday, day 6 = Saturday
]
```

### Booking Status Flow

```
pending → (payment fails) → cancelled
pending → (payment succeeds) → confirmed → completed
confirmed → (cancel before) → cancelled
completed → (feedback) → (ends naturally)
```

### Subscription Tiers

```
free → mann_shanti (₹199/mo) → apna_therapist (₹499/mo)
Can upgrade at any time
```

---

## Common Error Responses

### 400 Bad Request

```json
{ "message": "therapistId and slot are required" }
```

### 401 Unauthorized

```json
{ "message": "Authentication required" }
```

### 403 Forbidden

```json
{ "message": "Not a therapist account" }
```

### 404 Not Found

```json
{ "message": "Therapist not found" }
```

### 409 Conflict

```json
{ "message": "This slot is already booked" }
```

---

## Testing Commands

```bash
# Backend health check
curl http://localhost:8080/api/health

# List therapists
curl "http://localhost:8080/api/therapists?specialization=Depression"

# List with auth (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/bookings

# Create booking (replace values)
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"therapistId":"123","slot":"2024-05-15T14:00:00Z"}'
```

---

## Frontend Page Flow

```
/ (Home/Dashboard)
  ↓
/therapists (Browse & search)
  ↓ (Click "Book Session")
/booking/:therapistId (4-step booking)
  ↓ (Slot selected → Payment done)
/session/:bookingId (Video room)
  ↓ (Session ends)
Rating Form (Post-session feedback)

/subscription (View plans)
  ↓ (Click "Upgrade")
Razorpay Checkout
  ↓ (Payment success)
Tier updated, limits apply
```

---

## Performance Tips

1. **Message Counter**: Only show for free tier users
2. **Therapist List**: Implement pagination (50 per page)
3. **Video Room**: Lazy load LiveKit components
4. **Payment**: Validate amount server-side before Razorpay
5. **Bookings**: Cache therapist details with React Query
6. **Filters**: Debounce search input (300ms)

---

## Security Checklist

✅ All payment amounts server-validated
✅ Razorpay signature verified on backend
✅ Booking user ownership checked
✅ Video token generation scoped to 15-min window
✅ All API endpoints require JWT
✅ Therapist notes encrypted (TODO)
✅ CORS configured for frontend origin

---

**Last Updated:** May 8, 2026  
**Version:** 1.0 (Core Complete)
