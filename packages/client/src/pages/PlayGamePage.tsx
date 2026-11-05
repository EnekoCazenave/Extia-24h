import GameBanner from '../components/GameBanner.tsx'
import Modal from '../components/Modal.tsx'
import type { HonorProgress, CalculConfig } from '@extia-gaming/shared'
import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { isAxiosError } from 'axios'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {usePlatform, type PublicSettings} from '../hooks/usePlatform.ts'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import { useGame, useSubmitPlay } from '../hooks/useGames.ts'
import { useUsers } from '../hooks/useUsers.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { api } from '../services/api.ts'
import { computeAwards, PlayInputSchema, type PlayInput } from '@extia-gaming/shared'
import RulesPlayFields, { type RulesDraft } from '../components/RulesPlayFields.tsx'
import styles from './PlayGamePage.module.css'

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

export default function PlayGamePage() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>()
  const editing = Boolean(sessionId)
  const qc = useQueryClient()
  const settingsQuery = usePlatform<{settings: PublicSettings}>('/api/settings')
  const existing = useQuery({queryKey:['play',sessionId],enabled:editing,queryFn:async()=>(await api.get<{session:{id:number;status:string;gameId:number;input:PlayInput;calculConfig?:CalculConfig;happyHourMultiplier?:number}}>(`/api/play/${sessionId}`)).data.session})
  const gamesQuery = useQuery({queryKey:['games'],enabled:!id&&!editing,queryFn:async()=>(await api.get<{games:Array<{id:number;nom:string}>}>('/api/games')).data.games})
  const [chosenGameId,setChosenGameId] = useState(0)
  const [searchParams] = useSearchParams()
  const gameId = existing.data?.gameId ?? (id ? parseInt(id,10) : chosenGameId)
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
  const [existingProof,setExistingProof] = useState<string | undefined>()
  const [savingEdit,setSavingEdit] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [honor, setHonor] = useState<HonorProgress | null>(null)
  const [honorOpen, setHonorOpen] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rulesDraft, setRulesDraft] = useState<RulesDraft>({ values: {} })
  const [boolValue, setBoolValue] = useState<boolean>(true)
  const [numValue, setNumValue] = useState<string>('')
  const [timeSeconds, setTimeSeconds] = useState<string>('')

  const currentGameType = game?.gameTypes.find(
    (gt) => gt.id === (selectedGameTypeId || game?.gameTypes[0]?.id),
  )
  const selectedGameType = currentGameType && existing.data?.calculConfig ? {...currentGameType,calculConfig:existing.data.calculConfig,calculType:existing.data.calculConfig.type} : currentGameType
  const isTeamMode = selectedGameType?.team ?? false
  const happyHour = editing ? (existing.data?.happyHourMultiplier??1)>1 : game ? isHappyHourActive(game.happyHourStart, game.happyHourEnd) : false

  const otherUsers = allUsers.filter((u) => u.id !== me?.id)

  const suggestions = teamSearch.length >= 1
    ? otherUsers
        .filter((u) => {
          if (teamMemberIds.includes(u.id)) return false
          const q = teamSearch.toLowerCase()
          return (
            u.login.toLowerCase().includes(q)
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

  useEffect(() => {
    if (!existing.data) return
    const input=existing.data.input
    setSelectedGameTypeId(input.gameTypeId)
    setTeamMemberIds(input.teamMemberIds??[])
    setExistingProof(input.proofUrl)
    if(input.calculType==='BOOLEAN')setBoolValue(input.value)
    else if(input.calculType==='NUMBER')setNumValue(String(input.value))
    else if(input.calculType==='TIME')setTimeSeconds(String(input.timeSeconds))
    else setRulesDraft({values:input.values,mode:input.mode,results:input.results})
  },[existing.data])

  useEffect(() => () => {if(proofPreview)URL.revokeObjectURL(proofPreview)},[proofPreview])

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
    const base = { gameTypeId, teamMemberIds: isTeamMode ? teamMemberIds : [], proofUrl }
    if (selectedGameType.calculType === 'RULES') {
      const parsed = PlayInputSchema.safeParse({ ...base, calculType: 'RULES', ...rulesDraft })
      if (!parsed.success) return null
      computeAwards(selectedGameType.calculConfig, parsed.data, [me!.id, ...base.teamMemberIds])
      return parsed.data
    }
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
    const gameTypeId = editing ? selectedGameTypeId : parseInt(data.get('gameTypeId') as string, 10)

    if (isNaN(gameTypeId) || !selectedGameType) {
      setError('Sélectionnez un mode de jeu.')
      return
    }

    if(settingsQuery.isPending || settingsQuery.isError){setError('Impossible de vérifier les règles de preuve. Réessayez dans un instant.');return}
    if(settingsQuery.data?.settings.proofRequired && !proofFile && !existingProof){setError('Ajoutez une capture d’écran avant de soumettre votre déclaration.');return}

    try {
      if (!buildPlayInput(gameTypeId, undefined)) { setError('Veuillez remplir tous les champs correctement.'); return }
      let proofUrl: string | undefined = existingProof
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

      setSavingEdit(editing)
      const result = editing ? (await api.put<{session:{status:string;honor?:HonorProgress}}>(`/api/play/${sessionId}`,payload)).data.session : await submitPlay.mutateAsync(payload)
      if(editing)await qc.invalidateQueries()
      setSavingEdit(false)
      setApproved(result?.status === 'APPROVED')
      setHonor(result?.honor ?? null)
      setHonorOpen(Boolean(result?.honor?.next || result?.honor?.current))
      setSubmitted(true)
    } catch (err) {
      setUploading(false)
      setSavingEdit(false)
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Erreur de soumission.' : err instanceof Error ? err.message : 'Erreur de soumission.')
    }
  }

  if ((editing&&existing.isPending) || isLoading || (!id&&!editing&&gamesQuery.isPending)) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-muted)' }} aria-live="polite">Chargement…</p>
      </div>
    )
  }

  if (editing&&existing.isError) return <div className={styles.page}><h1>Modifier ma déclaration</h1><p role="alert">Impossible de charger cette déclaration.</p><button type="button" onClick={()=>void existing.refetch()}>Réessayer</button><Link to="/classement/me">Retour à mon historique</Link></div>

  const gameSelector = !id&&!editing ? <div className={styles.field}><label className={styles.label} htmlFor="declaration-game">Jeu</label><select id="declaration-game" className={styles.select} value={chosenGameId} onChange={e=>{setChosenGameId(Number(e.target.value));setSelectedGameTypeId(0);setTeamMemberIds([]);setRulesDraft({values:{}});setNumValue('');setTimeSeconds('');setBoolValue(true)}}><option value="0">Choisir un jeu</option>{gamesQuery.data?.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select></div> : null

  if (!gameId && !editing) return <div className={styles.page}><SEOHead title="Déclarer une partie" description="Déclarez votre résultat et joignez votre capture d’écran." canonicalPath="/declarer"/><div className={styles.card}><h1 className={styles.title}>Déclarer une partie</h1><p>Choisissez un jeu et son mode pour déclarer votre résultat.</p>{gamesQuery.isError?<p role="alert">Impossible de charger les jeux. <button type="button" onClick={()=>void gamesQuery.refetch()}>Réessayer</button></p>:gamesQuery.data?.length===0?<p>Aucun jeu disponible pour le moment.</p>:gameSelector}</div></div>

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
      <Modal open={honorOpen} title="Votre progression" onClose={()=>setHonorOpen(false)}>
        {honor&&<><p>{honor.totalPoints.toLocaleString('fr-FR')} points validés.</p>
          {honor.current&&<p>Palier atteint : <strong>{honor.current.name}</strong></p>}
          {honor.next?<p><strong>{honor.remaining.toLocaleString('fr-FR')} points</strong> avant d’atteindre le palier <strong>{honor.next.name}</strong>.</p>:<p>Vous avez atteint le dernier palier honorifique !</p>}
          <button type="button" onClick={()=>setHonorOpen(false)}>Continuer</button></>}
      </Modal>
      <GameBanner name={game.nom} imageUrl={game.imageUrl} />
      <SEOHead
        title={`${editing?"Modifier ma déclaration":"Soumettre une partie"} — ${game.nom}`}
        description={`Entrez votre score pour ${game.nom}.`}
        canonicalPath={editing?`/declarations/${sessionId}/modifier`:id?`/jeux/${game.id}/jouer`:'/declarer'}
      />
      <Link to={editing?'/classement/me':`/jeux/${game.id}`} className={styles.back}>{editing?'← Retour à mon historique':'← Retour au jeu'}</Link>
      <div className={styles.card}>
        <h1 className={styles.title}>{editing?"Modifier ma déclaration":"Soumettre une partie"}</h1>
        <p className={styles.gameName}>🎮 {game.nom}</p>
        {happyHour && (
          <div className={styles.happyHour} role="status" aria-live="polite">
            {editing?"Happy Hour appliquée à la déclaration initiale — son multiplicateur est conservé.":"⚡ Happy Hour active — votre score sera doublé !"}
          </div>
        )}
        {submitted ? (
          <div className={styles.success} role="status" aria-live="polite">
            <div>{editing?"Déclaration modifiée avec succès !":"✅ Partie soumise avec succès !"}</div>
            <div className={styles.pendingBadge}>
              {approved ? 'Partie validée automatiquement. Vos points sont crédités ; la modération peut encore rejeter la partie.' : '⏳ En attente de validation par un modérateur avant attribution des points.'}
            </div>
            <div style={{ marginTop: '12px' }}>
              <Link to={`/jeux/${game.id}`} style={{ color: 'var(--color-secondary)', fontSize: 'var(--text-sm)' }}>
                Retour au jeu →
              </Link>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label={`Formulaire de soumission pour ${game.nom}`}>
            {gameSelector}
            {editing&&<p>Corrigez votre résultat ou remplacez la preuve. Le jeu et le mode restent ceux de la déclaration initiale.</p>}
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="gameTypeId">Mode de jeu</label>
              <select
                className={styles.select}
                id="gameTypeId"
                name="gameTypeId"
                disabled={editing}
                value={selectedGameTypeId || game.gameTypes[0]?.id}
                onChange={(e) => {
                  setSelectedGameTypeId(parseInt(e.target.value, 10))
                  setTeamMemberIds([])
                  setRulesDraft({ values: {} })
                }}
                required
                aria-required="true"
              >
                {game.gameTypes.map((gt) => (
                  <option key={gt.id} value={gt.id}>{gt.name}{gt.team ? ' (équipe)' : ''}</option>
                ))}
              </select>
            </div>

            {selectedGameType?.maxPointsPerUser != null && <p>Limite : {selectedGameType.maxPointsPerUser} points par participant pour ce mode. Les points validés seront plafonnés au solde disponible.</p>}
            {selectedGameType?.maxPlaysPerUser != null && <p>Limite : {selectedGameType.maxPlaysPerUser} partie(s) par participant pour ce mode, validées ou en attente. Les parties refusées ne comptent pas.</p>}
            {selectedGameType?.calculConfig.type === 'RULES' && me && <RulesPlayFields key={selectedGameType.id} config={selectedGameType.calculConfig} value={rulesDraft} onChange={setRulesDraft} participants={[{ id: me.id, login: me.login }, ...otherUsers.filter(u => isTeamMode && teamMemberIds.includes(u.id))]} />}

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
              <label className={styles.label} htmlFor="proof">Preuve (capture d’écran){settingsQuery.data?.settings.proofRequired?' *':''}</label>
              {existingProof&&<p><a href={existingProof} target="_blank" rel="noreferrer">Voir la preuve actuelle</a>. Choisissez un fichier pour la remplacer.</p>}
              <input
                className={styles.fileInput}
                id="proof"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-required={Boolean(settingsQuery.data?.settings.proofRequired&&!existingProof)}
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
                        {u.login}
                        <button
                          type="button"
                          className={styles.teamChipRemove}
                          onClick={() => removeTeamMember(u.id)}
                          aria-label={`Retirer ${u.login}`}
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
                            <span className={styles.acName}>{u.login}</span>
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

            {settingsQuery.isError&&<p role="alert">Impossible de charger les règles de preuve. <button type="button" onClick={()=>void settingsQuery.refetch()}>Réessayer</button></p>}
            {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitPlay.isPending || uploading || savingEdit || settingsQuery.isPending || settingsQuery.isError}
            >
              {uploading ? 'Upload en cours…' : submitPlay.isPending || savingEdit ? 'Envoi…' : editing ? 'Enregistrer les modifications' : '🏅 Soumettre ma partie'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
