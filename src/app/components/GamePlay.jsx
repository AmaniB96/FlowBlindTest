'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import useGameStore from '../store/gameStore'
import styles from './GamePlay.module.css'

function GamePlay() {
  const {
    currentRound,
    totalRounds,
    score,
    timeLeft,
    currentSong,
    userGuess,
    selectedCategory,
    difficulty,
    gameMode,
    isPlaying,
    setTimeLeft,
    setCurrentSong,
    setUserGuess,
    submitGuess,
    setIsPlaying,
    nextRound
  } = useGameStore()

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch songs for the game
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/blindtest?category=${selectedCategory}&difficulty=${difficulty}&count=${totalRounds}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch songs')
        }
        
        const data = await response.json()
        setSongs(data.songs)
        
        if (data.songs.length > 0) {
          setCurrentSong(data.songs[0])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [selectedCategory, difficulty, totalRounds, setCurrentSong])

  // Timer countdown
  useEffect(() => {
    if (hasStarted && timeLeft > 0 && !loading) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && hasStarted) {
      handleTimeUp()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeLeft, hasStarted, loading])

  // Load next song when round changes
  useEffect(() => {
    if (songs.length > 0 && currentRound > 0) {
      const songIndex = currentRound - 1
      if (songIndex < songs.length) {
        setCurrentSong(songs[songIndex])
        setHasStarted(false)
        setTimeLeft(30)
        setUserGuess('')
        setIsPlaying(false)
      }
    }
  }, [currentRound, songs, setCurrentSong, setTimeLeft, setUserGuess, setIsPlaying])

  const handleStartRound = () => {
    if (currentSong && audioRef.current) {
      setHasStarted(true)
      audioRef.current.play()
      setIsPlaying(true)
      inputRef.current?.focus()
    }
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (userGuess.trim()) {
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      submitGuess()
    }
  }

  const handleTimeUp = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    submitGuess()
  }

  const handleSkip = () => {
    handleTimeUp()
  }

  const getGameModeInstructions = () => {
    switch (gameMode) {
      case 'song':
        return 'Guess the song title'
      case 'artist':
        return 'Guess the artist name'
      case 'both':
        return 'Guess the song title and/or artist name'
      default:
        return 'Guess the song or artist'
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your blindtest...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header with game info */}
      <div className={styles.header}>
        <div className={styles.gameInfo}>
          <span className={styles.round}>Round {currentRound} / {totalRounds}</span>
          <span className={styles.score}>Score: {score}</span>
        </div>
        
        <div className={styles.timer}>
          <div 
            className={styles.timerBar}
            style={{ 
              width: `${(timeLeft / 30) * 100}%`,
              backgroundColor: timeLeft <= 10 ? 'var(--accent-error)' : 'var(--accent-primary)'
            }}
          ></div>
          <span className={styles.timerText}>{timeLeft}s</span>
        </div>
      </div>

      {/* Main game area */}
      <div className={styles.gameArea}>
        {!hasStarted ? (
          <div className={styles.startScreen}>
            <div className={styles.instructions}>
              <h2>Round {currentRound}</h2>
              <p>{getGameModeInstructions()}</p>
              <p className={styles.categoryInfo}>
                Category: <span>{selectedCategory}</span> | 
                Difficulty: <span>{difficulty}</span>
              </p>
            </div>
            <button className={styles.startButton} onClick={handleStartRound}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
              </svg>
              Start Round
            </button>
          </div>
        ) : (
          <div className={styles.playingArea}>
            {/* Audio controls */}
            <div className={styles.audioControls}>
              <button 
                className={styles.playButton}
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
                  </svg>
                )}
              </button>
              
              <div className={styles.audioInfo}>
                <div className={styles.soundWaves}>
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`${styles.wave} ${isPlaying ? styles.animate : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
                <p>Listen carefully...</p>
              </div>
            </div>

            {/* Guess input */}
            <form className={styles.guessForm} onSubmit={handleSubmit}>
              <div className={styles.inputContainer}>
                <input
                  ref={inputRef}
                  type="text"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  placeholder={getGameModeInstructions()}
                  className={styles.guessInput}
                  disabled={timeLeft === 0}
                />
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={!userGuess.trim() || timeLeft === 0}
                >
                  Submit
                </button>
              </div>
            </form>

            {/* Skip button */}
            <button className={styles.skipButton} onClick={handleSkip}>
              Skip Round
            </button>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.preview}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
        />
      )}
    </div>
  )
}

export default GamePlay