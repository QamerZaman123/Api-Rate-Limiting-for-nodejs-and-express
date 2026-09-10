# API Rate Limiter

A comprehensive implementation of multiple rate-limiting algorithms for Node.js/Express applications. This project demonstrates different strategies to control and manage API traffic, preventing abuse and ensuring fair resource allocation.

## 📊 Project Overview

Rate limiting is essential for protecting APIs from abuse and ensuring stable performance. This project implements **5 different rate-limiting algorithms**, each with unique trade-offs in terms of memory usage, accuracy, and computational complexity. Details for each algorithm will be added as they are implemented.

### Progress Tracking

- ✅ **[Day 1] Token Bucket** - COMPLETED
- ⏳ **[Day 2] Fixed Window Counter** - In Progress
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

#### Code Example

```javascript
const tokenBucketLimiter = require('./ratelimiters/limiters');

// Allow 10 requests per second per IP
const limiter = (req, res, next) => {
  const ip = req.ip;
  const isAllowed = tokenBucketLimiter({
    MAX_CAPACITY: 10,
    REFILL_RATE_PER_SEC: 1,
    ip
  });

  if (!isAllowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: 1
    });
  }
  next();
};

app.get('/api/data', limiter, (req, res) => {
  res.json({ data: 'success' });
});
```



---

## 📅 Coming Soon

### Day 2: Fixed Window Counter ⏳
- Divides time into fixed intervals and counts requests per interval
- Details will be added during implementation

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
    ├── limiters.js              # ✅ Token Bucket (DONE)
    ├── fixedWindowCounter.js    # ⏳ TODO
    ├── slidingWindowLog.js      # ⏳ TODO
    ├── slidingWindowCounter.js  # ⏳ TODO
    └── redisDistributed.js      # ⏳ TODO
```

---

## � Usage Examples

### Basic Token Bucket Usage

```javascript
const express = require('express');
const tokenBucketLimiter = require('./ratelimiters/limiters');

const app = express();

// Middleware to apply rate limiting
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const isAllowed = tokenBucketLimiter({
    MAX_CAPACITY: 10,
    REFILL_RATE_PER_SEC: 1,
    ip
  });

  if (!isAllowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down your requests',
      retryAfter: 1
    });
  }
  
  next();
};

// Apply to specific route
app.get('/api/users', rateLimitMiddleware, (req, res) => {
  res.json({ users: [...] });
});

// Or apply globally
app.use(rateLimitMiddleware);
```

### Different Limits for Different Endpoints

```javascript
// Strict limit for login
app.post('/auth/login', (req, res, next) => {
  const isAllowed = tokenBucketLimiter({
    MAX_CAPACITY: 5,
    REFILL_RATE_PER_SEC: 0.2,  // 1 request per 5 seconds
    ip: req.ip
  });
  
  if (!isAllowed) {
    return res.status(429).json({ error: 'Too many login attempts' });
  }
  
  // Login logic...
});

// Generous limit for read operations
app.get('/api/data', (req, res, next) => {
  const isAllowed = tokenBucketLimiter({
    MAX_CAPACITY: 100,
    REFILL_RATE_PER_SEC: 10,  // 10 requests per second
    ip: req.ip
  });
  
  if (!isAllowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // Data retrieval logic...
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

This project is designed for **learning and educational purposes**. Each day, a new rate-limiting algorithm will be added to understand different approaches to solving the rate-limiting problem.

**Last Updated:** 2026-09-10  
**Current Phase:** Day 1 - Token Bucket ✅
