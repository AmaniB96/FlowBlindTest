'use client'

import { useState, useEffect } from 'react'
import useGameStore from './store/gameStore'
import LandingPage from './components/LandingPage'
import CategorySelect from './components/CategorySelect'
import DifficultySelect from './components/DifficultySelect'
import GamePlay from './components/GamePlay'
import GamePlayMultiplayer from './components/GamePlayMultiplayer'
import RoundResults from './components/RoundResults'
import GameOver from './components/GameOver'
import GameOverMultiplayer from './components/GameOverMultiplayer'
import Loading from './components/Loading'
import MultiplayerHome from './components/MultiplayerHome'
import Lobby from './components/Lobby'
import JoinGame from './components/JoinGame'
import GameStarting from './components/GameStarting'
import styles from './page.module.css'


function Page() {
  const { gameState, gameType } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)

  const renderCurrentView = () => {
    if (isLoading) return <Loading />
    
    switch (gameState) {
      case 'landing':
        return <LandingPage />
      case 'category-select':
        return <CategorySelect />
      case 'difficulty-select':
        return <DifficultySelect />
      case 'starting':
        return (
          <>
            <Lobby />
            <GameStarting />
          </>
        )
      case 'playing':
        return gameType === 'multiplayer' ? <GamePlayMultiplayer /> : <GamePlay />
      case 'results':
        return <RoundResults />
      case 'game-over':
        return gameType === 'multiplayer' ? <GameOverMultiplayer /> : <GameOver />
      case 'multiplayer-home':
        return <MultiplayerHome />
      case 'lobby':
        return <Lobby />
      case 'join-game':
        return <JoinGame />
      default:
        return <LandingPage />
    }
  }

  return (
    <div className={styles.app}>
      {renderCurrentView()}
    </div>
  )
}

export default Page