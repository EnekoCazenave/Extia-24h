import SEOHead from '../components/SEOHead.tsx'
import TopGamesTable from '../components/TopGamesTable.tsx'
import PlayerLeaderboard from '../components/PlayerLeaderboard.tsx'
import PrizePoolBanner from '../components/PrizePoolBanner.tsx'
import ProgrammeAgenda from '../components/programme/ProgrammeAgenda.tsx'
import { useTopGames, useGlobalLeaderboard } from '../hooks/useLeaderboard.ts'
import styles from './HomePage.module.css'

const EVENT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Extia Gaming 24h',
  description: "L'événement gaming interne d'Extia — 24 heures de jeux et de compétition.",
  organizer: { '@type': 'Organization', name: 'Extia' },
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
}

export default function HomePage() {
  const topGames = useTopGames(5)
  const leaderboard = useGlobalLeaderboard(20)

  return (
    <>
      <SEOHead
        title="Extia Gaming 24h"
        description="L'événement gaming interne d'Extia — 24 heures de jeux et de compétition."
        canonicalPath="/"
        jsonLd={EVENT_JSON_LD}
      />
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 className={styles.heroTitle} id="home-title">
          Extia <span className={styles.heroAccent}>Gaming</span> 24h
        </h1>
        <p className={styles.heroSubtitle}>
          24 heures de compétition, de jeux et de fair-play. Que le meilleur gagne !
        </p>
      </section>
      <PrizePoolBanner />
      <div className={styles.content}>
          <section
              aria-labelledby="programme-title"
              className={`${styles.section} ${styles.programmeSection}`}
          >
              <header className={styles.programmeHeader}>
                  <div>
                      <p className={styles.programmeEyebrow}>Les 24 heures</p>
                      <h2 className={styles.sectionTitle} id="programme-title">Programme</h2>
                  </div>
                  <p>Suivez l’ensemble des temps forts du défi, heure par heure.</p>
              </header>
              <ProgrammeAgenda />
          </section>
      </div>
      <section className={styles.twitchSection} aria-label="Live Twitch Extia Gaming">
        <div className={styles.twitchHeader}>
          <span className={styles.twitchLiveBadge}>LIVE</span>
          <span className={styles.twitchTitle}>extiagaming</span>
          <a
            href="https://www.twitch.tv/extiagaming"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.twitchOpenBtn}
          >
            Ouvrir sur Twitch ↗
          </a>
        </div>
        <div className={styles.twitchEmbed}>
          <iframe
            src={`https://player.twitch.tv/?channel=extiagaming&parent=${window.location.hostname}`}
            title="Extia Gaming Live Twitch"
            allowFullScreen
            className={styles.twitchIframe}
          />
        </div>
      </section>
      <div className={styles.content}>
        <section aria-labelledby="top-games-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="top-games-title">🏆 Top 5 Jeux</h2>
          {topGames.isLoading && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }} aria-live="polite">Chargement…</p>}
          {topGames.isError && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }} role="alert">Impossible de charger les jeux.</p>}
          {topGames.data && <TopGamesTable games={topGames.data} />}
        </section>
        <section aria-labelledby="leaderboard-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="leaderboard-title">🎮 Classement général</h2>
          {leaderboard.isLoading && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }} aria-live="polite">Chargement…</p>}
          {leaderboard.isError && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }} role="alert">Impossible de charger le classement.</p>}
          {leaderboard.data && <PlayerLeaderboard rankings={leaderboard.data} />}
        </section>
      </div>
    </>
  )
}
