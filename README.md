# kubicord

Kubicord is a simple peer-to-peer chat application built using WebRTC and WebSocket for real-time communication. This application enables users to exchange messages through a direct peer-to-peer connection, facilitated by a signaling server using WebSocket.

## Features

- **Real-time messaging**: Enables two clients to connect and send messages directly to each other.
- **WebRTC-based**: Establishes a peer-to-peer connection between users for faster and secure message exchange.
- **WebSocket signaling**: Utilizes WebSocket to handle the signaling process for setting up the WebRTC connection.

## Technologies Used

- **WebRTC**: For peer-to-peer data transmission.
- **WebSocket**: Used for signaling and establishing WebRTC connections.
- **Node.js**: Backend server using Express and WebSocket libraries.
- **HTML5**: User interface.
- **JavaScript**: Logic to handle client-side WebRTC connections and messaging.

## How It Works

1. **Signaling (via WebSocket)**: 
   - Users first connect to a signaling server via WebSocket. This server helps exchange WebRTC offer, answer, and ICE candidates between peers.
   
2. **Peer-to-Peer Connection (via WebRTC)**:
   - Once the signaling process completes, users can directly send and receive messages using a peer-to-peer data channel.

3. **Messaging**:
   - Users can type and send messages which are transmitted over the WebRTC data channel, enabling fast and direct communication between peers.

## Installation and Setup

### Prerequisites
- Ensure that you have **Node.js** installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kubilaiswf/kubicord
   cd kubicord
   ```

2. Install the dependencies:
    ```bash
   npm install
   ```

3. Run the WebSocket signaling server:
    ```bash
   node server.js
   ```

4. Open index.html in your browser. The app will attempt to connect to the WebSocket server at ws://localhost:8080.

## Usage

1. After opening the application, click on the **"Bağlan"** button to establish a WebSocket connection.
2. Click **"Teklif Gönder"** to initiate the WebRTC offer and send it to the other peer.
3. Once the connection is established, you can type messages in the input field and click **"Mesaj Gönder"** to send the message through the WebRTC connection.
4. Messages exchanged will be displayed in the chat box, showing both sent and received messages.

## File Structure

- **index.html**: Contains the front-end structure and user interface.
- **app.js**: Handles the WebRTC logic, signaling messages, and user interactions.
- **server.js**: Backend server using Node.js and WebSocket to handle signaling.

## Future Improvements

- Support for file transfer over WebRTC.
- Add authentication for users.
- Improve the UI for better user experience.
- Add support for multiple users in a group chat.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

