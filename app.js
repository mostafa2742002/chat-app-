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

// datastructure to store connected clients
let clients = [];

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Function to broadcast updated user list to all clients
  const broadcastUserList = () => {
    io.emit('get_users', clients);
  };

  // When a new user connects
  socket.on("username", (username) => {
    console.log('Username: ' + username);
    socket.username = username;
    clients.push(username);
    broadcastUserList();
    // Broadcast to all connected users that a new user has joined
    socket.broadcast.emit('is_online', socket.username);
  });

  // Listen for chat messages
  socket.on('chat message', (msg) => {
    console.log('Message: ' + msg);
    // Broadcast the message to all connected clients
    io.emit('chat message', msg);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      // Broadcast to all connected users that a user has left
      io.emit('user_disconnected', socket.username);
      // Remove the disconnected user from the list
      clients = clients.filter((client) => client !== socket.username);
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
