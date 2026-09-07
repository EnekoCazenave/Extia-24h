import type {PersonalSessionPage} from '@extia-gaming/shared'
import styles from '../pages/LeaderboardPage.module.css'

const statuses = {PENDING: 'En attente', APPROVED: 'Validée', REJECTED: 'Refusée'}

export default function PersonalSessions({data, page, setPage, isFetching}: {
  data: PersonalSessionPage; page: number; setPage: (page: number) => void; isFetching: boolean
}) {

  return <section className={styles.sessionHistory} aria-labelledby="session-history-title">
    <h2 id="session-history-title">Mes parties soumises</h2>
    <p className={styles.subtitle}>Les plus récentes en premier. Les points crédités sont les points ajoutés après validation, majorations comprises. Le score global inclut aussi les bonus et les parties soumises par vos coéquipiers.</p>
    {data && <>
      {data.sessions.length === 0 ? <p className={styles.empty}>Aucune partie sur cette page.</p> :
        <div className={styles.sessionTable}><table className={styles.table}>
          <caption>Détail des parties soumises</caption>
          <thead><tr>{['Date', 'Jeu / Mode', 'Statut', 'Score soumis', 'Points crédités'].map((title) => <th key={title} scope="col">{title}</th>)}</tr></thead>
          <tbody>{data.sessions.map((session) => <tr key={session.id}>
            <td>{new Date(session.createdAt).toLocaleString('fr-FR', {dateStyle: 'short', timeStyle: 'short'})}</td>
            <td><strong>{session.gameName}</strong><div>{session.gameTypeName}</div></td>
            <td>{statuses[session.status]}</td>
            <td>{session.submittedScore.toLocaleString('fr-FR')} pts</td>
            <td>{session.creditedPoints.toLocaleString('fr-FR')} pts</td>
          </tr>)}</tbody>
        </table></div>}
    </>}
    <nav className={styles.pagination} aria-label="Pagination des parties">
      <button type="button" disabled={page === 1 || isFetching} onClick={() => setPage(page - 1)}>Précédent</button>
      <span aria-live="polite">Page {page}</span>
      <button type="button" disabled={!data?.hasNextPage || isFetching} onClick={() => setPage(page + 1)}>Suivant</button>
    </nav>
  </section>
}
