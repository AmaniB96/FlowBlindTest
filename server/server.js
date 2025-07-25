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
      rooms[roomId].guessed = new Set();
      rooms[roomId].currentRound = 1;
      rooms[roomId].totalRounds = songs.length; // or 10 if you always want 10 rounds
    }
    console.log(`Game started in room ${roomId}`);
  });

  // Add these helper functions at the top of your file:
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

  // Replace your submitGuess handler with:
  socket.on('submitGuess', ({ roomId, guess, song, playerTime, gameMode = 'both' }) => {
    if (!song || !guess || !rooms[roomId]) return;

    // --- scoring logic as before ---
    const typoThreshold = (answer) => answer.length <= 6 ? 2 : 3;
    const userGuess = normalize(guess);
    const artistName = normalize(song.artist?.name || '');
    const songTitle = normalize(song.title || '');

    let roundScore = 0;
    let correctSong = false;
    let correctArtist = false;

    if (gameMode === 'both') {
      if (levenshtein(userGuess, songTitle) <= typoThreshold(songTitle)) {
        roundScore += 5;
        correctSong = true;
      }
      if (levenshtein(userGuess, artistName) <= typoThreshold(artistName)) {
        roundScore += 5;
        correctArtist = true;
      }
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

    // --- NEW LOGIC: Track guesses ---
    if (!rooms[roomId].guessed) {
      rooms[roomId].guessed = new Set();
    }
    rooms[roomId].guessed.add(socket.id);

    // If correct, end round for all
    if (roundScore > 0) {
      rooms[roomId].ready.clear();
      io.to(roomId).emit('roundOver', {
        winnerId: socket.id,
        guess,
        time: playerTime,
        correctSong,
        correctArtist,
        score: roundScore
      });
      // Reset guessed set for next round
      rooms[roomId].guessed.clear();
      return;
    }

    // If all players have guessed and no one was correct, end round (no winner)
    if (rooms[roomId].guessed.size === rooms[roomId].players.length) {
      rooms[roomId].ready.clear();
      io.to(roomId).emit('roundOver', {
        winnerId: null,
        guess,
        time: playerTime,
        correctSong: false,
        correctArtist: false,
        score: 0
      });
      rooms[roomId].guessed.clear();
      return;
    }

    // If guess was wrong and not all players have guessed, do nothing (let the other player try)
    // Optionally, you can emit a "guessResult" event to just the player who guessed, if you want feedback
    socket.emit('guessResult', { correctSong: false, correctArtist: false, score: 0 });
  });

  // --- ADD THIS NEW EVENT HANDLER ---
  socket.on('playerReady', ({ roomId }) => {
    if (!rooms[roomId]) return;

    console.log(`Player ${socket.id} is ready in room ${roomId}`);
    rooms[roomId].ready.add(socket.id);

    if (rooms[roomId].ready.size === rooms[roomId].players.length) {
      // All players are ready for the next round
      const room = rooms[roomId];
      if (room.currentRound >= room.totalRounds) {
        // Game over!
        io.to(roomId).emit('gameOver', {
          players: room.players
        });
        delete rooms[roomId]; // Clean up room
        console.log(`Game over in room ${roomId}`);
      } else {
        // Next round
        room.currentRound += 1;
        io.to(roomId).emit('startNextRound');
        room.ready.clear();
        console.log(`Starting round ${room.currentRound} in room ${roomId}`);
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