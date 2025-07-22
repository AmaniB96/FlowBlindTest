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
        currentRound: currentRound + 1,
        timeLeft: 30,
        userGuess: '',
        currentSong: null
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
    
    if (gameMode === 'song' || gameMode === 'both') {
      correctSong = userGuess.toLowerCase().includes(currentSong.title.toLowerCase()) ||
                   currentSong.title.toLowerCase().includes(userGuess.toLowerCase())
      if (correctSong) roundScore += gameMode === 'both' ? 5 : 10
    }
    
    if (gameMode === 'artist' || gameMode === 'both') {
      correctArtist = userGuess.toLowerCase().includes(currentSong.artist.name.toLowerCase()) ||
                     currentSong.artist.name.toLowerCase().includes(userGuess.toLowerCase())
      if (correctArtist) roundScore += gameMode === 'both' ? 5 : 10
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
  }
}))

export default useGameStore