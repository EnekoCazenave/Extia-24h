import type { DonationLinkContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function DonationLinkBlock({ content }: { content: DonationLinkContent }) {
  return (
    <a
      className={styles.donationLink}
      href={content.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      ♥ {content.label}
    </a>
  )
}
