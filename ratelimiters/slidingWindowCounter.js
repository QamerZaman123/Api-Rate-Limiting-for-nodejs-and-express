const clients = new Map();

const WINDOW_SIZE = 10 * 1000;
const MAX_REQUESTS = 5;

function slidingWindowCounter(clientIp){
    const now = Date.now();

    let client = clients.get(clientIp);

    if(!client){
        client = {
            previousCount: 0,
            currentCount: 0,
            windowStart: now
       }
       clients.set(clientIp, client)
    }

    const elapsed = now - client.windowStart;

    if (elapsed >= WINDOW_SIZE * 2){
        client.previousCount = client.currentCount;
        client.currentCount = 0;
        client.windowStart += WINDOW_SIZE
    }

    const timeIntoWindow = now - client.windowStart

    const previousWindowWeight = (WINDOW_SIZE - timeIntoWindow) / WINDOW_SIZE

    const estimateCount = (client.previousCount * previousWindowWeight) + client.currentCount;

    if(estimateCount >= MAX_REQUESTS){
        return {
            allowed: false,
            remaining: 0
        }
    }

    client.currentCount++;

    return{
        allowed:true,
        remaining: Math.max(
            0,
            MAX_REQUESTS - Math.ceil(estimateCount) - 1
        )
    }
}

module.exports = slidingWindowCounter