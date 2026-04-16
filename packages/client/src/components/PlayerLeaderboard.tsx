import type { RankedEntry } from '../hooks/useLeaderboard.ts'
import styles from './PlayerLeaderboard.module.css'

interface PlayerLeaderboardProps {
  rankings: RankedEntry[]
  caption?: string
}

export default function PlayerLeaderboard({ rankings, caption }: PlayerLeaderboardProps) {
  if (rankings.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: '16px 0' }}>Aucun joueur classé pour l'instant.</p>
  }
  return (
    <table className={styles.table} aria-label={caption ?? 'Classement des joueurs'}>
      <thead>
        <tr>
          <th className={styles.rankCell} scope="col">#</th>
          <th scope="col">Joueur</th>
          <th scope="col">Score total</th>
        </tr>
      </thead>
      <tbody>
        {rankings.map((entry) => (
          <tr key={entry.userId}>
            <td className={styles.rankCell}>
              <span className={styles.rank} data-rank={entry.rank <= 3 ? entry.rank : undefined}>{entry.rank}</span>
            </td>
            <td>
              <div className={styles.playerName}>{entry.login}</div>
              <div className={styles.playerLogin}>{entry.firstname} {entry.lastname}</div>
            </td>
            <td><span className={styles.score}>{entry.totalScore.toLocaleString('fr-FR')}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
