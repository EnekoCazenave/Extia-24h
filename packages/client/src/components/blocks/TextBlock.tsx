import DOMPurify from 'dompurify'
import type { TextContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function TextBlock({ content }: { content: TextContent }) {
  const clean = DOMPurify.sanitize(content.html, { USE_PROFILES: { html: true } })
  return <div className={styles.text} dangerouslySetInnerHTML={{ __html: clean }} />
}
