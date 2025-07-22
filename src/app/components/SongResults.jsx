import SongCard from './SongCard'
import styles from './SongResults.module.css'

function SongResults({ songs, displayLimit, onLoadMore }) {
  if (!songs) return null
  
  return (
    <>
      <h1 className={styles.title}>Top Songs</h1>
      <div className={styles.container}>
        {songs.slice(0, displayLimit).map((song, index) => (
          <SongCard key={song.id} song={song} index={index} />
        ))}
      </div>
      
      {songs.length > displayLimit && (
        <button 
          onClick={onLoadMore}
          className={styles.seeMoreBtn}
        >
          See More
        </button>
      )}
    </>
  )
}

export default SongResults