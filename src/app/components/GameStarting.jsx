'use client'

import useGameStore from '../store/gameStore'
import styles from './GameStarting.module.css'

function GameStarting() {
  const { 
    playerAcknowledgeStart,
    readyPlayers, // Get the list of ready players
    socket,       // Get our own socket info
  } = useGameStore();

  // Check if the current player has already clicked the ready button
  const amIReady = readyPlayers.includes(socket?.id);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>The game is starting!</h1>
        
        {/* Show different content based on ready status */}
        {amIReady ? (
          <p className={styles.subtitle}>Waiting for opponent...</p>
        ) : (
          <p className={styles.subtitle}>Click when you're ready to begin.</p>
        )}

        <button 
          className={styles.readyButton}
          onClick={playerAcknowledgeStart}
          disabled={amIReady} // Disable the button after clicking
        >
          {amIReady ? 'Ready!' : "I'm Ready!"}
        </button>
      </div>
    </div>
  )
}

export default GameStarting;