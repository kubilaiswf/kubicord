let socket;
let peerConnection;
let dataChannel;
let iceCandidatesQueue = [];  // ICE candidate'leri tutmak için bir sıra (queue)

// WebSocket bağlantısını başlat
document.getElementById('connectBtn').onclick = () => {
  socket = new WebSocket('ws://localhost:8080'); // Yerel IP adresini kullan

  socket.onopen = () => {
    console.log('Bağlandı');
  };

  socket.onmessage = (event) => {
    if (event.data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        const textData = reader.result;
        try {
          const data = JSON.parse(textData);  // JSON verisini parse et
          handleSignalingData(data);  // Gelen mesajı işle
        } catch (e) {
          console.error('Mesaj JSON formatında değil', e);
        }
      };
      reader.readAsText(event.data);
    } else {
      try {
        const data = JSON.parse(event.data);  // JSON formatındaki mesajları parse et
        handleSignalingData(data);  // Gelen mesajı işle
      } catch (e) {
        console.error('Mesaj JSON formatında değil', e);
      }
    }
  };

  socket.onclose = () => {
    console.log('Bağlantı kapatıldı');
  };
};

// Teklif gönderme butonuna tıklanınca WebRTC offer oluştur ve gönder
document.getElementById('sendOfferBtn').onclick = async () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const offerMessage = await createOffer();
    socket.send(JSON.stringify(offerMessage));
    console.log('Teklif mesajı gönderildi:', offerMessage);
  }
};

// WebRTC offer oluştur
async function createOffer() {
  peerConnection = new RTCPeerConnection();

  // Data channel oluştur
  dataChannel = peerConnection.createDataChannel("chat");
  dataChannel.onopen = () => {
    console.log('Data channel açıldı!');
  };

  dataChannel.onmessage = (event) => {
    document.getElementById('chatBox').innerHTML += `<p>Karşıdan gelen: ${event.data}</p>`;
  };

  // ICE candidate oluştur ve signaling'e gönder
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('ICE candidate oluşturuldu:', event.candidate);
      socket.send(JSON.stringify({
        type: 'candidate',
        candidate: event.candidate
      }));
    }
  };

  // P2P bağlantı durumu değiştiğinde dinle
  peerConnection.onconnectionstatechange = (event) => {
    if (peerConnection.connectionState === 'connected') {
      console.log('P2P bağlantı kuruldu!');
    } else if (peerConnection.connectionState === 'failed') {
      console.log('P2P bağlantı başarısız oldu.');
    } else {
      console.log('Bağlantı durumu:', peerConnection.connectionState);
    }
  };

  // Teklif oluştur
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  return {
    type: 'offer',
    sdp: offer.sdp
  };
}

// WebRTC answer oluştur
async function createAnswer(offer) {
  if (peerConnection.signalingState !== 'have-remote-offer') {
    console.error('Hatalı durumda createAnswer çağrıldı:', peerConnection.signalingState);
    return;
  }

  // Cevap oluştur
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  console.log('Answer oluşturuldu ve gönderildi:', answer);

  socket.send(JSON.stringify({
    type: 'answer',
    sdp: answer.sdp
  }));
}

// Gelen signaling mesajlarını işleyen fonksiyon
async function handleSignalingData(data) {
  if (data.type === 'offer') {
    console.log('Offer alındı:', data.sdp);

    if (!peerConnection) {
      peerConnection = new RTCPeerConnection();
      
      // Gelen data channel'ı al
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;

        dataChannel.onopen = () => {
          console.log('Data channel açıldı!');
        };

        dataChannel.onmessage = (event) => {
          document.getElementById('chatBox').innerHTML += `<p>Karşıdan gelen: ${event.data}</p>`;
        };
      };

      // ICE candidate oluştur ve signaling'e gönder
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate oluşturuldu:', event.candidate);
          socket.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate
          }));
        }
      };

      // P2P bağlantı durumu değiştiğinde dinle
      peerConnection.onconnectionstatechange = (event) => {
        if (peerConnection.connectionState === 'connected') {
          console.log('P2P bağlantı kuruldu!');
        } else if (peerConnection.connectionState === 'failed') {
          console.log('P2P bağlantı başarısız oldu.');
        } else {
          console.log('Bağlantı durumu:', peerConnection.connectionState);
        }
      };
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));

    // remoteDescription ayarlandığında sıradaki ICE candidate'leri ekle
    if (iceCandidatesQueue.length > 0) {
      console.log('Biriken ICE candidate\'ler ekleniyor.');
      for (const candidate of iceCandidatesQueue) {
        await peerConnection.addIceCandidate(candidate);
      }
      iceCandidatesQueue = [];  // Sırayı temizle
    }

    // Teklifi aldıktan sonra cevap oluştur
    createAnswer(data.sdp);

  } else if (data.type === 'answer') {
    console.log('Answer alındı:', data.sdp);
    if (peerConnection.signalingState === 'have-local-offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } else {
      console.warn('Yanlış durumda setRemoteDescription çalıştırıldı:', peerConnection.signalingState);
    }

  } else if (data.type === 'candidate') {
    console.log('ICE candidate alındı:', data.candidate);

    if (peerConnection.remoteDescription) {
      // remoteDescription ayarlandıysa ICE candidate ekle
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      // remoteDescription ayarlandıktan sonra eklenmek üzere sıraya al
      console.log('ICE candidate remoteDescription ayarlanmadığı için sıraya alındı.');
      iceCandidatesQueue.push(new RTCIceCandidate(data.candidate));
    }
  }
}

// Mesaj gönderme butonuna tıklanınca veri gönder
document.getElementById('sendMsgBtn').onclick = () => {
  if (dataChannel && dataChannel.readyState === 'open') {
    const msg = document.getElementById('chatInput').value;
    dataChannel.send(msg);
    document.getElementById('chatBox').innerHTML += `<p>Sen: ${msg}</p>`;
    document.getElementById('chatInput').value = ''; // Mesajı temizle
  } else {
    console.error('Data channel henüz açık değil!');
  }
};