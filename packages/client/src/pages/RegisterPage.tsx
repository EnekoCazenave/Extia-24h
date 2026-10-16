import { GroupSelect } from '../components/CommunityContent.tsx'
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import SEOHead from '../components/SEOHead.tsx'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [groupId,setGroupId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [statisticsConsent, setStatisticsConsent] = useState(false)
  const [adultConfirmed, setAdultConfirmed] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!termsChecked || !adultConfirmed || !e.currentTarget.reportValidity()) return

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
        ...(groupId ? { groupId: Number(groupId) } : {}),
        termsAccepted: true,
        statisticsConsent,
        adultConfirmed: true,
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
          aria-labelledby="register-title"
        >
          <GroupSelect value={groupId} onChange={setGroupId} />
          <p>Les champs marqués d’un astérisque sont obligatoires pour créer votre compte. La provenance et le consentement aux statistiques sont facultatifs.</p>
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
              aria-describedby="pseudo-hint"
            />
            <p id="pseudo-hint">Votre pseudo et vos scores sont publics. Choisissez un pseudo qui ne révèle pas votre identité réelle.</p>
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
            <input className={styles.consentCheckbox} id="adult" name="adult" type="checkbox" checked={adultConfirmed} onChange={e => setAdultConfirmed(e.target.checked)} required />
            <label className={styles.consentLabel} htmlFor="adult">Je confirme avoir 18 ans ou plus (obligatoire).</label>
          </div>
          <div className={styles.consentBox}>
            <input
              className={styles.consentCheckbox}
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              required
            />
            <label className={styles.consentLabel} htmlFor="terms">
              J’accepte le <Link to="/reglement" target="_blank" rel="noopener">règlement de l’événement</Link> (obligatoire).
            </label>
          </div>
          <p>Vos données sont traitées conformément à notre <Link to="/politique-de-confidentialite" target="_blank" rel="noopener">Politique de Confidentialité</Link>.</p>
          <div className={styles.consentBox}>
            <input className={styles.consentCheckbox} id="statistics" name="statistics" type="checkbox" checked={statisticsConsent} onChange={e => setStatisticsConsent(e.target.checked)} aria-describedby="statistics-hint" />
            <label className={styles.consentLabel} htmlFor="statistics">J’accepte que ma provenance et ma participation soient utilisées pour établir les statistiques de l’événement (facultatif).</label>
          </div>
          <p id="statistics-hint">Le refus ne change pas votre participation. Vous pouvez retirer ce consentement à tout moment depuis votre profil.</p>

          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !termsChecked || !adultConfirmed}
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
