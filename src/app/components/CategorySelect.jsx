'use client'

import useGameStore from '../store/gameStore'
import styles from './CategorySelect.module.css'

function CategorySelect() {
  const { setGameState, setGameSettings, selectedCategory } = useGameStore()

  const categories = [
    { id: 'mixed', name: 'Mixed', icon: '🎵', description: 'Various genres and artists' },
    { id: 'pop', name: 'Pop', icon: '🎤', description: 'Popular mainstream music' },
    { id: 'hip-hop', name: 'Hip Hop', icon: '🎧', description: 'Global rap and hip hop' },
    { id: 'french-rap', name: 'French Rap', icon: '🇫🇷', description: 'The best of French rap' },
    { id: 'uk-rap', name: 'UK Rap', icon: '🇬🇧', description: 'Drill, Grime, and UK Hip Hop' },
    { id: 'k-pop', name: 'K-Pop', icon: '🇰🇷', description: 'Popular hits from South Korea' },
    { id: 'afrobeat', name: 'Afrobeat', icon: '🥁', description: 'African rhythms and modern beats' },
    { id: 'brazilian-funk', name: 'Funk', icon: '🇧🇷', description: 'The sound of Brazilian baile funk' },
    { id: 'rock', name: 'Rock', icon: '🎸', description: 'Rock and alternative music' },
    { id: 'electronic', name: 'Electronic', icon: '⚡', description: 'EDM and electronic beats' },
    { id: 'r&b', name: 'R&B', icon: '🎹', description: 'Rhythm and blues' },
    { id: 'reggae', name: 'Reggae', icon: '🌴', description: 'Reggae and Caribbean vibes' }
  ]

  const handleCategorySelect = (categoryId) => {
    setGameSettings(categoryId, 'medium', 'both')
    setGameState('difficulty-select')
  }

  const handleBack = () => {
    setGameState('landing')
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
        <h1 className={styles.title}>Choose Your Genre</h1>
        <p className={styles.subtitle}>Select a music category for your blindtest</p>
      </div>

      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.categoryCard} ${selectedCategory === category.id ? styles.selected : ''}`}
            onClick={() => handleCategorySelect(category.id)}
          >
            <div className={styles.categoryIcon}>{category.icon}</div>
            <h3 className={styles.categoryName}>{category.name}</h3>
            <p className={styles.categoryDescription}>{category.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategorySelect