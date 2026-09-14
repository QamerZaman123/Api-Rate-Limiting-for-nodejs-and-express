# API Rate Limiter

A comprehensive implementation of multiple rate-limiting algorithms for Node.js/Express applications. This project demonstrates different strategies to control and manage API traffic, preventing abuse and ensuring fair resource allocation.

## 📊 Project Overview

Rate limiting is essential for protecting APIs from abuse and ensuring stable performance. This project implements **6 different rate-limiting algorithms**, each with unique trade-offs in terms of memory usage, accuracy, and computational complexity. Details for each algorithm will be added as they are implemented.

### Progress Tracking

- ✅ **[Day 1] Token Bucket** - COMPLETED
- ✅ **[Day 2] Fixed Window Counter** - COMPLETED
- ✅ **[Day 3] Sliding Window Log** - COMPLETED
- ✅ **[Day 4] Sliding Window Counter** - COMPLETED
- ✅ **[Day 5] Leaky Bucket (Meter)** - COMPLETED
- ⏳ **[Day 6] Leaky Bucket (Queue)** - Pending

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

## ✅ 3. SLIDING WINDOW LOG (COMPLETED)

**Status:** ✅ Day 3 - Complete  
**File:** `ratelimiters/windowLog.js`

### How It Works

The sliding window log algorithm maintains a **log of timestamps** for each request and uses it for precise rate limiting:

- Each request stores its **exact timestamp** in a list
- Only timestamps within the **last window** (e.g., last 10 seconds) are kept
- Old timestamps outside the window are **filtered out (cleaned)**
- Count requests within the window
- If count < limit → request allowed, add timestamp; else denied
- No reset at boundaries - pure sliding window based on actual request times

### Characteristics

| Aspect | Value |
|--------|-------|
| **Memory** | High (stores all request timestamps) |
| **Accuracy** | Very High (exact timestamps) |
| **Burst Support** | No (strictly enforced) |
| **Fairness** | Excellent (no boundary spikes) |
| **Implementation** | Moderate |
| **Per-Window Resets** | No (sliding, not fixed) |

### Visual Example

```
Now: 5.3s, Window: [4.3s - 5.3s] (1-second window)

Timestamps in log:
  [3.8s]  ✗ (outside window, will be removed)
  [4.5s]  ✓ (within window)
  [4.8s]  ✓ (within window)
  [5.0s]  ✓ (within window)
  [5.1s]  ✓ (within window)
  [5.2s]  ✓ (within window)
  
Count: 5 requests in window

New request at 5.3s:
  1. Filter: Remove timestamps < 4.3s → [4.5s, 4.8s, 5.0s, 5.1s, 5.2s]
  2. Check: 5 < MAX_REQUESTS (5)? No, DENIED
  3. Return: allowed = false, remaining = 0

Request at 4.4s (in next cycle):
  1. Filter: Remove timestamps < 3.4s → [4.5s, 4.8s, 5.0s, 5.1s, 5.2s]
  2. Check: 5 < 5? No, DENIED
  
Request at 4.25s:
  1. Filter: Remove timestamps < 3.25s → [4.5s, 4.8s, 5.0s, 5.1s, 5.2s]
  2. Check: 5 < 5? No, DENIED

Request at 4.0s:
  1. Filter: Remove timestamps < 3.0s → [4.5s, 4.8s, 5.0s, 5.1s, 5.2s]
  2. Check: 5 < 5? No, DENIED

Request at 3.99s (critical!):
  1. Filter: Remove timestamps < 2.99s → [4.5s, 4.8s, 5.0s, 5.1s, 5.2s]
     Wait, this should be: [3.99s, 4.5s, 4.8s, 5.0s, 5.1s, 5.2s]? NO!
  
Actually, let's recalculate: at 3.99s, window is [2.99s - 3.99s]
  Timestamps: [4.5s, 4.8s, 5.0s, 5.1s, 5.2s] - ALL outside!
  Filter: [] (all removed, they're in future!)
  Count: 0 < 5, ALLOWED, add 3.99s
  Timestamps: [3.99s]
```

The key advantage: **No boundary spike** because the window is truly sliding based on actual time, not artificial boundaries.

### Use Cases

- ✅ High-precision rate limiting
- ✅ APIs where exact timestamp accuracy matters
- ✅ Payment/transaction systems
- ✅ Services with strict rate limits

### Advantages

- 🟢 **Extremely accurate** - Uses exact request timestamps
- 🟢 **No boundary spikes** - Pure sliding window, no reset edges
- 🟢 **Fair rate limiting** - Truly enforces limit per window
- 🟢 **Flexible boundaries** - No artificial window reset times

### Disadvantages

- 🔴 **High memory** - Stores all request timestamps
- 🔴 **Performance overhead** - Needs to filter/clean timestamps on each request
- 🔴 **Memory leaks risk** - If cleanup is not done properly, timestamps accumulate
- 🔴 **Complex logic** - More code to understand and maintain

### Usage

```javascript
// index.js
const slidingWindowLog = require('./ratelimiters/windowLog');

app.get('/limited', (req, res) => {
  const ip = req.ip;
  const result = slidingWindowLog(ip);
  const isAllowed = result.allowed;
  const remainingRequests = result.remainingRequests;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Comparison with Token Bucket & Fixed Window

| Feature | Sliding Log | Token Bucket | Fixed Window |
|---------|------------|--------------|--------------|
| **Memory** | ❌ High | 🟡 Low | ✅ Very Low |
| **Accuracy** | ✅ Very High | 🟡 High | 🟡 Medium |
| **Burst Handling** | ❌ No | ✅ Yes | ❌ No |
| **Boundary Spikes** | ✅ No | ✅ No | ❌ Yes |
| **Fairness** | ✅ Excellent | ✅ Good | ❌ Poor |
| **Performance** | 🟡 Moderate | ✅ Fast | ✅ Fast |

---

## ✅ 4. SLIDING WINDOW COUNTER (COMPLETED)

**Status:** ✅ Day 4 - Complete  
**File:** `ratelimiters/slidingWindowCounter.js`

### How It Works

The sliding window counter algorithm is a **hybrid approach** combining fixed windows with sliding calculations:

- Maintains **two adjacent window counters** (previous and current)
- Time window divided into chunks (e.g., 10-second windows)
- Tracks when each window started (`windowStart`)
- Uses **weighted interpolation** to blend previous and current window counts
- Smooths boundary spikes by calculating proportion of time in each window
- If weighted estimate < limit → request allowed; else denied
- Much lower memory than Sliding Window Log, avoids Fixed Window boundary issues

### Characteristics

| Aspect | Value |
|--------|-------|
| **Memory** | Low (just 3 counters per IP) |
| **Accuracy** | High (weighted interpolation) |
| **Burst Support** | No (strictly enforced) |
| **Fairness** | Good (no sharp boundary spikes) |
| **Implementation** | Moderate |
| **Per-Window Resets** | Partial (rolls windows gradually) |

### Visual Example

```
Setup: WINDOW_SIZE = 1000ms, MAX_REQUESTS = 10

Window 1 [0ms - 1000ms]:  previousCount = 0, currentCount = 8
Window 2 [1000ms - 2000ms]: previousCount = 8, currentCount = 0

At t=1300ms (30% into Window 2):
  timeIntoWindow = 300ms
  previousWindowWeight = (1000 - 300) / 1000 = 0.7
  estimateCount = (8 × 0.7) + 0 = 5.6
  
  Request allowed? 5.6 < 10 ✓ YES
  remaining = 10 - ceil(5.6) - 1 = 10 - 6 - 1 = 3

At t=1500ms (50% into Window 2):
  timeIntoWindow = 500ms
  previousWindowWeight = (1000 - 500) / 1000 = 0.5
  estimateCount = (8 × 0.5) + 2 = 6.0  (assuming 2 new requests)
  
  Request allowed? 6.0 < 10 ✓ YES
  remaining = 10 - ceil(6.0) - 1 = 2

At t=1900ms (90% into Window 2):
  timeIntoWindow = 900ms
  previousWindowWeight = (1000 - 900) / 1000 = 0.1
  estimateCount = (8 × 0.1) + 5 = 5.8  (assuming 5 new requests)
  
  Request allowed? 5.8 < 10 ✓ YES

Key advantage: Smooth transition between windows instead of hard reset!
```

### Use Cases

- ✅ Production APIs needing good accuracy without high memory
- ✅ Services avoiding boundary spike issues
- ✅ CDN and content delivery systems
- ✅ Mobile app APIs with moderate-to-high traffic

### Advantages

- 🟢 **Low memory** - Only stores 3 values per IP (like Fixed Window)
- 🟢 **Smooth boundaries** - Weighted calculation avoids spikes
- 🟢 **High accuracy** - Better than Fixed Window boundaries
- 🟢 **Balanced performance** - Fast computation vs. accuracy trade-off
- 🟢 **Production-ready** - Used by many API platforms

### Disadvantages

- 🔴 **Still not perfect** - Approximation, not exact like Sliding Window Log
- 🔴 **Complex logic** - Harder to understand than Fixed Window
- 🔴 **Weighted calculation overhead** - More math per request than Fixed Window
- 🔴 **No burst support** - Strictly enforced like Fixed Window

### Usage

```javascript
// index.js
const slidingWindowCounter = require('./ratelimiters/slidingWindowCounter');

app.get('/limited', (req, res) => {
  const ip = req.ip;
  const result = slidingWindowCounter(ip);
  const isAllowed = result.allowed;
  const remaining = result.remaining;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Comparison: All Four Algorithms

| Feature | Sliding Counter | Sliding Log | Token Bucket | Fixed Window |
|---------|-----------------|-------------|--------------|--------------|
| **Memory** | ✅ Very Low | ❌ High | 🟡 Low | ✅ Very Low |
| **Accuracy** | 🟡 High | ✅ Very High | 🟡 High | 🟡 Medium |
| **Burst Handling** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Boundary Spikes** | ✅ Smooth | ✅ None | ✅ None | ❌ Yes |
| **Fairness** | ✅ Good | ✅ Excellent | ✅ Good | ❌ Poor |
| **Performance** | ✅ Fast | 🟡 Moderate | ✅ Fast | ✅ Fast |
| **Complexity** | 🟡 Moderate | 🔴 Complex | ✅ Simple | ✅ Simple |
| **Best For** | Production | High-precision | Burst traffic | Simple APIs |

---

## ✅ 5. LEAKY BUCKET (METER) (COMPLETED)

**Status:** ✅ Day 5 - Complete  
**File:** `ratelimiters/leakyBucket(meter).js`

### How It Works

The leaky bucket (meter mode) algorithm models rate limiting as a bucket with a constant **leak rate**:

- Bucket has a **fixed capacity** (max requests that can be held)
- Requests are **added to the bucket** when they arrive
- Bucket **leaks at a constant rate** (e.g., 1 request per second)
- If bucket is full → request is **rejected** ✗
- If bucket has space → request is **accepted** ✓
- Bucket automatically empties at the leak rate regardless of new requests
- Creates a **smooth, predictable traffic flow**

### Characteristics

| Aspect | Value |
|--------|-------|
| **Memory** | Low (just counter + timestamp per IP) |
| **Accuracy** | High (constant rate) |
| **Burst Support** | Limited (depends on capacity) |
| **Fairness** | Excellent (smooth output rate) |
| **Implementation** | Moderate |
| **Output Rate** | Constant (predictable) |

### Visual Example

```
Setup: BUCKET_CAPACITY = 5, LEAK_RATE = 1 req/sec

Timeline:
  t=0s    Bucket: [5 slots] Request 1 arrives → [4] allowed
  t=0.2s  Bucket: [4] Request 2 arrives → [3] allowed
  t=0.5s  Bucket: [3] Request 3 arrives → [2] allowed
  t=0.8s  Bucket: [2] Request 4 arrives → [1] allowed
  t=1.0s  Bucket: [1] Request 5 arrives → [0] allowed
  t=1.1s  Bucket: [0] Request 6 arrives → REJECTED (bucket full)
  
  t=1.2s  Bucket leaks at 1 req/sec
          1.2s elapsed → 1 request leaked
          Bucket: [1] Request 7 arrives → [0] allowed
  
  t=2.0s  2 seconds total elapsed → 2 requests leaked
          Bucket: [1] (if no new requests)
  
  t=3.0s  3 seconds elapsed → 3 requests leaked
          Bucket: [2] (capacity refills to max of 5)
          Actually, bucket would be: min(5, 0 + 3) = 3
          
Output: Smooth, predictable rate of ~1 request per second
```

### Key Difference from Token Bucket

- **Token Bucket**: Tokens accumulate, allowing bursts
- **Leaky Bucket (Meter)**: Requests leak at constant rate, smoothing traffic

### Use Cases

- ✅ Smoothing traffic flow to backend services
- ✅ Protecting downstream systems from spikes
- ✅ APIs requiring consistent, predictable request rates
- ✅ Video streaming, data processing pipelines

### Advantages

- 🟢 **Smooth output** - Constant leak rate prevents spikes
- 🟢 **Predictable** - Downstream services get steady load
- 🟢 **Low memory** - Just counter + timestamp per IP
- 🟢 **Protects backends** - No sudden traffic bursts
- 🟢 **Fair queuing** - All clients get proportional treatment

### Disadvantages

- 🔴 **No burst tolerance** - Rejects requests when full
- 🔴 **Less user-friendly** - Users get rejected even with small queues
- 🔴 **Fixed output rate** - Can't adapt to available capacity
- 🔴 **Wasteful if unused** - Leaks even if backend is idle

### Usage

```javascript
// index.js
const leakyBucketLimiter = require('./ratelimiters/leakyBucket(meter)');

app.get('/limited', (req, res) => {
  const clientId = req.ip;
  const result = leakyBucketLimiter(clientId);
  const isAllowed = result.allowed;
  const remainingRequests = result.remainingRequests;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Comparison: Five Algorithms

| Feature | Leaky Bucket | Sliding Counter | Sliding Log | Token Bucket | Fixed Window |
|---------|-------------|-----------------|-------------|--------------|--------------|
| **Memory** | ✅ Very Low | ✅ Very Low | ❌ High | 🟡 Low | ✅ Very Low |
| **Accuracy** | ✅ High | 🟡 High | ✅ Very High | 🟡 High | 🟡 Medium |
| **Burst Support** | 🟡 Limited | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Output Smoothing** | ✅ Excellent | 🟡 Good | 🟡 Good | ❌ Bursty | ❌ Bursty |
| **Fairness** | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Good | ❌ Poor |
| **Performance** | ✅ Fast | ✅ Fast | 🟡 Moderate | ✅ Fast | ✅ Fast |
| **Best For** | Traffic smoothing | Production | High precision | Burst traffic | Simple APIs |

---

## 📅 Coming Soon

### Day 6: Leaky Bucket (Queue) ⏳
- Queue-based implementation that buffers and processes requests
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
    ├── windowLog.js             # ✅ Sliding Window Log (Day 3)
    ├── slidingWindowCounter.js  # ✅ Sliding Window Counter (Day 4)
    ├── leakyBucket(meter).js    # ✅ Leaky Bucket - Meter (Day 5)
    └── redisDistributed.js      # ⏳ Redis Distributed (Day 6)
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

### Sliding Window Log Usage

```javascript
// index.js
const slidingWindowLog = require('./ratelimiters/windowLog');

app.get('/limited', (req, res) => {
  const ip = req.ip;
  const result = slidingWindowLog(ip);
  const isAllowed = result.allowed;
  const remainingRequests = result.remainingRequests;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Sliding Window Counter Usage

```javascript
// index.js
const slidingWindowCounter = require('./ratelimiters/slidingWindowCounter');

app.get('/limited', (req, res) => {
  const ip = req.ip;
  const result = slidingWindowCounter(ip);
  const isAllowed = result.allowed;
  const remaining = result.remaining;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});
```

### Leaky Bucket (Meter) Usage

```javascript
// index.js
const leakyBucketLimiter = require('./ratelimiters/leakyBucket(meter)');

app.get('/limited', (req, res) => {
  const clientId = req.ip;
  const result = leakyBucketLimiter(clientId);
  const isAllowed = result.allowed;
  const remainingRequests = result.remainingRequests;
  
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

**Last Updated:** 2026-09-14  
**Current Phase:** Day 5 - Leaky Bucket (Meter) ✅
