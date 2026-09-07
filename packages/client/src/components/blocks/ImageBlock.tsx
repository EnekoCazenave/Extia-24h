import type { ImageContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function ImageBlock({ content }: { content: ImageContent }) {
  return (
    <figure className={styles.figure}>
      <img className={styles.image} src={content.url} alt={content.alt} loading="lazy" />
      {content.caption ? <figcaption className={styles.caption}>{content.caption}</figcaption> : null}
    </figure>
  )
}
