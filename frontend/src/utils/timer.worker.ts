/* eslint-disable no-restricted-globals */
const timers: Record<string, NodeJS.Timeout> = {};

self.onmessage = (e) => {
  const { type, pgnKey, interval } = e.data;
  
  if (type === 'start') {
    // Clear existing timer if any - this allows for rate updates
    console.log('Starting timer for PGN: with interval', interval, pgnKey);
    if (timers[pgnKey]) {
      clearInterval(timers[pgnKey]);
    }
    
    // Start new timer with the specified interval
    timers[pgnKey] = setInterval(() => {
      self.postMessage({ pgnKey });
    }, interval);
  }
  
  else if (type === 'stop') {
    // Clear all timers
    Object.values(timers).forEach(clearInterval);
    Object.keys(timers).forEach(key => delete timers[key]);
  }
};

export {};  // Make this a module 