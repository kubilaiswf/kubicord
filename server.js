const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = app.listen(8080, 'localhost', () => {
  console.log('WebSocket sunucusu 8080 portunda çalışıyor');
});

const wss = new WebSocket.Server({ server });
const clients = new Map();
const chatHistory = [];

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'join') {
      clients.set(ws, data.nickname);
      console.log(`${data.nickname} katıldı`);

      // Send chat history to the new participant
      ws.send(JSON.stringify({ type: 'chat-history', history: chatHistory }));

      // Notify all other clients about the new participant
      for (const [client, nickname] of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'new-participant', nickname: data.nickname }));
        }
      }
    } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
      // Forward signaling data to the target client
      const targetClient = Array.from(clients.keys()).find(client => clients.get(client) === data.target);
      if (targetClient) {
        targetClient.send(JSON.stringify(data));
      }
    } else if (data.type === 'message') {
      // Store message in chat history
      chatHistory.push({ nickname: data.nickname, text: data.text });

      // Forward message to all clients except the sender
      for (const [client, nickname] of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    }
  });

  ws.on('close', () => {
    const nickname = clients.get(ws);
    clients.delete(ws);
    console.log(`${nickname} ayrıldı`);

    // Notify all other clients about the participant leaving
    for (const [client, nickname] of clients) {
      client.send(JSON.stringify({ type: 'participant-left', nickname }));
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));