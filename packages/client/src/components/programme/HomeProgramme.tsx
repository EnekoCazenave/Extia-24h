import { Link } from 'react-router-dom'
import { useEvents } from '../../hooks/useEvents.ts'
import { useAuth } from '../../hooks/useAuth.ts'
import styles from '../../pages/ProgrammePage.module.css'

export default function HomeProgramme() {
  const {user}=useAuth()
  const {data:events=[],isLoading,isError}=useEvents(user?.id)
  const now=Date.now()
  const sorted=[...events].sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
  const upcoming=sorted.filter(e=>Date.parse(e.endsAt)>now)
  const visible=upcoming.length ? upcoming.slice(0,4) : sorted.slice(-4)
  const time=(d:string)=>new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'})
  return <>
    {isLoading&&<p role="status">Chargement du programme…</p>}
    {isError&&<p role="alert">Impossible de charger le programme.</p>}
    {!isLoading&&!isError&&!events.length&&<p>Aucun événement programmé.</p>}
    <ol className={styles.timeline} aria-label="Les prochains rendez-vous">
      {visible.map(event=><li className={styles.event} key={event.id}>
        <div className={styles.time}><strong>{time(event.startsAt)}</strong><span>à {time(event.endsAt)}</span></div>
        <article className={styles.card}>
          <div className={styles.cardTop}><div><p className={styles.date}>{new Date(event.startsAt).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Paris'})}</p><h3><Link to={'/programme/'+event.id}>{event.name}</Link></h3></div><span>{Date.parse(event.endsAt)<=now?'Terminé':Date.parse(event.startsAt)<=now?'En cours':'À venir'}</span></div>
          <div className={styles.meta}>{event.videoGame&&<span>{event.videoGame.nom}</span>}<span>{event.participantCount} / {event.maxPlaces} inscrits</span>{event.isRegistered&&<span>✓ Vous êtes inscrit</span>}</div>
          <Link className={styles.secondaryButton} to={'/programme/'+event.id}>{Date.parse(event.endsAt)<=now?'Voir le récapitulatif':'Détails et inscription'}</Link>
        </article>
      </li>)}
    </ol>
    <Link className={styles.primaryButton} to="/programme">Voir tout le programme →</Link>
  </>
}
