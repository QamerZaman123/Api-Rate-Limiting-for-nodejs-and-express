const buckets = {};
function tokenBucketLimiter(options) {
    const { MAX_CAPACITY, REFILL_RATE_PER_SEC, ip } = options;

    const currentTime = Date.now() / 1000;

    if (!buckets[options.ip]) {
        buckets[options.ip] = {
            tokens: MAX_CAPACITY,
            lastRefilled: currentTime
        };
    }

    const bucket = buckets[options.ip];
    const timePassed = currentTime - bucket.lastRefilled;
    const tokensToAdd = timePassed * REFILL_RATE_PER_SEC;

    bucket.tokens = Math.min(MAX_CAPACITY, bucket.tokens + tokensToAdd);
    bucket.lastRefilled = currentTime;

    // console.log(buckets);

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true; // Allow the request
    } else {
        return false; // Deny the request
    }

}
// tokenBucketLimiter({MAX_CAPACITY: 10, REFILL_RATE_PER_SEC: 1, ip: "127.0.0.1"})
module.exports = tokenBucketLimiter;