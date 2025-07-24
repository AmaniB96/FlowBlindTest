'use client'
import useGameStore from '../store/gameStore'
import styles from './Multiplayer.module.css'

function MultiplayerHome() {
  const { setGameState, createRoom } = useGameStore()

  const handleCreateGame = () => {
    // This action will connect to the socket server, create a room,
    // and move the game state to the 'lobby'.
    createRoom()
  }

  const handleJoinGame = () => {
    setGameState('join-game')
  }

  const handleBack = () => {
    setGameState('landing')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Multiplayer</h1>
      <p className={styles.subtitle}>Play against a friend in real-time!</p>
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={handleCreateGame}>
          Create Game
        </button>
        <button className={styles.secondaryButton} onClick={handleJoinGame}>
          Join Game
        </button>
      </div>
      <button onClick={handleBack} className={styles.backButton}>Back</button>
    </div>
  )
}

export default MultiplayerHome