const clients = new Map();

const BUCKET_CAPACITY = 10; // Maximum number of requests allowed in the bucket
const LEAK_RATE = 1; // Number of requests that leak out of the bucket per second

function leakyBucketLimiter(clientId) {
    const currentTime = Date.now();
    
    let clientData = clients.get(clientId);

    if (!clientData) {
        // Initialize client data if it doesn't exist
        clientData = {
            lastRequestTime: currentTime,
            requestCount: 0,
        };
        clients.set(clientId, clientData);
    }

    // Calculate the time elapsed since the last request
    const timeElapsed = (currentTime - clientData.lastRequestTime) / 1000; // Convert to seconds

    // Leak requests from the bucket based on the elapsed time
    const leakedRequests = Math.floor(timeElapsed * LEAK_RATE);
    clientData.requestCount = Math.max(0, clientData.requestCount - leakedRequests);

    // Update the last request time
    clientData.lastRequestTime = currentTime;

    if (clientData.requestCount + 1 > BUCKET_CAPACITY) {
        clients.set(clientId, clientData);
        return {
            allowed: false,
            remainingRequests: clientData.requestCount,
        }; 
    }

    clientData.requestCount += 1;
    clients.set(clientId, clientData);
    
    return {
        allowed: true,
        remainingRequests: BUCKET_CAPACITY - clientData.requestCount,
    };

}

module.exports = leakyBucketLimiter;