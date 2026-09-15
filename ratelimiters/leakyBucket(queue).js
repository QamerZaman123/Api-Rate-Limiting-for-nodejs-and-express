const clients = new Map();

const QUEUE_CAPACITY = 5;
const PROCESSING_INTERVAL = 1000; // 1 request per second

function leakyBucketQueue(clientId) {
  const now = Date.now();

  let client = clients.get(clientId);

  if (!client) {
    client = {
      queueSize: 0,
      nextAvailableTime: now,
    };
    clients.set(clientId, client);
  }

  if (client.queueSize >= QUEUE_CAPACITY) {
    return {
      allowed: false,
      queueSize: client.queueSize,
    };
  }

  const processTime = Math.max(now, client.nextAvailableTime);
  const delay = processTime - now;

  client.queueSize += 1;
  client.nextAvailableTime = processTime + PROCESSING_INTERVAL;

  setTimeout(() => {
    const latestClient = clients.get(clientId);

    if (!latestClient) {
      return;
    }

    latestClient.queueSize = Math.max(0, latestClient.queueSize - 1);

    if (latestClient.queueSize === 0) {
      clients.delete(clientId);
    }
  }, delay);

  return {
    allowed: true,
    queueSize: client.queueSize,
    delay,
  };
}

module.exports = leakyBucketQueue;