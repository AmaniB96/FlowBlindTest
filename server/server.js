const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all routes

const server = http.createServer(app);

// Allow connections from your Vercel app
const allowedOrigins = [
  "http://localhost:3000",
  "https://flow-blind-test.vercel.app" // <-- IMPORTANT: Replace with your actual Vercel URL
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST"]
  }
});

const rooms = {};

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9 ]/g, '') // Remove special chars
    .trim();
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

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
    io.to(roomId).emit('gameStarted', { songs });
    if (rooms[roomId]) {
      // Reset scores and initialize round tracking
      rooms[roomId].players.forEach(p => p.score = 0);
      rooms[roomId].guessed = new Set();
      rooms[roomId].currentRound = 1;
      rooms[roomId].totalRounds = songs.length;
    }
    console.log(`Game started in room ${roomId}`);
  });

  // --- REVISED SUBMIT GUESS LOGIC ---
  socket.on('submitGuess', ({ roomId, guess, song, playerTime, gameMode = 'both' }) => {
    const room = rooms[roomId];
    if (!song || !guess || !room || room.guessed.has(socket.id)) {
      return; // Ignore if room doesn't exist or player already guessed
    }

    // Mark this player as having guessed for this round
    room.guessed.add(socket.id);

    // --- Scoring logic (remains the same) ---
    const typoThreshold = (answer) => answer.length <= 6 ? 2 : 3;
    const userGuess = normalize(guess);
    const artistName = normalize(song.artist?.name || '');
    const songTitle = normalize(song.title || '');
    let roundScore = 0;
    let correctSong = false;
    let correctArtist = false;
    if (gameMode === 'both') {
      if (levenshtein(userGuess, songTitle) <= typoThreshold(songTitle)) { roundScore += 5; correctSong = true; }
      if (levenshtein(userGuess, artistName) <= typoThreshold(artistName)) { roundScore += 5; correctArtist = true; }
    } else if (gameMode === 'song') {
      if (levenshtein(userGuess, songTitle) <= typoThreshold(songTitle) || userGuess.includes(songTitle)) {
        roundScore += 10;
        correctSong = true;
      }
    } else if (gameMode === 'artist') {
      if (levenshtein(userGuess, artistName) <= typoThreshold(artistName) || userGuess.includes(artistName)) {
        roundScore += 10;
        correctArtist = true;
      }
    }

    // --- State Update Logic ---
    if (roundScore > 0) {
      // CORRECT GUESS: Update score and end round for everyone
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.score += roundScore;
      }

      io.to(roomId).emit('roundOver', {
        winnerId: socket.id,
        guess,
        correctSong,
        correctArtist,
        players: room.players // Send updated player list with new scores
      });
      room.ready.clear(); // Prepare for next round's ready check
    } else {
      // WRONG GUESS: Notify only the player who guessed
      socket.emit('guessResult', { wasCorrect: false });

      // If all players have guessed wrong, end the round
      if (room.guessed.size === room.players.length) {
        io.to(roomId).emit('roundOver', {
          winnerId: null,
          guess: "No one guessed correctly",
          players: room.players // Send unchanged player list
        });
        room.ready.clear();
      }
    }
  });

  // --- REVISED PLAYER READY LOGIC ---
  socket.on('playerReady', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.ready.add(socket.id);

    if (room.ready.size === room.players.length) {
      // All players are ready
      if (room.currentRound >= room.totalRounds) {
        // GAME OVER
        io.to(roomId).emit('gameOver', { players: room.players });
        delete rooms[roomId];
      } else {
        // NEXT ROUND
        room.currentRound++;
        room.guessed.clear(); // Clear guessed set for the new round
        io.to(roomId).emit('startNextRound', {
          round: room.currentRound
        });
        room.ready.clear();
      }
    }
  });

  socket.on('setUsername', ({ username }) => {
    // Find the room this socket is in
    const roomId = Object.keys(rooms).find(rid =>
      rooms[rid].players.some(p => p.id === socket.id)
    );
    if (roomId) {
      const player = rooms[roomId].players.find(p => p.id === socket.id);
      if (player) {
        player.username = username;
        // Notify all clients in the room
        io.to(roomId).emit('playersUpdated', { players: rooms[roomId].players });
      }
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});