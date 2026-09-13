const requests = new Map();
const WINDOW_SIZE = 10 * 1000; // 10 seconds
const MAX_REQUESTS = 5;

function slidingWindowLog(clientIp){
    const currentTime = Date.now();

    let timestamps = requests.get(clientIp) || [];

    let windowStart =  currentTime - WINDOW_SIZE;
    
    timestamps = timestamps.filter(
        timestamp => timestamp > windowStart
    );

    if (timestamps.length >= MAX_REQUESTS) {
        requests.set(clientIp, timestamps);
        return {
            allowed: false,
            remainingRequests: 0,
        }
    }

    timestamps.push(currentTime);

    requests.set(clientIp, timestamps);
    return {
        allowed: true,
        remainingRequests: MAX_REQUESTS - timestamps.length,
    };
}

module.exports = slidingWindowLog;