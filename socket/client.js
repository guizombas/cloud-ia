require("dotenv").config();
// connect on websocket server and log messages 
const WebSocket = require('ws');

const ws = new WebSocket(process.env.WS_ENDPOINT);

ws.on('open', function open() {
  console.log('Conexão WebSocket aberta.');
});

ws.on('message', function message(data) {
  console.log(data.toString());
});