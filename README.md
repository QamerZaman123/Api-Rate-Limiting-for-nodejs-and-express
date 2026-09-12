# API Rate Limiter

A comprehensive implementation of multiple rate-limiting algorithms for Node.js/Express applications. This project demonstrates different strategies to control and manage API traffic, preventing abuse and ensuring fair resource allocation.

## 📊 Project Overview

Rate limiting is essential for protecting APIs from abuse and ensuring stable performance. This project implements **5 different rate-limiting algorithms**, each with unique trade-offs in terms of memory usage, accuracy, and computational complexity. Details for each algorithm will be added as they are implemented.

### Progress Tracking

- ✅ **[Day 1] Token Bucket** - COMPLETED
- ✅ **[Day 2] Fixed Window Counter** - COMPLETED
- ⏳ **[Day 3] Sliding Window Log** - Pending
- ⏳ **[Day 4] Sliding Window Counter** - Pending
- ⏳ **[Day 5] Distributed Scaling (Redis)** - Pending

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn
- (Redis for distributed scaling - optional for Day 5)

### Installation

```bash
# Clone or navigate to project directory
cd "Api Rate Limiter"

# Install dependencies
npm install

# Create .env file
echo "PORT=3000" > .env
```

### Running the Server

```bash
node index.js
```

Test the rate limiter:
```bash
# Unlimited endpoint (no rate limiting)
curl http://localhost:3000/unlimited

# Rate-limited endpoint (10 requests per second)
curl http://localhost:3000/limited
```

---

## 📖 Rate Limiting Algorithms

### ✅ 1. TOKEN BUCKET (COMPLETED)

**Status:** ✅ Day 1 - Complete  
**File:** `ratelimiters/limiters.js`

#### How It Works

The token bucket algorithm models rate limiting as tokens in a bucket:

- The bucket has a **maximum capacity** (e.g., 10 tokens)
- Tokens are **continuously added** at a fixed rate (e.g., 1 token/second)
- Each request **consumes 1 token**
- If tokens are available → request is **allowed** ✓
- If no tokens are available → request is **denied** ✗

#### Characteristics

| Aspect | Value |
|--------|-------|
| **Memory** | Low (per-IP state) |
| **Accuracy** | High (continuous refill) |
| **Burst Support** | Yes (can use accumulated tokens) |
| **Fairness** | Good for heterogeneous traffic |
| **Implementation** | Simple |

#### Visual Example

```
Time 0s: [██████████] 10 tokens (full)
         Request → [█████████_] 9 tokens

Time 1s: [██████████] 10 tokens (refilled 1)
         Request → [█████████_] 9 tokens

Time 1.5s: [█████████_] 9 tokens
           Request → [████████__] 8 tokens

Time 2.5s: [██████████] 10 tokens (refilled 1)
           Request → [█████████_] 9 tokens
```

#### Configuration

```javascript
tokenBucketLimiter({
  MAX_CAPACITY: 10,         // Max tokens in bucket
  REFILL_RATE_PER_SEC: 1,   // Tokens added per second
  ip: "127.0.0.1"           // Client IP address
})
```

#### Use Cases

- ✅ General-purpose API rate limiting
- ✅ Handling burst traffic
- ✅ Smooth traffic shaping
- ✅ Per-user rate limits

#### Advantages

- 🟢 Handles burst traffic well
- 🟢 Smooth token replenishment
- 🟢 Simple to understand and implement
- 🟢 Low memory footprint

#### Disadvantages

- 🔴 Can allow short-term bursts
- 🔴 State lost if server restarts (single instance)
- 🔴 Per-IP only (not distributed)

#### Usage

```javascript
// index.js
app.get('/limited', (req, res) => {
  const ip = req.ip;
  const isAllowed = tokenBucketLimiter({ MAX_CAPACITY: 10, REFILL_RATE_PER_SEC: 1, ip });

  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

## ✅ 2. FIXED WINDOW COUNTER (COMPLETED)

**Status:** ✅ Day 2 - Complete  
**File:** `ratelimiters/fixedWindow.js`

### How It Works

The fixed window algorithm divides time into **fixed-size intervals** (windows) and counts requests in each window:

- Time is divided into fixed chunks (e.g., 10-second windows)
- Each window has a **counter** tracking requests made during that window
- When a request arrives, check if we're still in the same window
- If window is still active and count < limit → increment counter and allow
- If window expires → reset counter to 1 and start new window
- If count reaches limit → deny request

### Characteristics

| Aspect | Value |
|--------|-------|
| **Memory** | Low (just counter + timestamp per IP) |
| **Accuracy** | Medium (can have boundary spike issues) |
| **Burst Support** | No (strictly enforced per window) |
| **Fairness** | Poor at window boundaries |
| **Implementation** | Very simple |
| **Per-Window Resets** | Yes (counter resets completely) |

### Visual Example

```
Window 1 [0ms - 10000ms]:  Requests: [1, 2, 3, 4, 5]
                           Count: 5 ✓ All allowed (limit: 5)
                           Request 6: ✗ DENIED

Window 2 [10000ms - 20000ms]: Counter resets!
                           Request 1: ✓ Allowed (count: 1)
                           Requests 2-5: ✓ Allowed
                           Request 6: ✗ DENIED
```

### Boundary Spike Problem

This is a known issue with fixed windows:

```
Window 1 [0ms - 10000ms]:  5 requests allowed

Window boundary (10000ms): Time passes...

Window 2 [10000ms - 20000ms]:  5 more requests immediately allowed

Result: At the 10000ms boundary, 10 requests could be processed
        in just a few milliseconds, defeating rate limiting!
```

### Configuration

```javascript
// Built-in constants (edit in file):
const WINDOW_SIZE = 10 * 1000;  // 10 seconds
const MAX_REQUESTS = 5;          // 5 requests per window

// Usage:
fixedWindowRateLimiter("127.0.0.1")

// Returns:
{
  allowed: true,      // Whether request is allowed
  remaining: 4        // Remaining requests in current window
}
```

### Data Structure

The implementation uses a JavaScript `Map` for per-IP storage:

```javascript
rateLimitStore = Map {
  "127.0.0.1" => { 
    count: 3,              // Requests made in current window
    windowStart: 1694000000000  // When current window started
  },
  "192.168.1.1" => { 
    count: 1,
    windowStart: 1694000010000
  }
}
```

### Code Flow

```javascript
fixedWindowRateLimiter(clientIP):
  1. Get current time in milliseconds
  2. Look up client data in Map
  3. If client doesn't exist:
     → Initialize with count: 1, new window
     → Return allowed: true
  4. If client exists:
     a. Calculate: currentTime - clientData.windowStart
     b. If elapsed time > WINDOW_SIZE (10 seconds):
        → Reset: count: 1, windowStart: currentTime
        → Return allowed: true (new window)
     c. If count < MAX_REQUESTS (5):
        → Increment count
        → Return allowed: true, remaining tokens
     d. Else (count >= limit):
        → Increment count (overflow tracking)
        → Return allowed: false, remaining: 0
```

### Use Cases

- ✅ Simple APIs with straightforward rate limiting
- ✅ Educational purposes / learning algorithms
- ✅ Services where boundary spikes are acceptable
- ✅ Scenarios where simplicity outweighs precision

### Advantages

- 🟢 **Very simple** to implement and understand
- 🟢 **Low memory** footprint (just 2 numbers per IP)
- 🟢 **Fast** lookups and computations
- 🟢 **Predictable** behavior within windows
- 🟢 **Clean resets** at window boundaries

### Disadvantages

- 🔴 **Boundary spikes** - Can allow 2x rate at window edges
- 🔴 **No burst handling** - Strictly enforced, no smoothing
- 🔴 **Coarse-grained** - All requests identical, no gradation
- 🔴 **Inflexible** - No carry-over of unused requests

### Usage

```javascript
// index.js
app.get('/limited', (req, res) => {
  const ip = req.ip;
  const result = fixedWindowRateLimiter(ip);
  const isAllowed = result.allowed;
  const remainingRequests = result.remaining;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Comparison with Token Bucket

| Feature | Fixed Window | Token Bucket |
|---------|--------------|--------------|
| **Implementation** | Simpler | Slightly more complex |
| **Memory** | Lower | Low |
| **Burst Handling** | ❌ No | ✅ Yes |
| **Boundary Spikes** | ❌ Yes | ✅ No |
| **Fairness** | ❌ Poor | ✅ Good |
| **Use in Production** | Limited | Wide |

---

## 📅 Coming Soon

### Day 3: Sliding Window Log ⏳
- Maintains a log of timestamps for precise rate limiting
- Details will be added during implementation

### Day 4: Sliding Window Counter ⏳
- Hybrid approach combining fixed windows with sliding calculations
- Details will be added during implementation

### Day 5: Distributed Scaling (Redis) ⏳
- Centralized state management for multi-server deployments
- Details will be added during implementation

---

## 📁 Project Structure

```
Api Rate Limiter/
├── README.md                    # This file
├── index.js                     # Express server setup
├── package.json                 # Dependencies
├── .env                         # Environment variables
│
└── ratelimiters/
    ├── tokenBucket.js           # ✅ Token Bucket (Day 1)
    ├── fixedWindow.js           # ✅ Fixed Window (Day 2)
    ├── slidingWindowLog.js      # ⏳ Sliding Window Log (Day 3)
    ├── slidingWindowCounter.js  # ⏳ Sliding Window Counter (Day 4)
    └── redisDistributed.js      # ⏳ Redis Distributed (Day 5)
```

---

## � Usage Examples

### Token Bucket Usage

```javascript
// index.js
const tokenBucketLimiter = require('./ratelimiters/tokenBucket');

app.get('/limited', (req, res) => {
  const ip = req.ip;
  const isAllowed = tokenBucketLimiter({ MAX_CAPACITY: 10, REFILL_RATE_PER_SEC: 1, ip });

  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Fixed Window Usage

```javascript
// index.js
const fixedWindowRateLimiter = require('./ratelimiters/fixedWindow');

app.get('/limited', (req, res) => {
  const ip = req.ip;
  const result = fixedWindowRateLimiter(ip);
  const isAllowed = result.allowed;
  const remainingRequests = result.remaining;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

---

## 📄 License

ISC

---

## 📝 Notes

This project is designed for **learning and educational purposes**. Each day, a new rate-limiting algorithm is added to understand different approaches to solving the rate-limiting problem.

**Last Updated:** 2026-09-11  
**Current Phase:** Day 2 - Fixed Window Counter ✅
