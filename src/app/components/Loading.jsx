import Image from 'next/image'
import styles from './Loading.module.css'

function Loading() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <Image fill src='/assets/ChatGPT_Image_3_juin_2025__14_48_42-removebg-preview.png' alt="Logo" className={styles.bouncingLogo} />
        </div>
        <div className={styles.loadingText}>
          <span>L</span>
          <span>o</span>
          <span>a</span>
          <span>d</span>
          <span>i</span>
          <span>n</span>
          <span>g</span>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  )
}

export default Loading