import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import SEOHead from '../components/SEOHead.tsx'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!consentChecked) return

    setError(null)
    const data = new FormData(e.currentTarget)

    setIsSubmitting(true)
    try {
      await register({
        login: data.get('login') as string,
        firstname: data.get('firstname') as string,
        lastname: data.get('lastname') as string,
        email: data.get('email') as string,
        password: data.get('password') as string,
        intern: false,
        consentAccepted: true,
      })
      navigate('/')
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 409) {
        setError('Email déjà utilisé. Essayez de vous connecter.')
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title="Créer un compte"
        description="Rejoignez l'événement Extia Gaming 24h."
        canonicalPath="/register"
      />

      <div className={styles.card}>
        <h1 className={styles.title} id="register-title">Créer un compte</h1>
        <p className={styles.subtitle}>Rejoignez l'événement Extia Gaming 24h !</p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="register-title"
        >
          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`} htmlFor="login">
              Pseudo
            </label>
            <input
              className={styles.input}
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={50}
              placeholder="Votre pseudo en jeu"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="firstname">
                Prénom
              </label>
              <input
                className={styles.input}
                id="firstname"
                name="firstname"
                type="text"
                autoComplete="given-name"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="lastname">
                Nom
              </label>
              <input
                className={styles.input}
                id="lastname"
                name="lastname"
                type="text"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`} htmlFor="email">
              Adresse email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`} htmlFor="password">
              Mot de passe
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className={styles.consentBox}>
            <input
              className={styles.consentCheckbox}
              id="consent"
              name="consent"
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              aria-required="true"
              aria-describedby="consent-desc"
            />
            <label className={styles.consentLabel} htmlFor="consent" id="consent-desc">
              J'ai lu et j'accepte la{' '}
              <Link to="/politique-de-confidentialite" target="_blank" rel="noopener">
                politique de confidentialité
              </Link>
              . Je consens au traitement de mes données personnelles (nom, prénom, email) dans le cadre de l'événement Extia Gaming 24h.
            </label>
          </div>

          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !consentChecked}
          >
            {isSubmitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className={styles.footer}>
          Déjà inscrit ?{' '}
          <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
