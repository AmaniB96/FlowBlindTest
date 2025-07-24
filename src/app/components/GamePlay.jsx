'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import useGameStore, { normalize, levenshtein } from '../store/gameStore'
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
    playedSongIds, // <-- Get the set of played songs
    setTimeLeft,
    setCurrentSong,
    setUserGuess,
    submitGuess,
    setIsPlaying,
    nextRound,
    resetGame
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
    const fetchUniqueSongs = async () => {
      try {
        // Fetch more songs than needed to have a buffer for filtering
        const songsToFetch = totalRounds + 20;
        const response = await fetch(
          `/api/blindtest?category=${selectedCategory}&difficulty=${difficulty}&count=${songsToFetch}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch songs')
        }
        
        const data = await response.json()
        if (!data.songs || data.songs.length === 0) {
          throw new Error('No songs returned from API for this category.')
        }

        // Filter out songs that have already been played in this session
        const availableSongs = data.songs.filter(song => !playedSongIds.has(song.id));

        if (availableSongs.length < totalRounds) {
          // This can happen if the user plays many games in the same category
          // and exhausts the playlist.
          setError('Not enough unique songs available for a new game. Please try another category or reset the session.');
          setLoading(false);
          return;
        }

        // Take the required number of unique songs for the game
        setSongs(availableSongs.slice(0, totalRounds));

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUniqueSongs()
  }, []) // This effect should only run once when the game starts

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

  // Load next song when round changes or songs are loaded
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

  const handleQuit = () => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
    }
    // Clear any pending timer to prevent state updates after unmounting
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    // Reset the game state to return to the landing page
    resetGame()
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

  // --- FIX: Move all rendering logic after the guards ---

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

  // --- FIX: Add a guard to ensure currentSong is loaded before proceeding ---
  if (!currentSong) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading round...</p>
      </div>
    );
  }

  // This logic is now SAFE because we know currentSong exists.
  const typoThreshold = (answer) => answer.length <= 6 ? 2 : 3;
  const guess = normalize(userGuess);
  const artistName = normalize(currentSong.artist.name);
  const songTitle = normalize(currentSong.title);

  const isCorrect = (
    levenshtein(guess, artistName) <= typoThreshold(artistName) ||
    guess.includes(artistName)
  );

  return (
    <div className={styles.container}>
      {/* Header with game info */}
      <div className={styles.header}>
        <button onClick={handleQuit} className={styles.quitButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quit
        </button>
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