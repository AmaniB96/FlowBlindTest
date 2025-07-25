'use client'
import { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore'
import styles from './Multiplayer.module.css'
import { categories, difficulties } from '../config/gameConfig'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    if (usernameInputRef.current && !username) {
      usernameInputRef.current.focus();
    }
  }, [username]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!pendingUsername.trim()) return;
    setUsername(pendingUsername.trim());
    if (socket && socket.connected) {
      socket.emit('setUsername', { username: pendingUsername.trim() });
    }
    toast.success('Username updated!');
  };

  const isHost = players.length > 0 && socket?.id === players[0].id;
  
  // --- FIX: Check if the guest has set a username ---
  const guestHasSetUsername = players.length > 1 ? !!players[1].username : false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId)
    toast.success('Room code copied to clipboard!')
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
    startMultiplayerGame()
  }
  
  const handleCancel = () => {
    setGameState('multiplayer-home'); 
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lobby</h1>

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

      {/* --- FIX: Prompt for guest to set username --- */}
      {!isHost && players.length > 1 && !username && (
        <p className={styles.waitingText} style={{ color: 'var(--accent-secondary, #ff5722)' }}>
          Please set your username to continue!
        </p>
      )}

      <div className={styles.roomCodeContainer}>
        <span className={styles.roomCode}>{roomId}</span>
        <button onClick={handleCopyCode} className={styles.copyButton}>Copy</button>
      </div>

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
        
        {/* --- FIX: Prompt for host waiting on guest --- */}
        {isHost && players.length > 1 && !guestHasSetUsername && (
          <p className={styles.waitingText}>Waiting for opponent to set a username...</p>
        )}
      </div>

      <div className={styles.actions}>
        {isHost && (
          <button 
            className={styles.primaryButton} 
            onClick={handleStartGame}
            // --- FIX: Add guest username check to disabled logic ---
            disabled={players.length < 2 || !selectedCategory || !difficulty || !guestHasSetUsername}
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