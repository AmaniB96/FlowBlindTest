'use client'
import { useState } from 'react'
import useGameStore from '../store/gameStore'
import styles from './Multiplayer.module.css'

function JoinGame() {
  const { setGameState, joinRoom } = useGameStore()
  const [roomIdInput, setRoomIdInput] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    if (!roomIdInput.trim()) {
      setError('Please enter a room code.')
      return
    }
    // This action will attempt to join the room via the socket server.
    // The callback will handle any errors, like the room being full.
    joinRoom(roomIdInput.toUpperCase(), (response) => {
      if (response.status === 'error') {
        setError(response.message)
      }
    })
  }

  const handleBack = () => {
    setGameState('multiplayer-home')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Join Game</h1>
      <p className={styles.subtitle}>Enter the code from your friend's lobby.</p>
      <div className={styles.form}>
        <input
          type="text"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          placeholder="ROOM CODE"
          className={styles.input}
          maxLength={6}
          autoCapitalize="characters"
        />
        <button className={styles.primaryButton} onClick={handleJoin}>
          Join
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button onClick={handleBack} className={styles.backButton}>Back</button>
    </div>
  )
}

export default JoinGame