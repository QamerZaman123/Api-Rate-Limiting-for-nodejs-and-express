const express = require('express');
const dotenv = require('dotenv');
const tokenBucketLimiter = require('./ratelimiters/tokenBucket');

dotenv.config();
const app = express();

app.get('/unlimited', (req, res) => {
  res.send('This route has no rate limiting.');
});

app.get('/limited', (req, res) => {
  const ip = req.ip; // Get the client's IP address
  const isAllowed = tokenBucketLimiter({ MAX_CAPACITY: 10, REFILL_RATE_PER_SEC: 1, ip });

  if (!isAllowed) {
    return res.status(429).send('Too many requests. Please try again later.');
  }  
  res.send('This route is rate limited.');
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});