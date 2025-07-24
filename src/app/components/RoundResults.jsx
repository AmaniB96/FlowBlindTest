'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import useGameStore from '../store/gameStore'
import styles from './RoundResults.module.css'

function RoundResults() {
  const {
    currentRound,
    totalRounds,
    score,
    roundResults,
    currentSong,
    userGuess,
    gameMode,
    nextRound,
    signalReadyForNextRound
  } = useGameStore()

  const currentResult = roundResults[roundResults.length - 1]
  const isCorrect = currentResult?.correctSong || currentResult?.correctArtist
  const roundScore = currentResult?.score || 0

  const getResultMessage = () => {
    if (!currentResult) return ''

    const { correctSong, correctArtist } = currentResult

    if (gameMode === 'both') {
      if (correctSong && correctArtist) {
        return 'Perfect! Both song and artist correct!'
      } else if (correctSong) {
        return 'Good! Song title correct!'
      } else if (correctArtist) {
        return 'Good! Artist name correct!'
      } else {
        return 'Not quite right this time.'
      }
    } else if (gameMode === 'song') {
      return correctSong ? 'Correct song!' : 'Wrong song.'
    } else if (gameMode === 'artist') {
      return correctArtist ? 'Correct artist!' : 'Wrong artist.'
    }

    return ''
  }

  const getScoreColor = () => {
    if (roundScore === 0) return 'var(--accent-error)'
    if (roundScore >= 10) return 'var(--accent-success)'
    return 'var(--accent-warning)'
  }

  const handleNext = () => {
    // This now tells the server we are ready and puts us in a waiting state.
    signalReadyForNextRound()
  }

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        {/* Result Header */}
        <div className={styles.header}>
          <div className={`${styles.resultIcon} ${isCorrect ? styles.correct : styles.incorrect}`}>
            {isCorrect ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </div>
          <h2 className={styles.resultMessage}>{getResultMessage()}</h2>
          <div className={styles.scoreDisplay} style={{ color: getScoreColor() }}>
            +{roundScore} points
          </div>
        </div>

        {/* Song Information */}
        <div className={styles.songInfo}>
          <div className={styles.albumCover}>
            <Image
              src={currentSong?.album?.cover || '/placeholder-album.png'}
              alt={currentSong?.album?.title || 'Album cover'}
              width={200}
              height={200}
              className={styles.coverImage}
            />
          </div>
          
          <div className={styles.songDetails}>
            <h3 className={styles.songTitle}>{currentSong?.title}</h3>
            <p className={styles.artistName}>{currentSong?.artist?.name}</p>
            <p className={styles.albumName}>{currentSong?.album?.title}</p>
          </div>
        </div>

        {/* User's Guess */}
        <div className={styles.guessSection}>
          <h4>Your guess:</h4>
          <p className={styles.userGuess}>
            {userGuess || <em>No guess submitted</em>}
          </p>
        </div>

        {/* Correct Answers Breakdown (for 'both' mode) */}
        {gameMode === 'both' && currentResult && (
          <div className={styles.breakdown}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Song:</span>
              <span className={`${styles.breakdownStatus} ${currentResult.correctSong ? styles.correct : styles.incorrect}`}>
                {currentResult.correctSong ? '✓' : '✗'}
              </span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Artist:</span>
              <span className={`${styles.breakdownStatus} ${currentResult.correctArtist ? styles.correct : styles.incorrect}`}>
                {currentResult.correctArtist ? '✓' : '✗'}
              </span>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className={styles.progress}>
          <div className={styles.progressInfo}>
            <span>Round {currentRound} of {totalRounds}</span>
            <span>Total Score: {score}</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(currentRound / totalRounds) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Next Round Button */}
        <div className={styles.actions}>
          <button className={styles.nextButton} onClick={handleNext}>
            {currentRound < totalRounds ? 'Next Round' : 'Finish Game'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoundResults