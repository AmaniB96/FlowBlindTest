'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import useGameStore from '../store/gameStore'
import styles from './GameOver.module.css'

function GameOver() {
  const {
    score,
    totalRounds,
    roundResults,
    selectedCategory,
    difficulty,
    gameMode,
    bestScore,
    totalGamesPlayed,
    resetGame,
    updateUserProgress,
    setGameState
  } = useGameStore()

  const [showDetailed, setShowDetailed] = useState(false)
  const [newBestScore, setNewBestScore] = useState(false)

  const maxPossibleScore = totalRounds * (gameMode === 'both' ? 10 : 10)
  const percentage = Math.round((score / maxPossibleScore) * 100)
  const correctRounds = roundResults.filter(r => r.correctSong || r.correctArtist).length

  useEffect(() => {
    // Check if this is a new best score
    if (score > bestScore) {
      setNewBestScore(true)
    }
    // Update user progress
    updateUserProgress()
  }, [score, bestScore, updateUserProgress])

  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Legendary', emoji: '🏆', color: 'var(--accent-success)' }
    if (percentage >= 75) return { level: 'Excellent', emoji: '🎵', color: 'var(--accent-primary)' }
    if (percentage >= 60) return { level: 'Good', emoji: '👍', color: 'var(--accent-warning)' }
    if (percentage >= 40) return { level: 'Fair', emoji: '🤔', color: 'var(--accent-warning)' }
    return { level: 'Keep Practicing', emoji: '💪', color: 'var(--accent-error)' }
  }

  const performance = getPerformanceLevel()

  const handlePlayAgain = () => {
    resetGame()
    setGameState('category-select')
  }

  const handleBackToHome = () => {
    resetGame()
    setGameState('landing')
  }

  const formatGameMode = (mode) => {
    switch (mode) {
      case 'song': return 'Song Title Only'
      case 'artist': return 'Artist Name Only'
      case 'both': return 'Song & Artist'
      default: return mode
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameOverCard}>
        {/* Header */}
        <div className={styles.header}>
          {newBestScore && (
            <div className={styles.newRecordBanner}>
              🎉 NEW BEST SCORE! 🎉
            </div>
          )}
          
          <div className={styles.performanceIcon} style={{ color: performance.color }}>
            {performance.emoji}
          </div>
          
          <h1 className={styles.title}>Game Complete!</h1>
          <h2 className={styles.performanceLevel} style={{ color: performance.color }}>
            {performance.level}
          </h2>
        </div>

        {/* Score Summary */}
        <div className={styles.scoreSection}>
          <div className={styles.mainScore}>
            <span className={styles.scoreValue}>{score}</span>
            <span className={styles.scoreMax}>/ {maxPossibleScore}</span>
          </div>
          
          <div className={styles.scoreDetails}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{correctRounds}</span>
              <span className={styles.statLabel}>Correct Rounds</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{percentage}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
          </div>
        </div>

        {/* Game Settings Summary */}
        <div className={styles.gameSettings}>
          <h3>Game Settings</h3>
          <div className={styles.settingsGrid}>
            <div className={styles.settingItem}>
              <span className={styles.settingLabel}>Category:</span>
              <span className={styles.settingValue}>{selectedCategory}</span>
            </div>
            <div className={styles.settingItem}>
              <span className={styles.settingLabel}>Difficulty:</span>
              <span className={styles.settingValue}>{difficulty}</span>
            </div>
            <div className={styles.settingItem}>
              <span className={styles.settingLabel}>Mode:</span>
              <span className={styles.settingValue}>{formatGameMode(gameMode)}</span>
            </div>
          </div>
        </div>

        {/* Detailed Results Toggle */}
        <button 
          className={styles.toggleButton}
          onClick={() => setShowDetailed(!showDetailed)}
        >
          {showDetailed ? 'Hide' : 'Show'} Detailed Results
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ transform: showDetailed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        {/* Detailed Results */}
        {showDetailed && (
          <div className={styles.detailedResults}>
            <h3>Round by Round</h3>
            <div className={styles.roundsList}>
              {roundResults.map((result, index) => (
                <div key={index} className={styles.roundItem}>
                  <div className={styles.roundHeader}>
                    <span className={styles.roundNumber}>Round {result.round}</span>
                    <span 
                      className={styles.roundScore}
                      style={{ 
                        color: result.score > 0 ? 'var(--accent-success)' : 'var(--accent-error)' 
                      }}
                    >
                      +{result.score}
                    </span>
                  </div>
                  
                  <div className={styles.roundContent}>
                    <div className={styles.songInfo}>
                      <Image
                        src={result.song.album.cover}
                        alt={result.song.album.title}
                        width={40}
                        height={40}
                        className={styles.miniCover}
                      />
                      <div className={styles.songText}>
                        <span className={styles.songTitle}>{result.song.title}</span>
                        <span className={styles.artistName}>{result.song.artist.name}</span>
                      </div>
                    </div>
                    
                    <div className={styles.guessInfo}>
                      <span className={styles.guessLabel}>Your guess:</span>
                      <span className={styles.userGuess}>
                        {result.userGuess || <em>No guess</em>}
                      </span>
                    </div>

                    {gameMode === 'both' && (
                      <div className={styles.resultBreakdown}>
                        <span className={`${styles.resultItem} ${result.correctSong ? styles.correct : styles.incorrect}`}>
                          Song: {result.correctSong ? '✓' : '✗'}
                        </span>
                        <span className={`${styles.resultItem} ${result.correctArtist ? styles.correct : styles.incorrect}`}>
                          Artist: {result.correctArtist ? '✓' : '✗'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Stats */}
        <div className={styles.personalStats}>
          <h3>Your Stats</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalGamesPlayed + 1}</span>
              <span className={styles.statDescription}>Games Played</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{Math.max(bestScore, score)}</span>
              <span className={styles.statDescription}>Best Score</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button className={styles.playAgainButton} onClick={handlePlayAgain}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Play Again
          </button>
          
          <button className={styles.homeButton} onClick={handleBackToHome}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOver