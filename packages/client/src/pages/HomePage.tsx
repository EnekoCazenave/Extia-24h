import SEOHead from '../components/SEOHead.tsx'

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
  return (
    <>
      <SEOHead
        title="Extia Gaming 24h"
        description="L'événement gaming interne d'Extia — 24 heures de jeux et de compétition."
        canonicalPath="/"
        jsonLd={EVENT_JSON_LD}
      />
      <section aria-labelledby="home-title">
        <h1 id="home-title">Extia Gaming 24h</h1>
        <p>L'événement gaming interne d'Extia — 24 heures de jeux et de compétition.</p>
      </section>
    </>
  )
}
