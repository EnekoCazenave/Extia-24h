import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import { useGame, useSubmitPlay } from '../hooks/useGames.ts'
import styles from './PlayGamePage.module.css'

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

interface SubmitResult {
  score: number
  happyHourApplied: boolean
  originalScore: number
}

export default function PlayGamePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const gameId = parseInt(id ?? '0', 10)
  const preselectedGameTypeId = parseInt(searchParams.get('gameTypeId') ?? '0', 10)

  const { data: game, isLoading } = useGame(gameId)
  const submitPlay = useSubmitPlay()

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const happyHour = game ? isHappyHourActive(game.happyHourStart, game.happyHourEnd) : false

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const data = new FormData(e.currentTarget)
    const gameTypeId = parseInt(data.get('gameTypeId') as string, 10)
    const score = parseInt(data.get('score') as string, 10)

    if (isNaN(gameTypeId) || isNaN(score) || score < 0) {
      setError('Veuillez remplir tous les champs correctement.')
      return
    }

    try {
      const session = await submitPlay.mutateAsync({ gameTypeId, score })
      setResult(session)
    } catch {
      setError('Une erreur est survenue lors de la soumission. Veuillez réessayer.')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-muted)' }} aria-live="polite">Chargement…</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error)' }} role="alert">Jeu introuvable.</p>
        <Link to="/jeux" className={styles.back}>← Retour aux jeux</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title={`Soumettre une partie — ${game.nom}`}
        description={`Entrez votre score pour ${game.nom}.`}
        canonicalPath={`/jeux/${game.id}/jouer`}
      />
      <Link to={`/jeux/${game.id}`} className={styles.back}>← Retour au jeu</Link>
      <div className={styles.card}>
        <h1 className={styles.title}>Soumettre une partie</h1>
        <p className={styles.gameName}>🎮 {game.nom}</p>
        {happyHour && (
          <div className={styles.happyHour} role="status" aria-live="polite">
            ⚡ Happy Hour active — votre score sera doublé !
          </div>
        )}
        {result ? (
          <div className={styles.success} role="status" aria-live="polite">
            <div>✅ Score soumis avec succès !</div>
            <div>Score final : <strong>{result.score.toLocaleString('fr-FR')} pts</strong></div>
            {result.happyHourApplied && (
              <div className={styles.successBonus}>
                ⚡ Bonus Happy Hour appliqué — score original : {result.originalScore.toLocaleString('fr-FR')} pts
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <Link to={`/jeux/${game.id}`} style={{ color: 'var(--color-secondary)', fontSize: 'var(--text-sm)' }}>
                Voir le classement →
              </Link>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label={`Formulaire de soumission pour ${game.nom}`}>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="gameTypeId">Mode de jeu</label>
              <select
                className={styles.select}
                id="gameTypeId"
                name="gameTypeId"
                defaultValue={preselectedGameTypeId || game.gameTypes[0]?.id}
                required
                aria-required="true"
              >
                {game.gameTypes.map((gt) => (
                  <option key={gt.id} value={gt.id}>{gt.name}{gt.team ? ' (équipe)' : ''}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="score">
                Score obtenu
                {happyHour && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>× 2</span>}
              </label>
              <input
                className={styles.input}
                id="score"
                name="score"
                type="number"
                min="0"
                step="1"
                required
                aria-required="true"
                placeholder="ex: 1500"
              />
            </div>
            {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={submitPlay.isPending}>
              {submitPlay.isPending ? 'Envoi…' : '🏅 Soumettre ma partie'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
