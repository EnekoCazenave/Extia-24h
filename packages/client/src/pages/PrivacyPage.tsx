import SEOHead from '../components/SEOHead.tsx'
import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <SEOHead title="Politique de confidentialité" description="Politique de confidentialité de l'événement Extia Gaming 24h." canonicalPath="/politique-de-confidentialite" />
      <h1 className={styles.title}>Politique de confidentialité</h1>
      <p className={styles.updated}>Dernière mise à jour : avril 2026</p>
      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="intro-title">
          <h2 className={styles.sectionTitle} id="intro-title">Introduction</h2>
          <p className={styles.text}>Dans le cadre de l'événement <strong>Extia Gaming 24h</strong>, nous collectons et traitons vos données personnelles conformément au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés.</p>
          <p className={styles.text}>En créant un compte sur cette plateforme, vous consentez expressément au traitement de vos données dans les conditions décrites ci-dessous.</p>
        </section>
        <section className={styles.section} aria-labelledby="data-title">
          <h2 className={styles.sectionTitle} id="data-title">Données collectées</h2>
          <p className={styles.text}>Nous collectons les informations suivantes :</p>
          <ul className={styles.list}>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Pseudo (login) choisi par l'utilisateur</li>
            <li>Statut interne/externe Extia</li>
            <li>Scores et résultats de parties</li>
          </ul>
        </section>
        <section className={styles.section} aria-labelledby="purpose-title">
          <h2 className={styles.sectionTitle} id="purpose-title">Finalités du traitement</h2>
          <p className={styles.text}>Vos données sont utilisées exclusivement pour :</p>
          <ul className={styles.list}>
            <li>Gérer votre inscription et authentification à l'événement</li>
            <li>Afficher les classements et scores sur la plateforme</li>
            <li>Attribuer des récompenses et trophées</li>
            <li>Organiser et animer l'événement</li>
          </ul>
        </section>
        <section className={styles.section} aria-labelledby="retention-title">
          <h2 className={styles.sectionTitle} id="retention-title">Durée de conservation</h2>
          <p className={styles.text}>Vos données sont conservées pendant la durée de l'événement et supprimées dans un délai de <strong>90 jours</strong> après la clôture de celui-ci, sauf obligation légale contraire.</p>
        </section>
        <section className={styles.section} aria-labelledby="rights-title">
          <h2 className={styles.sectionTitle} id="rights-title">Vos droits</h2>
          <p className={styles.text}>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className={styles.list}>
            <li><strong>Droit d'accès</strong> — consulter les données que nous détenons sur vous</li>
            <li><strong>Droit de rectification</strong> — corriger vos informations via la page Profil</li>
            <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte</li>
            <li><strong>Droit d'opposition</strong> — vous opposer au traitement de vos données</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
          </ul>
        </section>
        <section className={styles.section} aria-labelledby="security-title">
          <h2 className={styles.sectionTitle} id="security-title">Sécurité</h2>
          <p className={styles.text}>Vos mots de passe sont chiffrés avec bcrypt (12 rounds). Les tokens d'authentification sont stockés dans des cookies <code>httpOnly; Secure; SameSite=Strict</code>, inaccessibles aux scripts.</p>
        </section>
        <div className={styles.contact}>
          <strong>Contact DPO</strong><br />
          Pour exercer vos droits, contactez-nous à : <a href="mailto:dpo@extia.fr" style={{ color: 'var(--color-accent)' }}>dpo@extia.fr</a><br /><br />
          Vous pouvez également adresser une réclamation à la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)' }}>CNIL</a>.
        </div>
      </div>
    </div>
  )
}
