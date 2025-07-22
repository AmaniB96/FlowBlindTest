'use client'

import useGameStore from '../store/gameStore'
import styles from './DifficultySelect.module.css'

function DifficultySelect() {
  const { setGameState, setGameSettings, selectedCategory, difficulty, gameMode } = useGameStore()

  const difficulties = [
    {
      id: 'easy',
      name: 'Easy',
      icon: '😊',
      description: 'Popular hits everyone knows',
      color: 'var(--accent-success)'
    },
    {
      id: 'medium',
      name: 'Medium',
      icon: '🤔',
      description: 'Mix of popular and lesser-known tracks',
      color: 'var(--accent-warning)'
    },
    {
      id: 'hard',
      name: 'Hard',
      icon: '😤',
      description: 'Deep cuts and rare gems',
      color: 'var(--accent-error)'
    }
  ]

  const gameModes = [
    {
      id: 'song',
      name: 'Song Title',
      description: 'Guess only the song title',
      points: '10 pts per correct answer'
    },
    {
      id: 'artist',
      name: 'Artist Name',
      description: 'Guess only the artist name',
      points: '10 pts per correct answer'
    },
    {
      id: 'both',
      name: 'Song & Artist',
      description: 'Guess both for maximum points',
      points: '5 pts each (10 pts total)'
    }
  ]

  const handleDifficultySelect = (difficultyId) => {
    setGameSettings(selectedCategory, difficultyId, gameMode)
  }

  const handleGameModeSelect = (modeId) => {
    setGameSettings(selectedCategory, difficulty, modeId)
  }

  const handleStartGame = () => {
    setGameState('playing')
  }

  const handleBack = () => {
    setGameState('category-select')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Back
        </button>
        <h1 className={styles.title}>Game Settings</h1>
        <p className={styles.subtitle}>Choose your difficulty and game mode</p>
      </div>

      <div className={styles.settingsContainer}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Difficulty Level</h2>
          <div className={styles.optionsGrid}>
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                className={`${styles.optionCard} ${difficulty === diff.id ? styles.selected : ''}`}
                onClick={() => handleDifficultySelect(diff.id)}
                style={{ '--accent-color': diff.color }}
              >
                <div className={styles.optionIcon}>{diff.icon}</div>
                <h3 className={styles.optionName}>{diff.name}</h3>
                <p className={styles.optionDescription}>{diff.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Game Mode</h2>
          <div className={styles.optionsGrid}>
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                className={`${styles.optionCard} ${gameMode === mode.id ? styles.selected : ''}`}
                onClick={() => handleGameModeSelect(mode.id)}
              >
                <h3 className={styles.optionName}>{mode.name}</h3>
                <p className={styles.optionDescription}>{mode.description}</p>
                <span className={styles.optionPoints}>{mode.points}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.startButton}
          onClick={handleStartGame}
          disabled={!difficulty || !gameMode}
        >
          Start Blindtest
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default DifficultySelect