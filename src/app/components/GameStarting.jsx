'use client'

import useGameStore from '../store/gameStore'
import styles from './GameStarting.module.css'

function GameStarting() {
  const { playerAcknowledgeStart } = useGameStore();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>The game is starting!</h1>
        <p className={styles.subtitle}>Get ready for the first song.</p>
        <button 
          className={styles.readyButton}
          onClick={playerAcknowledgeStart}
        >
          I'm Ready!
        </button>
      </div>
    </div>
  )
}

export default GameStarting;