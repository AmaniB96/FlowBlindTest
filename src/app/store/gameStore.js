import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // Game State
  gameState: 'landing', // 'landing', 'category-select', 'difficulty-select', 'playing', 'results', 'game-over'
  currentRound: 0,
  totalRounds: 10,
  score: 0,
  timeLeft: 30,
  currentSong: null,
  userGuess: '',
  roundResults: [],
  gameResults: null,
  
  // Game Settings
  selectedCategory: null,
  difficulty: 'medium', // 'easy', 'medium', 'hard'
  gameMode: 'both', // 'song', 'artist', 'both'
  
  // Audio State
  isPlaying: false,
  audioElement: null,
  
  // User Progress
  totalGamesPlayed: 0,
  bestScore: 0,
  averageScore: 0,

  // Artist Grid Cache
  artistGridData: [],
  isArtistGridLoaded: false,
  
  // Actions
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
  
  setCurrentSong: (song) => set({ currentSong: song }),
  
  setUserGuess: (guess) => set({ userGuess: guess }),
  
  setTimeLeft: (time) => set({ timeLeft: time }),
  
  submitGuess: () => {
    const { userGuess, currentSong, gameMode, roundResults, score } = get()
    
    let roundScore = 0
    let correctSong = false
    let correctArtist = false
    
    const trimmedGuess = userGuess.trim().toLowerCase();

    if (trimmedGuess) { // <-- This check prevents scoring on empty/skipped guesses
      if (gameMode === 'song' || gameMode === 'both') {
        correctSong = currentSong.title.toLowerCase().includes(trimmedGuess) ||
                     trimmedGuess.includes(currentSong.title.toLowerCase())
        if (correctSong) roundScore += gameMode === 'both' ? 5 : 10
      }
      
      if (gameMode === 'artist' || gameMode === 'both') {
        correctArtist = currentSong.artist.name.toLowerCase().includes(trimmedGuess) ||
                       trimmedGuess.includes(currentSong.artist.name.toLowerCase())
        if (correctArtist) roundScore += gameMode === 'both' ? 5 : 10
      }
    }
    
    const result = {
      round: get().currentRound,
      song: currentSong,
      userGuess,
      correctSong,
      correctArtist,
      score: roundScore,
      timeLeft: get().timeLeft
    }
    
    set({
      roundResults: [...roundResults, result],
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
    isPlaying: false
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
}))

export default useGameStore