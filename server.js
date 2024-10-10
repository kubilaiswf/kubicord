const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = app.listen(8080, 'localhost', () => {
  console.log('WebSocket sunucusu 8080 portunda çalışıyor');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Bir kullanıcı bağlandı');

  ws.on('message', (message) => {
    console.log(`Mesaj alındı: ${message}`);
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Bir kullanıcı bağlantıyı kapattı');
  });
});

app.use(express.static(path.join(__dirname, 'public')));