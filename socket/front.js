const dotenv = require('dotenv');
//get  __dirname common js
const path = require('path');
// const __dirname = path.resolve();
// connect on websocket server and log messages

dotenv.config();
require("dotenv").config({
    path: path.join(__dirname, '../',  '.apibase.env')
});
const readline = require('node:readline');
// connect on websocket server and log messages 
const WebSocket = require('ws');
const axios = require('axios');

const apibase = process.env.BASE || "http://localhost:3000";

const ws = new WebSocket(process.env.WS_ENDPOINT);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout // Optional: for displaying prompts
});

let connectionId = null;
let conversationId = null;

function promptUser() {

    rl.question('\nVocê: ', (input) => {
        // Send message to API
        axios.post(`${apibase}/message`, {
            connectionId,
            content: input,
            role: 'user',
            conversationId
        })
        .then((response) => {
            const data = response.data;
            conversationId = data.conversationId;
        })
        .catch((error) => {
            console.error('Erro ao enviar mensagem para a API:', error);
            waiting = false;
            promptUser();
        });
    });
}

ws.on('open', function open() {
  console.log('Conexão WebSocket aberta.\n');
  console.log(apibase)
  promptUser();

});

ws.on('message', function message(data) {
    const json = JSON.parse(data.toString());
    
    if (json['connectionId']) {
        connectionId = json['connectionId'];
    }
    else if (json['content']) {
        console.log('\nClaudia:', json['content']);
        promptUser();
    }

});