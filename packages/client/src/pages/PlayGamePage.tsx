import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import { useGame, useSubmitPlay } from '../hooks/useGames.ts'
import { useUsers } from '../hooks/useUsers.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { api } from '../services/api.ts'
import type { PlayInput } from '@extia-gaming/shared'
import styles from './PlayGamePage.module.css'

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

export default function PlayGamePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const gameId = parseInt(id ?? '0', 10)
  const preselectedGameTypeId = parseInt(searchParams.get('gameTypeId') ?? '0', 10)

  const { data: game, isLoading } = useGame(gameId)
  const { data: allUsers = [] } = useUsers()
  const { user: me } = useAuth()
  const submitPlay = useSubmitPlay()

  const [selectedGameTypeId, setSelectedGameTypeId] = useState<number>(preselectedGameTypeId || 0)
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([])
  const [teamSearch, setTeamSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const teamBoxRef = useRef<HTMLDivElement>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [boolValue, setBoolValue] = useState<boolean>(true)
  const [numValue, setNumValue] = useState<string>('')
  const [timeSeconds, setTimeSeconds] = useState<string>('')

  const selectedGameType = game?.gameTypes.find(
    (gt) => gt.id === (selectedGameTypeId || game?.gameTypes[0]?.id),
  )
  const isTeamMode = selectedGameType?.team ?? false
  const happyHour = game ? isHappyHourActive(game.happyHourStart, game.happyHourEnd) : false

  const otherUsers = allUsers.filter((u) => u.id !== me?.id)

  const suggestions = teamSearch.length >= 1
    ? otherUsers
        .filter((u) => {
          if (teamMemberIds.includes(u.id)) return false
          const q = teamSearch.toLowerCase()
          return (
            u.login.toLowerCase().includes(q) ||
            u.firstname.toLowerCase().includes(q) ||
            u.lastname.toLowerCase().includes(q)
          )
        })
        .slice(0, 8)
    : []

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (teamBoxRef.current && !teamBoxRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function addTeamMember(uid: number) {
    setTeamMemberIds((prev) => (prev.includes(uid) ? prev : [...prev, uid]))
    setTeamSearch('')
    setShowDropdown(false)
  }

  function removeTeamMember(uid: number) {
    setTeamMemberIds((prev) => prev.filter((x) => x !== uid))
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setProofFile(file)
    if (file) {
      setProofPreview(URL.createObjectURL(file))
    } else {
      setProofPreview(null)
    }
  }

  function buildPlayInput(gameTypeId: number, proofUrl: string | undefined): PlayInput | null {
    if (!selectedGameType) return null
    const base = { gameTypeId, teamMemberIds, proofUrl }
    if (selectedGameType.calculType === 'BOOLEAN') {
      return { ...base, calculType: 'BOOLEAN', value: boolValue }
    }
    if (selectedGameType.calculType === 'NUMBER') {
      const v = parseFloat(numValue)
      if (isNaN(v) || v < 0) return null
      return { ...base, calculType: 'NUMBER', value: v }
    }
    const t = parseInt(timeSeconds, 10)
    if (isNaN(t) || t < 0) return null
    return { ...base, calculType: 'TIME', timeSeconds: t }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const data = new FormData(e.currentTarget)
    const gameTypeId = parseInt(data.get('gameTypeId') as string, 10)

    if (isNaN(gameTypeId) || !selectedGameType) {
      setError('Sélectionnez un mode de jeu.')
      return
    }

    try {
      let proofUrl: string | undefined
      if (proofFile) {
        setUploading(true)
        const form = new FormData()
        form.append('file', proofFile)
        const res = await api.post<{ url: string }>('/api/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        proofUrl = res.data.url
        setUploading(false)
      }

      const payload = buildPlayInput(gameTypeId, proofUrl)
      if (!payload) {
        setError('Veuillez remplir tous les champs correctement.')
        return
      }

      await submitPlay.mutateAsync(payload)
      setSubmitted(true)
    } catch {
      setUploading(false)
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

  const selectedMembers = allUsers.filter((u) => teamMemberIds.includes(u.id))


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
        {submitted ? (
          <div className={styles.success} role="status" aria-live="polite">
            <div>✅ Partie soumise avec succès !</div>
            <div className={styles.pendingBadge}>
              ⏳ En attente de validation par un modérateur avant attribution des points.
            </div>
            <div style={{ marginTop: '12px' }}>
              <Link to={`/jeux/${game.id}`} style={{ color: 'var(--color-secondary)', fontSize: 'var(--text-sm)' }}>
                Retour au jeu →
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
                value={selectedGameTypeId || game.gameTypes[0]?.id}
                onChange={(e) => {
                  setSelectedGameTypeId(parseInt(e.target.value, 10))
                  setTeamMemberIds([])
                }}
                required
                aria-required="true"
              >
                {game.gameTypes.map((gt) => (
                  <option key={gt.id} value={gt.id}>{gt.name}{gt.team ? ' (équipe)' : ''}</option>
                ))}
              </select>
            </div>

            {selectedGameType?.calculType === 'BOOLEAN' && (
              <div className={styles.field}>
                <label className={`${styles.label} ${styles.required}`}>
                  Résultat
                  {happyHour && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>× 2</span>}
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="boolValue" checked={boolValue === true} onChange={() => setBoolValue(true)} />
                    Oui
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="radio" name="boolValue" checked={boolValue === false} onChange={() => setBoolValue(false)} />
                    Non
                  </label>
                </div>
              </div>
            )}

            {selectedGameType?.calculType === 'NUMBER' && (
              <div className={styles.field}>
                <label className={`${styles.label} ${styles.required}`} htmlFor="numValue">
                  Score obtenu
                  {happyHour && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>× 2</span>}
                </label>
                <input
                  className={styles.input}
                  id="numValue"
                  type="number"
                  min="0"
                  step="any"
                  required
                  aria-required="true"
                  placeholder="ex: 1500"
                  value={numValue}
                  onChange={(e) => setNumValue(e.target.value)}
                />
              </div>
            )}

            {selectedGameType?.calculType === 'TIME' && (
              <div className={styles.field}>
                <label className={`${styles.label} ${styles.required}`} htmlFor="timeSeconds">
                  Temps réalisé (secondes)
                  {happyHour && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>× 2</span>}
                </label>
                <input
                  className={styles.input}
                  id="timeSeconds"
                  type="number"
                  min="0"
                  step="1"
                  required
                  aria-required="true"
                  placeholder="ex: 120"
                  value={timeSeconds}
                  onChange={(e) => setTimeSeconds(e.target.value)}
                />
                <span className={styles.hint}>
                  Paliers :{' '}
                  {[...(selectedGameType.calculConfig.type === 'TIME' ? selectedGameType.calculConfig.tiers : [])]
                    .sort((a, b) => a.timeSeconds - b.timeSeconds)
                    .map((t) => `≤${t.timeSeconds}s → ${t.points} pts`)
                    .join(' • ')}
                </span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="proof">Preuve (capture d'écran)</label>
              <input
                className={styles.fileInput}
                id="proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {proofPreview && (
                <img src={proofPreview} alt="Aperçu de la preuve" className={styles.previewImg} />
              )}
            </div>

            {isTeamMode && (
              <div className={styles.teamBox} ref={teamBoxRef}>
                <div className={styles.teamTitle}>👥 Membres de l'équipe</div>
                {selectedMembers.length > 0 && (
                  <div className={styles.teamSelected}>
                    {selectedMembers.map((u) => (
                      <span key={u.id} className={styles.teamChip}>
                        {u.firstname} {u.lastname}
                        <button
                          type="button"
                          className={styles.teamChipRemove}
                          onClick={() => removeTeamMember(u.id)}
                          aria-label={`Retirer ${u.firstname} ${u.lastname}`}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.acWrapper}>
                  <input
                    className={styles.teamSearch}
                    type="text"
                    placeholder="Ajouter un coéquipier…"
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => teamSearch.length >= 1 && setShowDropdown(true)}
                    aria-label="Ajouter un coéquipier"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown && suggestions.length > 0}
                  />
                  {showDropdown && suggestions.length > 0 && (
                    <ul className={styles.acDropdown} role="listbox" aria-label="Suggestions de coéquipiers">
                      {suggestions.map((u) => (
                        <li key={u.id} role="option">
                          <button
                            type="button"
                            className={styles.acItem}
                            onMouseDown={(e) => { e.preventDefault(); addTeamMember(u.id) }}
                          >
                            <span className={styles.acName}>{u.firstname} {u.lastname}</span>
                            <span className={styles.acLogin}>{u.login}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {showDropdown && teamSearch.length >= 1 && suggestions.length === 0 && (
                    <div className={styles.acEmpty}>Aucun joueur trouvé.</div>
                  )}
                </div>
              </div>
            )}

            {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitPlay.isPending || uploading}
            >
              {uploading ? 'Upload en cours…' : submitPlay.isPending ? 'Envoi…' : '🏅 Soumettre ma partie'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
