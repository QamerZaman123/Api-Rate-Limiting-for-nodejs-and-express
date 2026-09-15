const express = require('express');
const dotenv = require('dotenv');
// const tokenBucketLimiter = require('./ratelimiters/tokenBucket');
// const fixedWindowRateLimiter = require('./ratelimiters/fixedWindow');
// const slidingWindowLog = require('./ratelimiters/slidingWindowLog');
// const slidingWindowCounter = require('./ratelimiters/slidingWindowCounter');
// const leakyBucketLimiterMeter = require('./ratelimiters/leakyBucket(meter)');
const leakyBucketQueue = require('./ratelimiters/leakyBucket(queue)');

dotenv.config();
const app = express();
app.use(express.json());

app.get('/unlimited', (req, res) => {
  res.send('This route has no rate limiting.');
});

// app.get('/limited', (req, res) => {
//   const ip = req.ip; // Get the client's IP address

//   // Test tokenBuket here
//   // const isAllowed = tokenBucketLimiter({ MAX_CAPACITY: 10, REFILL_RATE_PER_SEC: 1, ip });

//   // Test fixedWindow here
//   // const result = fixedWindowRateLimiter(ip);
//   // const isAllowed = result.allowed;
//   // const remainingRequests = result.remaining;

//   // Test slidingWindowLog here
//   // const result = slidingWindowLog(ip);
//   // const isAllowed = result.allowed;
//   // const remainingRequests = result.remainingRequests;
  
//   //Test slidingWindowCounter here
//   // const result = slidingWindowCounter(ip)
//   // const isAllowed = result.allowed
//   // const remaining = result.remaining

//   // Test leakyBucket here
//   const result = leakyBucketLimiter(ip);
//   const isAllowed = result.allowed;
//   const remaining = result.remainingRequests;

//   if (!isAllowed) {
//     return res.status(429).send(`Too many requests. Please try again later. remains: ${remaining}`);
//   }  

//   res.send('This route is rate limited.'+ remaining);
// });

//

// Leaky Bucket with Queue implementation testing
app.post('/limited/v2', (req, res) => {
  const ip = req.ip;
  const result = leakyBucketQueue(ip);

  if (!result.allowed) {
    return res.status(429).json({
      message: "Too many requests. Queue is full.",
      queueSize: result.queueSize,
    });
  }

  const queueSizeAtAdmission = result.queueSize;
  const scheduledDelay = result.delay;

  setTimeout(() => {
    res.status(201).json({
      message: "User registered successfully",
      user: req.body,
      queueSize: queueSizeAtAdmission,
      delayMs: scheduledDelay,
    });
  }, scheduledDelay);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});