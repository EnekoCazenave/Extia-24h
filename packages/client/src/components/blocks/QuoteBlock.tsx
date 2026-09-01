import type { QuoteContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function QuoteBlock({ content }: { content: QuoteContent }) {
  return (
    <blockquote className={styles.quote}>
      <p>“{content.text}”</p>
      {content.author ? <cite className={styles.quoteAuthor}>— {content.author}</cite> : null}
    </blockquote>
  )
}
