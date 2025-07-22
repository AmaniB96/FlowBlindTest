'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './SearchBar.module.css'

function SearchBar({ onSearch, onLogoClick }) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(searchQuery)
    setSearchQuery("")
  }

  return (
    <div className={styles.nav}>
        <div className={styles.logo}>
          <Image 
            src='/assets/ChatGPT_Image_3_juin_2025__14_48_42-removebg-preview.png'
            alt="Lyrics App Logo" 
            onClick={onLogoClick}
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
        <input 
            className={styles.input}
            type="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search for a song..."
        />
        <button className={styles.button} type="submit">Search</button>
        </form>
    </div>
  )
}

export default SearchBar