import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware' // <-- Import persist

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
  persist( // <-- Wrap your store definition
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

      // --- Actions ---
      setGameState: (state) => set({ gameState: state }),
      
      setGameSettings: (category, difficulty, gameMode) => set({
        selectedCategory: category,
        difficulty,
        gameMode
      }),
      
      startGame: () => set({
        gameState: 'playing',
        currentRound: 1,
        score: 0,
        roundResults: [],
        timeLeft: 30
        // Note: playedSongIds is NOT reset here to prevent repeats across games
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
    }),
    {
      name: 'flowblindtest-storage', // Name for the localStorage item
      storage: createJSONStorage(() => localStorage), // Specify localStorage
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