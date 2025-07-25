'use client'

import Image from 'next/image'
import useGameStore from '../store/gameStore'
import styles from './RoundResults.module.css' // Assuming you have this CSS file

function RoundResults() {
  const {
    currentRound,
    totalRounds,
    roundResults,
    currentSong,
    signalReadyForNextRound,
    players,
    socket,
  } = useGameStore()

  const currentResult = roundResults[roundResults.length - 1];
  if (!currentResult) return null; // Safety check

  // --- THE CORE LOGIC ---
  // 1. Am I the winner of this round?
  const amIWinner = socket?.id === currentResult.winnerId;

  // 2. What score should be displayed for ME?
  const myRoundScore = amIWinner ? currentResult.pointsAwarded : 0;

  // 3. Find my total score
  const me = players.find(p => p.id === socket?.id);
  const myTotalScore = me ? me.score : 0;

  // 4. Find the winner's details (if there was a winner)
  const winner = players.find(p => p.id === currentResult.winnerId);

  // 5. Determine the main message
  const getResultMessage = () => {
    if (amIWinner) return "Correct!";
    if (winner) return `${winner.username || 'Opponent'} was faster!`;
    return "Nobody guessed correctly.";
  };

  const handleNext = () => {
    signalReadyForNextRound();
  };

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        {/* Header: Icon, Message, and MY score for the round */}
        <div className={styles.header}>
          <div className={`${styles.resultIcon} ${amIWinner ? styles.correct : styles.incorrect}`}>
            {amIWinner ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/></svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/></svg>
            )}
          </div>
          <h2 className={styles.resultMessage}>{getResultMessage()}</h2>
          <div className={styles.scoreDisplay} style={{ color: amIWinner ? 'var(--accent-success)' : 'var(--accent-error)' }}>
            +{myRoundScore} points
          </div>
        </div>

        {/* Song Information (same for both) */}
        <div className={styles.songInfo}>
          <div className={styles.albumCover}>
            <Image
              src={currentSong?.album?.cover || '/placeholder-album.png'}
              alt={currentSong?.album?.title || 'Album cover'}
              width={200} height={200} className={styles.coverImage}
            />
          </div>
          <div className={styles.songDetails}>
            <h3 className={styles.songTitle}>{currentSong?.title}</h3>
            <p className={styles.artistName}>{currentSong?.artist?.name}</p>
          </div>
        </div>

        {/* Guess Section: Shows the winning guess */}
        <div className={styles.guessSection}>
          <h4>{amIWinner ? "Your guess:" : (winner ? "Winning guess:" : "Correct Answer:")}</h4>
          <p className={styles.userGuess}>{currentResult.userGuess || <em>No guess submitted</em>}</p>
        </div>

        {/* Progress: Shows MY total score */}
        <div className={styles.progress}>
          <div className={styles.progressInfo}>
            <span>Round {currentRound} of {totalRounds}</span>
            <span>Total Score: {myTotalScore}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentRound / totalRounds) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.nextButton} onClick={handleNext}>
            {currentRound < totalRounds ? 'Next Round' : 'Finish Game'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundResults;