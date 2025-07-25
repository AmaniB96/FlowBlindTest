'use client'

import { useEffect, useRef } from 'react'
import useGameStore from '../store/gameStore'
import styles from './GamePlay.module.css' // We can reuse the same styles for now

function GamePlayMultiplayer() {
  const {
    gameState, // <-- Get the gameState
    currentRound,
    totalRounds,
    timeLeft,
    currentSong,
    userGuess,
    players,
    socket,
    setUserGuess,
    submitMultiplayerGuess,
    resetGame,
    hasGuessedThisRound,
  } = useGameStore()

  const audioRef = useRef(null)
  const inputRef = useRef(null)

  // --- THE FIX ---
  // This effect now runs when the component mounts in a 'playing' state,
  // or when the currentSong changes while already playing.
  useEffect(() => {
    if (gameState === 'playing' && currentSong && audioRef.current) {
      audioRef.current.currentTime = 0; // Ensure song starts from the beginning
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      inputRef.current?.focus();
    }
  }, [currentSong, gameState]); // <-- Add gameState to the dependency array

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
                disabled={timeLeft === 0 || hasGuessedThisRound}
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