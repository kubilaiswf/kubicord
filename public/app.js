let socket;
let peerConnections = {};
let dataChannels = {};
let iceCandidatesQueue = {};
let nickname = '';

// WebSocket bağlantısını başlat
document.getElementById('connectBtn').onclick = () => {
  nickname = document.getElementById('nickname').value.trim();
  if (!nickname) {
    alert('Lütfen bir nickname girin.');
    return;
  }

  socket = new WebSocket('ws://localhost:8080');

  socket.onopen = () => {
    console.log('Bağlandı');
    socket.send(JSON.stringify({ type: 'join', nickname }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'chat-history') {
      displayChatHistory(data.history);
    } else if (data.type === 'new-participant') {
      console.log(`${data.nickname} katıldı`);
      createOffer(data.nickname);
    } else if (data.type === 'offer') {
      handleOffer(data);
    } else if (data.type === 'answer') {
      handleAnswer(data);
    } else if (data.type === 'candidate') {
      handleCandidate(data);
    } else if (data.type === 'message') {
      document.getElementById('chatBox').innerHTML += `<p class="message receiver"><strong>${data.nickname}:</strong> ${data.text}</p>`;
    } else if (data.type === 'participant-left') {
      console.log(`${data.nickname} ayrıldı`);
      closeConnection(data.nickname);
    }
  };

  socket.onclose = () => {
    console.log('Bağlantı kapatıldı');
  };
};

// Teklif oluştur ve gönder
async function createOffer(targetNickname) {
  const peerConnection = new RTCPeerConnection();
  peerConnections[targetNickname] = peerConnection;

  const dataChannel = peerConnection.createDataChannel("chat");
  dataChannels[targetNickname] = dataChannel;

  dataChannel.onopen = () => {
    console.log('Data channel açıldı!');
  };

  dataChannel.onmessage = (event) => {
    const message = JSON.parse(event.data);
    document.getElementById('chatBox').innerHTML += `<p class="message receiver"><strong>${message.nickname}:</strong> ${message.text}</p>`;
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('ICE candidate oluşturuldu:', event.candidate);
      socket.send(JSON.stringify({
        type: 'candidate',
        candidate: event.candidate,
        target: targetNickname
      }));
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.send(JSON.stringify({
    type: 'offer',
    sdp: offer.sdp,
    target: targetNickname,
    nickname
  }));
}

// Teklif işleme
async function handleOffer(data) {
  const peerConnection = new RTCPeerConnection();
  peerConnections[data.nickname] = peerConnection;

  peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel;
    dataChannels[data.nickname] = dataChannel;

    dataChannel.onopen = () => {
      console.log('Data channel açıldı!');
    };

    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      document.getElementById('chatBox').innerHTML += `<p class="message receiver"><strong>${message.nickname}:</strong> ${message.text}</p>`;
    };
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('ICE candidate oluşturuldu:', event.candidate);
      socket.send(JSON.stringify({
        type: 'candidate',
        candidate: event.candidate,
        target: data.nickname
      }));
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.send(JSON.stringify({
    type: 'answer',
    sdp: answer.sdp,
    target: data.nickname,
    nickname
  }));
}

// Cevap işleme
async function handleAnswer(data) {
  const peerConnection = peerConnections[data.nickname];
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
  }
}

// ICE candidate işleme
async function handleCandidate(data) {
  const peerConnection = peerConnections[data.target];
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  } else {
    if (!iceCandidatesQueue[data.target]) {
      iceCandidatesQueue[data.target] = [];
    }
    iceCandidatesQueue[data.target].push(new RTCIceCandidate(data.candidate));
  }
}

// Bağlantıyı kapatma
function closeConnection(nickname) {
  if (peerConnections[nickname]) {
    peerConnections[nickname].close();
    delete peerConnections[nickname];
  }
  if (dataChannels[nickname]) {
    dataChannels[nickname].close();
    delete dataChannels[nickname];
  }
}

// Mesaj gönderme butonuna tıklanınca veri gönder
document.getElementById('sendMsgBtn').onclick = () => {
  const msg = document.getElementById('chatInput').value.trim();
  if (!msg) {
    alert('Boş mesaj gönderilemez.');
    return;
  }

  const message = { type: 'message', nickname, text: msg };

  socket.send(JSON.stringify(message));

  document.getElementById('chatBox').innerHTML += `<p class="message sender"><strong>${nickname}:</strong> ${msg}</p>`;
  document.getElementById('chatInput').value = '';
};

// Sohbet geçmişini görüntüleme
function displayChatHistory(history) {
  const chatBox = document.getElementById('chatBox');
  history.forEach(message => {
    chatBox.innerHTML += `<p class="message receiver"><strong>${message.nickname}:</strong> ${message.text}</p>`;
  });
}