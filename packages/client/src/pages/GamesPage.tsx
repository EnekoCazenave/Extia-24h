import SEOHead from '../components/SEOHead.tsx'
import GameCard from '../components/GameCard.tsx'
import { useGames } from '../hooks/useGames.ts'
import styles from './GamesPage.module.css'

export default function GamesPage() {
  const { data: games, isLoading, isError } = useGames()
  return (
    <div className={styles.page}>
      <SEOHead
        title="Jeux"
        description="Découvrez tous les jeux de l'événement Extia Gaming 24h et consultez les classements."
        canonicalPath="/jeux"
      />
      <header className={styles.header}>
        <h1 className={styles.title}>Les jeux</h1>
        <p className={styles.subtitle}>Cliquez sur un jeu pour voir le classement détaillé et soumettre votre score.</p>
      </header>
      {isLoading && <p className={styles.empty} aria-live="polite">Chargement des jeux…</p>}
      {isError && <p className={styles.error} role="alert">Impossible de charger la liste des jeux. Veuillez réessayer.</p>}
      {games && games.length === 0 && <p className={styles.empty}>Aucun jeu disponible pour l'instant.</p>}
      {games && games.length > 0 && (
        <ul className={styles.grid} role="list" aria-label="Liste des jeux">
          {games.map((game) => (
            <li key={game.id}><GameCard game={game} /></li>
          ))}
        </ul>
      )}
    </div>
  )
}
