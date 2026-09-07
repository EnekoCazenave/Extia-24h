import type { CtaButtonContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function CtaButtonBlock({ content }: { content: CtaButtonContent }) {
  const cls = content.style === 'secondary' ? styles.ctaSecondary : styles.ctaPrimary
  return (
    <a
      className={`${styles.cta} ${cls}`}
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content.label}
    </a>
  )
}
