// Keep-alive service to prevent Render from sleeping
const http = require('http');

/**
 * Start keep-alive pinging
 * Pings the server every 25 minutes to prevent Render from putting it to sleep
 * (Render sleeps servers after 30 minutes of inactivity)
 */
function startKeepAlive(serverUrl) {
  // Ping every 5 minutes (300000 ms)
  const keepAliveInterval = 5 * 60 * 1000;

  setInterval(() => {
    try {
      http.get(serverUrl + '/api/keepalive', (res) => {
        console.log(`[${new Date().toISOString()}] Keep-alive ping sent - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log(`[${new Date().toISOString()}] Keep-alive ping failed:`, err.message);
      });
    } catch (error) {
      console.log(`[${new Date().toISOString()}] Keep-alive error:`, error.message);
    }
  }, keepAliveInterval);

  console.log('Keep-alive service started - will ping server every 5 minutes');
}

module.exports = { startKeepAlive };
