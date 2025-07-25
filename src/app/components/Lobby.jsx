'use client'
import { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore'
import styles from './Multiplayer.module.css'
import { categories, difficulties } from '../config/gameConfig'
import toast from 'react-hot-toast' // <-- Import toast

function Lobby() {
  const { 
    roomId, 
    players, 
    socket, 
    startMultiplayerGame, 
    setGameState,
    selectedCategory,
    difficulty,
    setMultiplayerSettings,
    username,
    setUsername
  } = useGameStore();

  const [pendingUsername, setPendingUsername] = useState(username || '');
  const usernameInputRef = useRef();

  // Optionally focus input on mount
  useEffect(() => {
    if (usernameInputRef.current && !username) {
      usernameInputRef.current.focus();
    }
  }, [username]);

  // Submit username to backend and update store
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!pendingUsername.trim()) return;
    setUsername(pendingUsername.trim());
    if (socket && socket.connected) {
      socket.emit('setUsername', { username: pendingUsername.trim() });
    }
    toast.success('Username updated!');
  };

  const isHost = players.length > 0 && socket?.id === players[0].id

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId)
    toast.success('Room code copied to clipboard!') // <-- Replaced alert
  }

  const handleSettingChange = (type, value) => {
    if (!isHost) return;
    if (type === 'category') {
      setMultiplayerSettings({ category: value });
    } else {
      setMultiplayerSettings({ difficulty: value });
    }
  }

  const handleStartGame = () => {
    // Use the renamed action for multiplayer games
    startMultiplayerGame()
  }
  
  const handleCancel = () => {
    // In a real app, you'd emit a 'leaveRoom' event. For now, we just reset.
    setGameState('multiplayer-home'); 
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lobby</h1>

      {/* --- USERNAME INPUT --- */}
      <form className={styles.usernameSection} onSubmit={handleUsernameSubmit}>
        <label htmlFor="username">Your Username:</label>
        <input
          id="username"
          ref={usernameInputRef}
          type="text"
          value={pendingUsername}
          maxLength={20}
          onChange={e => setPendingUsername(e.target.value)}
          className={styles.usernameInput}
          placeholder="Enter your name"
        />
        <button
          type="submit"
          className={styles.usernameSubmitButton}
          disabled={!pendingUsername.trim() || pendingUsername === username}
        >
          Set Username
        </button>
      </form>
      {/* --- END USERNAME INPUT --- */}

      <div className={styles.roomCodeContainer}>
        <span className={styles.roomCode}>{roomId}</span>
        <button onClick={handleCopyCode} className={styles.copyButton}>Copy</button>
      </div>

      {/* --- NEW GAME SETTINGS SECTION --- */}
      <div className={styles.settingsSection}>
        <div className={styles.setting}>
          <label>Category</label>
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => handleSettingChange('category', e.target.value)}
            disabled={!isHost}
            className={styles.selectInput}
          >
            <option value="" disabled>Select...</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className={styles.setting}>
          <label>Difficulty</label>
          <select 
            value={difficulty || ''} 
            onChange={(e) => handleSettingChange('difficulty', e.target.value)}
            disabled={!isHost}
            className={styles.selectInput}
          >
            <option value="" disabled>Select...</option>
            {difficulties.map(diff => <option key={diff.id} value={diff.id}>{diff.name}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.playerList}>
        <h2>Players</h2>
        <ul>
          {players.map((player, index) => (
            <li key={player.id || index}>
              {player.username || `Player ${index + 1}`} 
              {player.id === socket?.id && ' (You)'}
            </li>
          ))}
        </ul>
        {players.length < 2 && <p className={styles.waitingText}>Waiting for opponent...</p>}
      </div>

      <div className={styles.actions}>
        {isHost && (
          <button 
            className={styles.primaryButton} 
            onClick={handleStartGame}
            disabled={players.length < 2 || !selectedCategory || !difficulty}
          >
            Start Game
          </button>
        )}
        <button onClick={handleCancel} className={styles.backButton}>Cancel</button>
      </div>
    </div>
  )
}

export default Lobby