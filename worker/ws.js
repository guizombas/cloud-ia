const { WebSocketServer } = require('ws');
const { v4: uuid } = require('uuid');

const connections = new Map();

const port = process.env.WS_PORT || 8080;

function startWebSocketServer() {
    const wss = new WebSocketServer({ port });

    wss.on('connection', (ws) => {
        const connectionId = uuid();
        console.log(`Nova conexão WebSocket: ${connectionId}`);
        connections.set(connectionId, ws);

        ws.send(JSON.stringify({ connectionId }));

        ws.on('close', () => {
            connections.delete(connectionId);
        });
    });

    console.log("WebSocket server iniciado na porta " + port);
}

function sendToClient(connectionId, message) {
    const ws = connections.get(connectionId);
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(message);
    }
}

module.exports = { startWebSocketServer, sendToClient };