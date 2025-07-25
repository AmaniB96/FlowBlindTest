'use client'

import { useEffect, useRef } from 'react'
import useGameStore from '../store/gameStore'
import styles from './GamePlay.module.css' // We can reuse the same styles for now

function GamePlayMultiplayer() {
  const {
    currentRound,
    totalRounds,
    // score, // <-- We will no longer use the global score here
    timeLeft,
    currentSong,
    userGuess,
    players, // We will use this to find the correct score
    socket,  // We need this to identify the current player
    setUserGuess,
    submitMultiplayerGuess,
    resetGame,
    hasGuessedThisRound,
  } = useGameStore()

  const audioRef = useRef(null)
  const inputRef = useRef(null)

  // In multiplayer, we just play the song when it's provided by the store
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      inputRef.current?.focus();
    }
  }, [currentSong]);

  // The timer would ideally be synced from the server, but for now, we can run it client-side
  useEffect(() => {
    // Timer logic here...
  }, [timeLeft]);

  const handleSubmit = (e) => {
    e.preventDefault()
    if (userGuess.trim() && !hasGuessedThisRound) { // Check the lock
      submitMultiplayerGuess()
      // Don't clear the input here, let the user see what they guessed
    }
  }

  const handleQuit = () => {
    socket?.disconnect();
    resetGame();
  }

  // --- FIX: Find the current player's score ---
  const currentPlayer = players.find(p => p.id === socket?.id);
  const currentPlayerScore = currentPlayer ? currentPlayer.score : 0;

  if (!currentSong) {
    return (
      <div className={styles.loadingContainer}>
        <p>Waiting for game to start...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleQuit} className={styles.quitButton}>Quit</button>
        <div className={styles.gameInfo}>
          <span className={styles.round}>Round {currentRound} / {totalRounds}</span>
          {/* --- FIX: Use the correct score variable --- */}
          <span className={styles.score}>Score: {currentPlayerScore}</span>
        </div>
        <div className={styles.timer}>
          <span className={styles.timerText}>{timeLeft}s</span>
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.playingArea}>
          <p>Listen and guess!</p>
          <form className={styles.guessForm} onSubmit={handleSubmit}>
            <div className={styles.inputContainer}>
              <input
                ref={inputRef}
                type="text"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                placeholder="Guess the song or artist"
                className={styles.guessInput}
                disabled={timeLeft === 0 || hasGuessedThisRound} // <-- DISABLE on guess
              />
              <button type="submit" className={styles.submitButton} disabled={timeLeft === 0 || hasGuessedThisRound}>
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentSong.preview}
        preload="auto"
      />
    </div>
  )
}

export default GamePlayMultiplayer