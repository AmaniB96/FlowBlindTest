'use client'

import useGameStore from '../store/gameStore'
import styles from './GameOverMultiplayer.module.css'

function GameOverMultiplayer() {
  const {
    gameResults, // This holds the final player data from the server
    socket,
    resetGame,
    setGameState,
  } = useGameStore()

  // Safety check if gameResults is not available
  if (!gameResults || !gameResults.players) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Game Over</h1>
          <p>Could not load game results.</p>
          <button onClick={() => setGameState('landing')} className={styles.homeButton}>Go Home</button>
        </div>
      </div>
    )
  }

  // Determine winner, loser, or tie
  const myPlayer = gameResults.players.find(p => p.id === socket?.id);
  const opponent = gameResults.players.find(p => p.id !== socket?.id);
  
  let resultMessage = "It's a Tie!";
  let resultClass = styles.tie;

  if (myPlayer && opponent) {
    if (myPlayer.score > opponent.score) {
      resultMessage = 'You Win!';
      resultClass = styles.win;
    } else if (opponent.score > myPlayer.score) {
      resultMessage = 'You Lost!';
      resultClass = styles.lose;
    }
  }

  const handlePlayAgain = () => {
    resetGame();
    // Go back to the multiplayer menu, not the solo one
    setGameState('multiplayer-home');
  };

  const handleBackToHome = () => {
    resetGame();
    setGameState('landing');
  };

  // Sort players by score for the final ranking
  const rankedPlayers = [...gameResults.players].sort((a, b) => b.score - a.score);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={`${styles.title} ${resultClass}`}>{resultMessage}</h1>
        
        <div className={styles.scores}>
          <h2>Final Scores</h2>
          <ul>
            {rankedPlayers.map(player => (
              <li key={player.id}>
                <span>{player.username || 'Player'} {player.id === socket?.id ? '(You)' : ''}</span>
                <span className={styles.scoreValue}>{player.score}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actions}>
          <button className={styles.playAgainButton} onClick={handlePlayAgain}>Play Again</button>
          <button className={styles.homeButton} onClick={handleBackToHome}>Home</button>
        </div>
      </div>
    </div>
  )
}

export default GameOverMultiplayer