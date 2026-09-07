import type { HeadingContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function HeadingBlock({ content }: { content: HeadingContent }) {
  const cls =
    content.level === 1 ? styles.heading1 : content.level === 2 ? styles.heading2 : styles.heading3
  if (content.level === 1) return <h1 className={cls}>{content.text}</h1>
  if (content.level === 2) return <h2 className={cls}>{content.text}</h2>
  return <h3 className={cls}>{content.text}</h3>
}
