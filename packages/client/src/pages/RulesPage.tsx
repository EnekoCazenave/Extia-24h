import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import styles from './PrivacyPage.module.css'

export default function RulesPage() {
  return <div className={styles.page}>
    <SEOHead title="Règlement de l’événement" description="Conditions de participation à Extia Gaming 24h." canonicalPath="/reglement" />
    <h1 className={styles.title}>Règlement de l’événement</h1>
    <p className={styles.updated}>Version du 16 octobre 2026 — à valider par l’organisateur avant ouverture des inscriptions.</p>
    <div className={styles.content}>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Organisateur et participation</h2><p className={styles.text}>Extia organise l’événement Extia Gaming 24h. La participation est réservée aux personnes âgées de 18 ans ou plus. La date de lancement sera communiquée par l’organisateur ; les horaires des activités sont publiés dans le <Link to="/programme">programme</Link>.</p></section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Compte et comportement</h2><p className={styles.text}>Un compte personnel est nécessaire pour s’inscrire aux activités et déclarer ses parties. Les participants fournissent des informations exactes, protègent leurs identifiants et respectent les autres joueurs ainsi que les règles propres à chaque activité. Les déclarations de résultats doivent être sincères et peuvent être vérifiées par l’équipe organisatrice.</p></section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Activités et classements</h2><p className={styles.text}>Les horaires, capacités et règles de points sont présentés sur les pages des activités et des jeux. Les inscriptions sont soumises aux places disponibles. Les résultats validés alimentent les classements publics sous votre pseudo. Choisissez un pseudo qui ne révèle pas votre identité réelle.</p></section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Données et choix facultatifs</h2><p className={styles.text}>L’inscription, l’authentification et la gestion de votre participation reposent sur l’exécution des présentes conditions de participation. La provenance est facultative ; si renseignée, elle rattache vos points à votre groupe. Le consentement aux statistiques est distinct, facultatif et retirable depuis le profil, sans effet sur votre participation. Consultez la <Link to="/politique-de-confidentialite">politique de confidentialité</Link>.</p></section>
      <section className={styles.section}><h2 className={styles.sectionTitle}>Images, partenaires et dons</h2><p className={styles.text}>Les utilisateurs du site ne sont pas diffusés sur les photos ou streams de l’événement. Le site ne transmet pas leurs données aux partenaires ou associations bénéficiaires et ne collecte aucun don ni aucune donnée bancaire. Les éventuels liens de dons conduisent vers des services externes soumis à leurs propres conditions.</p></section>
    </div>
  </div>
}
