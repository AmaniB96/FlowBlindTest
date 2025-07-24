const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all routes

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your Next.js app to connect
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('createRoom', (callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);
    // Add a 'ready' set to track players ready for the next round
    rooms[roomId] = { players: [{ id: socket.id, score: 0 }], ready: new Set() };
    callback(roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  socket.on('joinRoom', ({ roomId, username }, callback) => {
    if (rooms[roomId] && rooms[roomId].players.length < 2) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, score: 0, username });
      // Notify the other player that someone has joined
      socket.to(roomId).emit('playerJoined', { players: rooms[roomId].players });
      callback({ status: "ok", players: rooms[roomId].players });
      console.log(`${socket.id} joined room ${roomId}`);
    } else {
      callback({ status: "error", message: "Room is full or does not exist." });
    }
  });

  socket.on('settingsChanged', ({ roomId, category, difficulty }) => {
    // When the host changes a setting, broadcast it to the other player
    // so their UI can update in real-time.
    socket.to(roomId).emit('settingsUpdated', { category, difficulty });
    console.log(`Settings changed in room ${roomId}: C:${category}, D:${difficulty}`);
  });

  socket.on('startGame', ({ roomId, songs }) => {
    // Send the same song list to everyone in the room to ensure sync
    io.to(roomId).emit('gameStarted', { songs });
    console.log(`Game started in room ${roomId}`);
  });

  socket.on('submitGuess', ({ roomId, guess, song, playerTime }) => {
    const isCorrect = guess.toLowerCase() === song.title.toLowerCase();

    if (isCorrect) {
      // When a round ends, clear the ready status for the next round
      if (rooms[roomId]) {
        rooms[roomId].ready.clear();
      }
      io.to(roomId).emit('roundOver', { winnerId: socket.id, guess, time: playerTime });
      console.log(`Round won by ${socket.id} in room ${roomId}`);
    }
  });

  // --- ADD THIS NEW EVENT HANDLER ---
  socket.on('playerReady', ({ roomId }) => {
    if (!rooms[roomId]) return;

    console.log(`Player ${socket.id} is ready in room ${roomId}`);
    rooms[roomId].ready.add(socket.id);

    // Check if all players in the room are ready
    if (rooms[roomId].ready.size === rooms[roomId].players.length) {
      console.log(`All players ready in room ${roomId}. Starting next round.`);
      // Reset the ready set for the *next* round
      rooms[roomId].ready.clear();
      // Tell all clients to proceed to the next round
      io.to(roomId).emit('startNextRound');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    // Find which room the user was in and notify the other player
    for (const roomId in rooms) {
      const playerIndex = rooms[roomId].players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        io.to(roomId).emit('playerLeft', { playerId: socket.id });
        delete rooms[roomId]; // Simple cleanup: end game if one player leaves
        console.log(`Room ${roomId} closed due to disconnect.`);
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});