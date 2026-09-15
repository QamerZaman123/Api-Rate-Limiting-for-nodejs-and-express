const leakyBucketQueue = require('./ratelimiters/leakyBucket(queue)');

function runBurst(clientId, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(leakyBucketQueue(clientId));
  }
  return results;
}

console.log('Burst test 1:');
console.log(runBurst('demo-user', 8));

console.log('\nBurst test 2:');
console.log(runBurst('demo-user-2', 6));

console.log('\nSequential test:');
const first = leakyBucketQueue('seq-user');
const second = leakyBucketQueue('seq-user');
const third = leakyBucketQueue('seq-user');
console.log(first, second, third);
