import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

// Use the environment variable for the server URL
const SOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const useGameStore = create(
  persist(
    (set, get) => ({
      // --- Game State (will NOT be persisted) ---
      gameState: 'landing', // 'landing', 'category-select', 'difficulty-select', 'playing', 'results', 'game-over'
      currentRound: 0,
      totalRounds: 10,
      score: 0,
      timeLeft: 30,
      currentSong: null,
      userGuess: '',
      roundResults: [],
      gameResults: null,
      playedSongIds: new Set(), // <-- Add state to track played song IDs
      
      // --- Persisted State (will be saved in localStorage) ---
      artistGridData: [],
      isArtistGridLoaded: false,
      totalGamesPlayed: 0,
      bestScore: 0,
      averageScore: 0,

      // --- NEW MULTIPLAYER STATE ---
      gameType: 'solo', // 'solo' or 'multiplayer'
      roomId: null,
      players: [], // e.g., [{ id, username, score }]
      socket: null, // To hold the socket instance
      username: '',
      
      // --- NEW STATE to track if user has guessed
      hasGuessedThisRound: false, 

      // --- Actions ---
      setGameState: (state) => set({ gameState: state }),
      
      setGameSettings: (category, difficulty, gameMode) => set({
        selectedCategory: category,
        difficulty,
        gameMode
      }),
      
      // This is for starting a SOLO game
      startSoloGame: () => set({
        gameState: 'playing',
        currentRound: 1,
        score: 0,
        roundResults: [],
        timeLeft: 30
      }),
      
      nextRound: () => {
        const { currentRound, totalRounds } = get()
        if (currentRound >= totalRounds) {
          set({ gameState: 'game-over' })
        } else {
          set({
            gameState: 'playing', // <-- This is the crucial fix
            currentRound: currentRound + 1,
            timeLeft: 30,
            userGuess: '',
            currentSong: null,
            isPlaying: false,
          })
        }
      },
      
      setCurrentSong: (song) => {
        if (song) {
          // Add the new song's ID to the set of played songs for this session
          const { playedSongIds } = get();
          const newPlayedSongIds = new Set(playedSongIds).add(song.id);
          set({ currentSong: song, playedSongIds: newPlayedSongIds });
        } else {
          set({ currentSong: null });
        }
      },
      
      setUserGuess: (guess) => set({ userGuess: guess }),
      
      setTimeLeft: (time) => set({ timeLeft: time }),
      
      submitGuess: () => {
        const { userGuess, currentSong, gameMode, roundResults, score } = get()

        if (!currentSong) return

        const guess = normalize(userGuess)
        const songTitle = normalize(currentSong.title)
        const artistName = normalize(currentSong.artist.name)
        const typoThreshold = (answer) => answer.length <= 6 ? 2 : 3

        let roundScore = 0
        let correctSong = false
        let correctArtist = false

        if (gameMode === 'both') {
          if (levenshtein(guess, songTitle) <= typoThreshold(songTitle)) {
            roundScore += 5
            correctSong = true
          }
          if (levenshtein(guess, artistName) <= typoThreshold(artistName)) {
            roundScore += 5
            correctArtist = true
          }
        } else if (gameMode === 'song') {
          if (levenshtein(guess, songTitle) <= typoThreshold(songTitle) || guess.includes(songTitle)) {
            roundScore += 10
            correctSong = true
          }
        } else if (gameMode === 'artist') {
          if (levenshtein(guess, artistName) <= typoThreshold(artistName) || guess.includes(artistName)) {
            roundScore += 10
            correctArtist = true
          }
        }

        set({
          // Add the boolean flags to the results object
          roundResults: [...roundResults, { 
            userGuess, 
            currentSong, 
            score: roundScore, // Use 'score' to match RoundResults.jsx
            correctSong, 
            correctArtist 
          }],
          score: score + roundScore,
          gameState: 'results'
        })
      },
      
      setAudioElement: (audio) => set({ audioElement: audio }),
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      resetGame: () => set({
        gameState: 'landing',
        currentRound: 0,
        score: 0,
        timeLeft: 30,
        currentSong: null,
        userGuess: '',
        roundResults: [],
        gameResults: null,
        isPlaying: false,
        playedSongIds: new Set() // <-- Reset played songs for a new session
      }),
      
      updateUserProgress: () => {
        const { score, totalGamesPlayed, bestScore } = get()
        set({
          totalGamesPlayed: totalGamesPlayed + 1,
          bestScore: Math.max(bestScore, score),
          averageScore: ((get().averageScore * totalGamesPlayed) + score) / (totalGamesPlayed + 1)
        })
      },

      // Action to cache artist grid data
      setArtistGridData: (data) => set({ artistGridData: data, isArtistGridLoaded: true }),

      // --- NEW MULTIPLAYER ACTIONS ---
      setGameType: (type) => set({ gameType: type }),
      
      initializeSocket: () => {
        const { socket } = get();
        if (socket && socket.connected) return socket;

        if (socket) {
          socket.disconnect();
        }

        // Connect to the correct URL (local or production)
        const newSocket = io(SOCKET_URL);
        
        newSocket.on('connect', () => {
          console.log(`Connected to WebSocket server at ${SOCKET_URL} with ID:`, newSocket.id);
        });

        newSocket.on('playerJoined', ({ players }) => {
          set({ players });
        });

        // --- ADD THIS NEW LISTENER ---
        // Listens for settings updates broadcasted by the server
        newSocket.on('settingsUpdated', ({ category, difficulty }) => {
          console.log('Received settings update from host:', { category, difficulty });
          set({ selectedCategory: category, difficulty });
        });

        // --- REVISED roundOver LISTENER ---
        newSocket.on('roundOver', ({ winnerId, guess, correctSong, correctArtist, players }) => {
          // The server is the source of truth for scores.
          // We just update our local state to match.
          set(state => ({
            players: players, // Update the entire player list
            roundResults: [
              ...state.roundResults,
              {
                userGuess: guess,
                currentSong: state.currentSong,
                // Score for this round is derived, not added directly
                score: players.find(p => p.id === winnerId)?.score - (state.players.find(p => p.id === winnerId)?.score || 0),
                correctSong: !!correctSong,
                correctArtist: !!correctArtist,
              }
            ],
            gameState: 'results'
          }));
        });

        // --- NEW guessResult LISTENER ---
        newSocket.on('guessResult', ({ wasCorrect }) => {
          if (!wasCorrect) {
            set({ hasGuessedThisRound: true }); // Lock input on wrong guess
            toast.error("Incorrect. Waiting for opponent...");
          }
        });

        // --- REVISED startNextRound LISTENER ---
        newSocket.on('startNextRound', ({ round }) => {
          const { gameType, multiplayerSongList } = get();
          if (gameType === 'multiplayer') {
            const nextSong = multiplayerSongList[round - 1];
            set({
              gameState: 'playing',
              currentRound: round,
              currentSong: nextSong,
              userGuess: '',
              timeLeft: 30,
              hasGuessedThisRound: false, // <-- Reset guess lock for new round
            });
          }
        });

        newSocket.on('gameStarted', ({ songs }) => {
          // This is where you would sync the game start for all players
          console.log('Game starting with songs:', songs);
          // Set the full game state needed to begin playing
          set({ 
            gameState: 'playing',
            roundResults: [], // Clear previous results
            currentRound: 1,
            score: 0,
            timeLeft: 30,
            // The server sends the whole song list, we start with the first one
            currentSong: songs[0], 
            // You might want to store the full list for subsequent rounds
            multiplayerSongList: songs 
          });
        });

        newSocket.on('playerLeft', () => {
          toast.error('Your opponent has disconnected. The game has ended.'); // <-- Replaced alert
          get().resetGame();
        });

        // --- ADD THIS NEW LISTENER ---
        newSocket.on('gameOver', (data) => {
          set({
            gameState: 'game-over',
            gameResults: data,
          });
        });

        // --- ADD THIS NEW LISTENER ---
        newSocket.on('playersUpdated', ({ players }) => {
          set({ players });
        });

        set({ socket: newSocket });
        return newSocket;
      },

      // --- ADD THIS NEW ACTION ---
      setMultiplayerSettings: ({ category, difficulty }) => {
        const { socket, roomId, selectedCategory, difficulty: currentDifficulty } = get();
        
        const newCategory = category !== undefined ? category : selectedCategory;
        const newDifficulty = difficulty !== undefined ? difficulty : currentDifficulty;

        // Update local state immediately for the host
        set({ selectedCategory: newCategory, difficulty: newDifficulty });

        // Tell the server about the change so it can notify the other player
        if (socket && roomId) {
          socket.emit('settingsChanged', { roomId, category: newCategory, difficulty: newDifficulty });
        }
      },

      createRoom: () => {
        const socket = get().initializeSocket();
        const username = `Player1`; // Or get from user input
        socket.emit('createRoom', (newRoomId) => {
          set({ 
            roomId: newRoomId, 
            gameState: 'lobby', 
            players: [{ id: socket.id, username }] 
          });
        });
      },

      joinRoom: (roomId, callback) => {
        const socket = get().initializeSocket();
        const username = `Player2`; // Or get from user input
        socket.emit('joinRoom', { roomId, username }, (response) => {
          if (response.status === 'ok') {
            set({ roomId, players: response.players, gameState: 'lobby' });
          }
          if (callback) callback(response);
        });
      },

      // This is for starting a MULTIPLAYER game from the lobby
      startMultiplayerGame: async () => {
        const { roomId, socket, selectedCategory, difficulty } = get();
        
        const category = selectedCategory;
        const diff = difficulty;

        if (!category || !diff) {
            toast.error("Please select a category and difficulty before starting."); // <-- Replaced alert
            return;
        }
        
        try {
          const response = await fetch(`/api/blindtest?category=${category}&difficulty=${diff}&count=10`);
          const data = await response.json();

          if (!response.ok || !data.songs) {
            throw new Error('Failed to fetch songs from API.');
          }
          
          socket.emit('startGame', { roomId, songs: data.songs });
        } catch (error) {
          console.error("Error starting multiplayer game:", error);
          toast.error("Error: Could not start the game. Please try again."); // <-- Replaced alert
        }
      },

      // --- ADD THIS NEW ACTION ---
      signalReadyForNextRound: () => {
        const { socket, roomId } = get();
        if (socket && roomId) {
          // Tell the server this client is ready
          socket.emit('playerReady', { roomId });
          // Put the local client into a waiting state
          set({ gameState: 'waiting-for-opponent' });
        }
      },

      nextRound: () => {
        const { currentRound, totalRounds, gameType, multiplayerSongList } = get();

        if (currentRound >= totalRounds) {
          get().updateUserProgress();
          set({ gameState: 'game-over' });
          return;
        }

        // --- MODIFY for MULTIPLAYER ---
        if (gameType === 'multiplayer') {
          const nextRoundNumber = currentRound + 1;
          const nextSong = multiplayerSongList[nextRoundNumber - 1];
          set({
            currentRound: nextRoundNumber,
            currentSong: nextSong,
            userGuess: '',
            timeLeft: 30,
          });
        } else {
          // Existing solo logic
          // ...
        }
      },
      
      submitMultiplayerGuess: () => {
        const { userGuess, currentSong, socket, roomId, timeLeft } = get();
        if (!userGuess.trim() || !currentSong || !socket || !roomId) return;
        socket.emit('submitGuess', {
          roomId,
          guess: userGuess,
          song: currentSong,
          playerTime: timeLeft,
        });
        set({ userGuess: '' }); // Clear input after submitting
      },
      
      setUsername: (username) => set({ username }),
      // ... (rest of the store) ...
    }),
    {
      name: 'flowblindtest-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist the properties you want to save
      partialize: (state) => ({
        artistGridData: state.artistGridData,
        isArtistGridLoaded: state.isArtistGridLoaded,
        totalGamesPlayed: state.totalGamesPlayed,
        bestScore: state.bestScore,
        averageScore: state.averageScore,
      }),
    }
  )
)

export { normalize, levenshtein }
export default useGameStore