import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <SEOHead title="Page introuvable" description="La page que vous cherchez n'existe pas." canonicalPath="/404" />
      <div className={styles.code} aria-hidden="true">404</div>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.message}>La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className={styles.link}>← Retour à l'accueil</Link>
    </div>
  )
}
