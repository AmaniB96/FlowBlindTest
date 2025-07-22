'use client'

import Image from 'next/image'
import styles from './SongCard.module.css'

function SongCard({ song, index }) {
  return (
    <div className={styles.songCard} style={{"--index": index}}>
      <div className={styles.image}>
        <Image src={song.album.cover_big || song.album.cover_medium} alt={song.album.title} width={150} height={150} />
        <div className={styles.playOverlay}>
          <div className={styles.playBtn} onClick={() => {
            const audio = document.getElementById(`audio-${song.id}`);
            audio.paused ? audio.play() : audio.pause();
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{song.title}</h3>
        <p className={styles.artist}>{song.artist.name}</p>
        <p className={styles.album}>{song.album.title}</p>
        <div className={styles.player}>
          <audio id={`audio-${song.id}`} className="snippetBox" controls src={song.preview}></audio>
        </div>
      </div>
    </div>
  )
}

export default SongCard