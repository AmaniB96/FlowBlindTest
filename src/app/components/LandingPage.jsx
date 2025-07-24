'use client'

import { useState } from 'react'
import Image from 'next/image'
import useGameStore from '../store/gameStore'
import GridMotion from './GridMotion'
import styles from './LandingPage.module.css'

function LandingPage() {
  const { setGameState, setGameType, totalGamesPlayed, bestScore } = useGameStore()
  const [showStats, setShowStats] = useState(false)

  const handleStartSolo = () => {
    setGameType('solo');
    setGameState('category-select');
  }

  const handleStartMultiplayer = () => {
    setGameType('multiplayer');
    setGameState('multiplayer-home'); // A new game state
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image
            src='/assets/ChatGPT_Image_3_juin_2025__14_48_42-removebg-preview.png'
            alt="FlowBlindTest Logo"
            width={120}
            height={120}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className={styles.title}>
          Flow<span className="gradient-text">BlindTest</span>
        </h1>
        <p className={styles.subtitle}>
          Test your music knowledge with 30-second song previews
        </p>
      </div>

      <div className={styles.gridContainer}>
        <GridMotion />
      </div>

      <div className={styles.actions}>
        <button className={styles.startButton} onClick={handleStartSolo}>
          <span>Play Solo</span>
        </button>
        <button className={styles.startButton} onClick={handleStartMultiplayer}>
          <span>Multiplayer</span>
        </button>
        
        {totalGamesPlayed > 0 && (
          <button 
            className={styles.statsButton} 
            onClick={() => setShowStats(!showStats)}
          >
            View Stats
          </button>
        )}
      </div>

      {showStats && totalGamesPlayed > 0 && (
        <div className={styles.statsPanel}>
          <h3>Your Stats</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalGamesPlayed}</span>
              <span className={styles.statLabel}>Games Played</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{bestScore}</span>
              <span className={styles.statLabel}>Best Score</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage