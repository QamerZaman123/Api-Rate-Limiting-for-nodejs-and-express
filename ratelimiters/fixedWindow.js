const rateLimitStore = new Map();
const WINDOW_SIZE = 10 * 1000;
const MAX_REQUESTS = 5;

const fixedWindowRateLimiter = (clientIP) => {
    const currentTime = Date.now();

    const clientData = rateLimitStore.get(clientIP);

    if(!clientData) {
        rateLimitStore.set(clientIP, { count: 1, windowStart: currentTime });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    const windowExpired = currentTime - clientData.windowStart > WINDOW_SIZE; 

    if(windowExpired) {
        rateLimitStore.set(clientIP, { count: 1, windowStart: currentTime });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if(clientData.count < MAX_REQUESTS) {
        rateLimitStore.set(clientIP, { count: clientData.count + 1, windowStart: clientData.windowStart });
        return { allowed: true, remaining: MAX_REQUESTS - clientData.count - 1 };
    }

    clientData.count++;

    return { allowed: false, remaining: 0 };
}

module.exports = fixedWindowRateLimiter;