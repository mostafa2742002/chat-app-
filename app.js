const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/web.html');
});

// Store connected clients and their socket ids
let clients = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Function to broadcast updated user list to all clients
  const broadcastUserList = () => {
    io.emit('get_users', Object.keys(clients));
  };

  // When a new user connects
  socket.on("username", (username) => {
    console.log('Username: ' + username);
    socket.username = username;
    clients[username] = socket.id;
    broadcastUserList();
    // Broadcast to all connected users that a new user has joined
    socket.broadcast.emit('is_online', username);
  });

  // Listen for chat messages
  socket.on('chat message', (data) => {
    const { to, message } = data;
    const receiverSocketId = clients[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('private message', { from: socket.username, message });
    }
    else if (to === 'all') {
      io.emit('chat message', { from: socket.username, message });
    }
    else {
      socket.emit('error', 'User not available');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = socket.username;
    if (username) {
      // Broadcast to all connected users that a user has left
      io.emit('user_disconnected', username);
      // Remove the disconnected user from the list
      delete clients[username];
      broadcastUserList();
      console.log('User disconnected');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
