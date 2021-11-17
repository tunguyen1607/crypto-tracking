const WebSocket = require('ws');
const wss = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
const clients = new Map();

wss.on('message', function incoming(message) {
  console.log('received: %s', message);
  console.log(JSON.parse(message));
});

wss.on('error', function error(error) {
  console.log(error);
})