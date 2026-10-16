import SEOHead from '../components/SEOHead.tsx'
import styles from './PrivacyPage.module.css'

export default function LegalPage() {
  return <div className={styles.page}>
    <SEOHead title="Mentions légales" description="Édition et hébergement du site Extia Gaming 24h." canonicalPath="/mentions-legales" />
    <h1 className={styles.title}>Mentions légales</h1>
    <p className={styles.updated}>Version du 16 octobre 2026 — coordonnées complètes à renseigner avant ouverture des inscriptions.</p>
    <div className={styles.content}>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Éditeur et organisateur</h2>
        <p className={styles.text}>Extia.</p>
        <p className={styles.text}>Dénomination sociale exacte, forme juridique, capital social, siège social, numéro SIREN / RCS et numéro de TVA le cas échéant : à compléter par Extia.</p>
        <p className={styles.text}>Coordonnées de l’éditeur (adresse électronique et téléphone) : à compléter.</p>
      </section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Directeur de la publication</h2><p className={styles.text}>Nom et prénom : à confirmer par Extia.</p></section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Hébergement</h2>
        <p className={styles.text}>Le site et sa base de données sont hébergés par Extia, en France.</p>
        <p className={styles.text}>Dénomination complète, adresse et numéro de téléphone du service ou de l’entité assurant l’hébergement : à compléter par Extia.</p>
      </section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Données personnelles</h2><p className={styles.text}>Pour toute demande relative à vos données : <a href="mailto:dpo@extia.fr">dpo@extia.fr</a>. Les finalités, bases légales, destinataires et droits sont détaillés dans la <a href="/politique-de-confidentialite">politique de confidentialité</a>.</p></section>
    </div>
  </div>
}
