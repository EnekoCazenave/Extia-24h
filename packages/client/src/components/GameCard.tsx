import { Link } from 'react-router-dom'
import type { GameWithScore } from '../hooks/useGames.ts'
import styles from './GameCard.module.css'

interface GameCardProps {
  game: GameWithScore
}

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

export default function GameCard({ game }: GameCardProps) {
  const happyHour = isHappyHourActive(game.happyHourStart, game.happyHourEnd)
  return (
    <Link to={`/jeux/${game.id}`} className={styles.card} aria-label={`Voir le détail du jeu ${game.nom}`}>
      <div className={styles.imageWrapper}>
        {game.imageUrl ? (
          <img className={styles.image} src={game.imageUrl} alt={`Illustration du jeu ${game.nom}`} loading="lazy" />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">🎮</div>
        )}
        {happyHour && (
          <span className={styles.happyHourBadge} aria-label="Happy Hour active — points doublés">
            ⚡ Happy Hour
          </span>
        )}
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{game.nom}</h2>
        {game.gameTypes.length > 0 && (
          <div className={styles.typesList}>
            {game.gameTypes.map((gt) => (
              <span key={gt.id} className={styles.typeTag}>{gt.name}</span>
            ))}
          </div>
        )}
        <div className={styles.meta}>
          <span className={styles.score}>
            Score total : <span className={styles.scoreValue}>{game.totalScore.toLocaleString('fr-FR')}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
