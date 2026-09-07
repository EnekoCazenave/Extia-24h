import {Link} from 'react-router-dom'
import {useState} from 'react'
import SEOHead from '../components/SEOHead.tsx'
import {useAuth} from '../hooks/useAuth.ts'
import {usePersonalLeaderboard} from '../hooks/useLeaderboard.ts'
import styles from './LeaderboardPage.module.css'
import PersonalSessions from '../components/PersonalSessions.tsx'

export default function PersonalLeaderboardPage() {
  const {user} = useAuth()
  const [page, setPage] = useState(1)
  const result = usePersonalLeaderboard(user?.id, page)
  const ranking = {...result, data: result.data?.ranking}

  return <div className={styles.page}>
    <SEOHead title="Mon classement" description="Votre position dans le classement général." canonicalPath="/classement/me"/>
    <Link className={styles.backLink} to="/classement">← Retour au classement</Link>
    <header className={styles.header}>
      <h1 className={styles.title}>Mon classement</h1>
      <p className={styles.subtitle}>Votre classement global, tous jeux confondus (parties + bonus).</p>
    </header>
    {ranking.isLoading && <p className={styles.state} role="status">Chargement de votre classement…</p>}
    {ranking.isError && <div className={styles.stateError}>
      <p role="alert">Impossible de charger votre classement.</p>
      <button type="button" className={styles.personalButton} disabled={ranking.isFetching}
        onClick={() => void ranking.refetch()}>Réessayer</button>
    </div>}
    {ranking.data && !ranking.isError && <section className={styles.personalCard} aria-label="Votre classement personnel">
      <h2 className={styles.playerName}>{ranking.data.login}</h2>
      <p className={styles.playerSub}>{ranking.data.firstname} {ranking.data.lastname}</p>
      <dl className={styles.personalStats}>
        <div><dt>Position au classement général</dt><dd>{ranking.data.rank.toLocaleString('fr-FR')}{ranking.data.rank === 1 ? 'er' : 'e'}</dd></div>
        <div><dt>Score total</dt><dd>{ranking.data.totalScore.toLocaleString('fr-FR')} pts</dd></div>
      </dl>
    </section>}
    {result.data && !result.isError && <PersonalSessions data={result.data} page={page} setPage={setPage} isFetching={result.isFetching}/>}
  </div>
}
