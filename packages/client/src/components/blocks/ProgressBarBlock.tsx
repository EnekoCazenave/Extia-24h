import type { ProgressBarContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'

export function ProgressBarBlock({ content }: { content: ProgressBarContent }) {
  const pct = Math.min(100, Math.max(0, (content.current / content.goal) * 100))
  const unit = content.unit ?? ''
  return (
    <div className={styles.progressWrapper}>
      <div className={styles.progressLabelRow}>
        <span className={styles.progressLabel}>{content.label ?? 'Objectif'}</span>
        <span className={styles.progressValue}>
          {content.current.toLocaleString('fr-FR')}{unit} / {content.goal.toLocaleString('fr-FR')}{unit}
          {' '}
          ({pct.toFixed(0)}%)
        </span>
      </div>
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={content.current}
        aria-valuemin={0}
        aria-valuemax={content.goal}
      >
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
