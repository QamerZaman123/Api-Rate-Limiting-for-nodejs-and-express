const express = require('express');
const dotenv = require('dotenv');
const tokenBucketLimiter = require('./ratelimiters/tokenBucket');
const fixedWindowRateLimiter = require('./ratelimiters/fixedWindow');
const slidingWindowLog = require('./ratelimiters/windowLog');

dotenv.config();
const app = express();

app.get('/unlimited', (req, res) => {
  res.send('This route has no rate limiting.');
});

app.get('/limited', (req, res) => {
  const ip = req.ip; // Get the client's IP address

  // Test tokenBuket here
  // const isAllowed = tokenBucketLimiter({ MAX_CAPACITY: 10, REFILL_RATE_PER_SEC: 1, ip });

  // Test fixedWindow here
  // const result = fixedWindowRateLimiter(ip);
  // const isAllowed = result.allowed;
  // const remainingRequests = result.remaining;

  // Test slidingWindowLog here
  const result = slidingWindowLog(ip);
  const isAllowed = result.allowed;
  const remainingRequests = result.remainingRequests;
  
  if (!isAllowed) {
    return res.status(429).send(`Too many requests. Please try again later.`);
  }  

  res.send('This route is rate limited.');
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});