import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { api } from '../services/api.ts'
import SEOHead from '../components/SEOHead.tsx'
import type { UserPublic } from '@extia-gaming/shared'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    const data = new FormData(e.currentTarget)
    const payload = {
      login: data.get('login') as string,
      firstname: data.get('firstname') as string,
      lastname: data.get('lastname') as string,
    }

    setIsSubmitting(true)
    try {
      await api.put<{ user: UserPublic }>('/api/users/me', payload)
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SEOHead title="Mon profil" description="Modifiez vos informations personnelles." canonicalPath="/profil" />
      <h1 className={styles.title}>Mon profil</h1>
      <p className={styles.subtitle}>Modifiez vos informations de participant.</p>
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit} aria-label="Formulaire de modification du profil">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login">Pseudo</label>
            <input className={styles.input} id="login" name="login" type="text" defaultValue={user.login} minLength={3} maxLength={50} required autoComplete="username" />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="firstname">Prénom</label>
              <input className={styles.input} id="firstname" name="firstname" type="text" defaultValue={user.firstname} required autoComplete="given-name" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lastname">Nom</label>
              <input className={styles.input} id="lastname" name="lastname" type="text" defaultValue={user.lastname} required autoComplete="family-name" />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Adresse email</label>
            <input
              className={`${styles.input} ${styles.inputReadonly}`}
              id="email"
              name="email"
              type="email"
              value={user.email}
              readOnly
              aria-describedby="email-hint"
              autoComplete="email"
            />
            <span id="email-hint" className={styles.hint}>L'adresse email ne peut pas être modifiée.</span>
          </div>
          {success && <p className={styles.success} role="status" aria-live="polite">✅ Profil mis à jour avec succès.</p>}
          {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
