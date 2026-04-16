import { Link, useParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import PlayerLeaderboard from '../components/PlayerLeaderboard.tsx'
import { useGame } from '../hooks/useGames.ts'
import styles from './GameDetailPage.module.css'

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const gameId = parseInt(id ?? '0', 10)
  const { data: game, isLoading, isError } = useGame(gameId)

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-muted)' }} aria-live="polite">Chargement du jeu…</p>
      </div>
    )
  }

  if (isError || !game) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error)' }} role="alert">Jeu introuvable ou erreur de chargement.</p>
        <Link to="/jeux" className={styles.back}>← Retour aux jeux</Link>
      </div>
    )
  }

  const happyHour = isHappyHourActive(game.happyHourStart, game.happyHourEnd)

  return (
    <div className={styles.page}>
      <SEOHead
        title={game.nom}
        description={`Classement et scores pour ${game.nom} — Extia Gaming 24h.`}
        canonicalPath={`/jeux/${game.id}`}
      />
      <Link to="/jeux" className={styles.back}>← Retour aux jeux</Link>
      <header className={styles.header}>
        <div>
          <h1 className={styles.gameName}>{game.nom}</h1>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Score total</span>
              <span className={styles.statValue}>{game.totalScore.toLocaleString('fr-FR')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Participants</span>
              <span className={styles.statValue}>{game.rankings.length}</span>
            </div>
          </div>
        </div>
      </header>
      {happyHour && (
        <div className={styles.happyHour} role="status" aria-live="polite">
          ⚡ Happy Hour active ! Les points sont doublés jusqu'à{' '}
          {new Date(game.happyHourEnd!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div className={styles.grid}>
        <section aria-labelledby="ranking-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="ranking-title">🏆 Classement</h2>
          <PlayerLeaderboard
            rankings={game.rankings.map((r) => ({ ...r, totalScore: r.gameScore }))}
            caption={`Classement des joueurs — ${game.nom}`}
          />
        </section>
        <section aria-labelledby="gametypes-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="gametypes-title">📋 Modes de jeu</h2>
          {game.gameTypes.map((gt) => (
            <div key={gt.id} className={styles.gameTypeCard}>
              <div className={styles.gameTypeName}>
                {gt.name}
                {gt.team && <span className={styles.teamBadge}>Équipe</span>}
              </div>
              <div className={styles.gameTypeMeta}>
                <div><strong>Calcul :</strong> {gt.calcul}</div>
                <div><strong>Victoire :</strong> {gt.win}</div>
              </div>
              <Link
                to={`/jeux/${game.id}/jouer?gameTypeId=${gt.id}`}
                className={styles.playBtn}
                aria-label={`Soumettre une partie pour ${gt.name}`}
              >
                🎮 Soumettre une partie — {gt.name}
              </Link>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
