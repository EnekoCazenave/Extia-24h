import type { GameScoreSummary } from '@extia-gaming/shared'
import styles from './TopGamesTable.module.css'

interface TopGamesTableProps {
  games: GameScoreSummary[]
}

export default function TopGamesTable({ games }: TopGamesTableProps) {
  if (games.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: '16px 0' }}>Aucune partie jouée pour l'instant.</p>
  }
  return (
    <table className={styles.table} aria-label="Top jeux par score total">
      <thead>
        <tr>
          <th className={styles.rankCell} scope="col">#</th>
          <th scope="col">Jeu</th>
          <th scope="col">Score total</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game, index) => {
          const rank = index + 1
          return (
            <tr key={game.videoGameId}>
              <td className={styles.rankCell}>
                <span className={styles.rank} data-rank={rank <= 3 ? rank : undefined}>{rank}</span>
              </td>
              <td><span className={styles.gameName}>{game.nom}</span></td>
              <td><span className={styles.score}>{game.totalScore.toLocaleString('fr-FR')}</span></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
