import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { useFavoriteGames } from '../hooks/useFavoriteGames.ts'
import SEOHead from '../components/SEOHead.tsx'
import GameCard from '../components/GameCard.tsx'
import { useGames } from '../hooks/useGames.ts'
import styles from './GamesPage.module.css'

export default function GamesPage() {
  const { data: games, isLoading, isError } = useGames()
  const {user} = useAuth()
  const {favoriteIds,toggle} = useFavoriteGames(user?.id)
  const [search,setSearch] = useState('')
  const [onlyFavorites,setOnlyFavorites] = useState(false)
  const visible = games?.filter(game => game.nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')) && (!onlyFavorites || favoriteIds.includes(game.id)))
    .sort((a,b) => Number(favoriteIds.includes(b.id))-Number(favoriteIds.includes(a.id)))
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
      <div className={styles.tools}>
        <label>Rechercher un jeu<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom du jeu" /></label>
        <label><input type="checkbox" checked={onlyFavorites} onChange={e=>setOnlyFavorites(e.target.checked)} /> Mes favoris uniquement</label>
      </div>
      {games && games.length > 0 && visible?.length === 0 && <p className={styles.empty}>Aucun jeu ne correspond à votre recherche.</p>}
      {isLoading && <p className={styles.empty} aria-live="polite">Chargement des jeux…</p>}
      {isError && <p className={styles.error} role="alert">Impossible de charger la liste des jeux. Veuillez réessayer.</p>}
      {games && games.length === 0 && <p className={styles.empty}>Aucun jeu disponible pour l'instant.</p>}
      {games && games.length > 0 && (
        <ul className={styles.grid} aria-label="Liste des jeux">
          {visible?.map((game) => (
            <li key={game.id}><GameCard game={game} favorite={favoriteIds.includes(game.id)} onToggleFavorite={()=>toggle(game.id)} /></li>
          ))}
        </ul>
      )}
    </div>
  )
}
