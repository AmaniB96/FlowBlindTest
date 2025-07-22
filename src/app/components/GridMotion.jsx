'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import useGameStore from '../store/gameStore'
import styles from './GridMotion.module.css'

const ARTISTS_BY_ROW = [
  ['drake', 'beyonce', 'aya nakamura', 'asake', 'rihanna', 'adele', 'weeknd', 'ayra starr'],
  ['dave', 'central cee', 'burna boy', 'wizkid', 'skepta', 'stormzy', 'clavish', 'davido'],
  ['ninho', 'pnl', 'booba', 'jul', 'gazo', 'tiakola', 'rema', 'fireboy dml'],
  ['tems', 'omah lay', 'joeboy', 'oxlade', 'kizz daniel', 'mayorkun', 'zlatan', 'tiwa savage']
];

function GridMotion() {
  const { artistGridData, isArtistGridLoaded, setArtistGridData } = useGameStore()
  const [loading, setLoading] = useState(!isArtistGridLoaded)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchArtistImages = async () => {
      if (isArtistGridLoaded) return

      try {
        setLoading(true)
        const allArtists = ARTISTS_BY_ROW.flat()
        const artistPromises = allArtists.map(async (artistName) => {
          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(artistName)}`)
            const data = await response.json()
            
            if (data.data && data.data.length > 0) {
              const artist = data.data[0].artist
              return {
                name: artistName,
                image: artist.picture_medium || artist.picture,
                id: artist.id
              }
            }
            return null
          } catch (err) {
            console.error(`Failed to fetch ${artistName}:`, err)
            return null
          }
        })

        const results = await Promise.all(artistPromises)
        const validArtists = results.filter(Boolean)
        // Save the fetched data to the Zustand store
        setArtistGridData(validArtists)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchArtistImages()
  }, [isArtistGridLoaded, setArtistGridData])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.message}>Loading artists...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.message}>Unable to load artist images</div>
      </div>
    )
  }

  // Group artists back into rows for display
  const rows = []
  const itemsPerRow = 8
  for (let i = 0; i < artistGridData.length; i += itemsPerRow) {
    rows.push(artistGridData.slice(i, i + itemsPerRow))
  }

  return (
    <div className={styles.container}>
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`${styles.row} ${rowIndex % 2 === 0 ? styles.slideLeft : styles.slideRight}`}
        >
          {/* Duplicate the row for seamless infinite scroll */}
          {[...row, ...row].map((artist, index) => (
            <div key={`${artist.id}-${index}`} className={styles.item}>
              <Image
                src={artist.image}
                alt={artist.name}
                width={120}
                height={120}
                className={styles.artistImage}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default GridMotion