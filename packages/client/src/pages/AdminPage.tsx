import { useState, type FormEvent, type ChangeEvent } from 'react'
import SEOHead from '../components/SEOHead.tsx'
import { useGames } from '../hooks/useGames.ts'
import { useCreateGame, useAddGameType, useUpdateHappyHour, useGrantBonus } from '../hooks/useAdmin.ts'
import { api } from '../services/api.ts'
import styles from './AdminPage.module.css'

type Tab = 'create-game' | 'add-game-type' | 'happy-hour' | 'bonus'

const TABS: { id: Tab; label: string }[] = [
  { id: 'create-game', label: 'Ajouter un jeu' },
  { id: 'add-game-type', label: 'Type de partie' },
  { id: 'happy-hour', label: 'Happy Hour' },
  { id: 'bonus', label: 'Bonus de points' },
]

function CreateGamePanel() {
  const createGame = useCreateGame()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        setUploading(true)
        const form = new FormData()
        form.append('file', imageFile)
        const res = await api.post<{ url: string }>('/api/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = res.data.url
        setUploading(false)
      }
      await createGame.mutateAsync({
        nom: data.get('nom') as string,
        imageUrl,
        happyHourStart: (data.get('happyHourStart') as string) || undefined,
        happyHourEnd: (data.get('happyHourEnd') as string) || undefined,
      })
      setSuccess(true)
      setImageFile(null)
      setImagePreview(null)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setUploading(false)
      setError('Erreur lors de la création du jeu.')
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Ajouter un jeu</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nom">Nom du jeu *</label>
          <input className={styles.input} id="nom" name="nom" type="text" required maxLength={100} placeholder="ex: Rocket League" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="imageFile">Image du jeu</label>
          <input
            className={styles.fileInput}
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Aperçu" className={styles.imgPreview} />
          )}
          <span className={styles.hint}>Laisser vide pour l'image par défaut.</span>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourStart">Happy Hour — début</label>
            <input className={styles.input} id="happyHourStart" name="happyHourStart" type="datetime-local" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourEnd">Happy Hour — fin</label>
            <input className={styles.input} id="happyHourEnd" name="happyHourEnd" type="datetime-local" />
          </div>
        </div>
        {success && <p className={styles.success} role="status">✅ Jeu créé avec succès !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={createGame.isPending || uploading}>
          {uploading ? 'Upload…' : createGame.isPending ? 'Création…' : '+ Créer le jeu'}
        </button>
      </form>
    </div>
  )
}

function AddGameTypePanel() {
  const { data: games } = useGames()
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const addGameType = useAddGameType(selectedGameId)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGameId) { setError('Sélectionnez un jeu.'); return }
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    try {
      await addGameType.mutateAsync({
        name: data.get('name') as string,
        calcul: data.get('calcul') as string,
        win: data.get('win') as string,
        team: data.get('team') === 'on',
      })
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setError("Erreur lors de l'ajout du type de partie.")
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Ajouter un type de partie</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gameId">Jeu *</label>
          <select className={styles.select} id="gameId" value={selectedGameId} onChange={(e) => setSelectedGameId(parseInt(e.target.value, 10))} required>
            <option value={0}>Sélectionner un jeu…</option>
            {games?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Nom du mode *</label>
          <input className={styles.input} id="name" name="name" type="text" required maxLength={100} placeholder="ex: 5v5 Classique" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="calcul">Méthode de calcul *</label>
          <input className={styles.input} id="calcul" name="calcul" type="text" required placeholder="ex: Meilleur de 3" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="win">Condition de victoire *</label>
          <input className={styles.input} id="win" name="win" type="text" required placeholder="ex: Destruction du Nexus" />
        </div>
        <div className={styles.checkRow}>
          <input className={styles.checkbox} id="team" name="team" type="checkbox" />
          <label className={styles.label} htmlFor="team">Mode équipe</label>
        </div>
        {success && <p className={styles.success} role="status">✅ Type de partie ajouté !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={addGameType.isPending}>
          {addGameType.isPending ? 'Ajout…' : '+ Ajouter le type'}
        </button>
      </form>
    </div>
  )
}

function HappyHourPanel() {
  const { data: games } = useGames()
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const updateHappyHour = useUpdateHappyHour(selectedGameId)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGameId) { setError('Sélectionnez un jeu.'); return }
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    const start = data.get('happyHourStart') as string
    const end = data.get('happyHourEnd') as string
    try {
      await updateHappyHour.mutateAsync({
        happyHourStart: start ? new Date(start).toISOString() : null,
        happyHourEnd: end ? new Date(end).toISOString() : null,
      })
      setSuccess(true)
    } catch {
      setError('Erreur lors de la mise à jour de la Happy Hour.')
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Configurer une Happy Hour</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="hhGameId">Jeu *</label>
          <select className={styles.select} id="hhGameId" value={selectedGameId} onChange={(e) => setSelectedGameId(parseInt(e.target.value, 10))} required>
            <option value={0}>Sélectionner un jeu…</option>
            {games?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourStart">Heure de début</label>
            <input className={styles.input} id="happyHourStart" name="happyHourStart" type="datetime-local" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourEnd">Heure de fin</label>
            <input className={styles.input} id="happyHourEnd" name="happyHourEnd" type="datetime-local" />
          </div>
        </div>
        <span className={styles.hint}>Laissez vide pour désactiver la Happy Hour sur ce jeu.</span>
        {success && <p className={styles.success} role="status">✅ Happy Hour mise à jour !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={updateHappyHour.isPending}>
          {updateHappyHour.isPending ? 'Mise à jour…' : '⚡ Enregistrer la Happy Hour'}
        </button>
      </form>
    </div>
  )
}

function GrantBonusPanel() {
  const grantBonus = useGrantBonus()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    const userId = parseInt(data.get('userId') as string, 10)
    const points = parseInt(data.get('points') as string, 10)
    if (isNaN(userId) || isNaN(points) || points < 1) {
      setError('Identifiant joueur et points requis (points ≥ 1).')
      return
    }
    try {
      await grantBonus.mutateAsync({
        userId,
        points,
        reason: (data.get('reason') as string) || undefined,
      })
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setError("Erreur lors de l'attribution du bonus. Vérifiez l'ID du joueur.")
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Attribuer des points bonus</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="userId">Identifiant du joueur (ID) *</label>
          <input className={styles.input} id="userId" name="userId" type="number" min="1" required placeholder="ex: 42" />
          <span className={styles.hint}>L'ID numérique du joueur dans la base de données.</span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="points">Nombre de points *</label>
          <input className={styles.input} id="points" name="points" type="number" min="1" required placeholder="ex: 100" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reason">Raison (optionnel)</label>
          <input className={styles.input} id="reason" name="reason" type="text" maxLength={255} placeholder="ex: Prix fair-play" />
        </div>
        {success && <p className={styles.success} role="status">✅ Bonus attribué avec succès !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={grantBonus.isPending}>
          {grantBonus.isPending ? 'Attribution…' : '🎁 Attribuer le bonus'}
        </button>
      </form>
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('create-game')

  return (
    <div className={styles.page}>
      <SEOHead title="Administration" description="Interface administrateur — Extia Gaming 24h." canonicalPath="/admin" />
      <h1 className={styles.title}>Administration</h1>
      <p className={styles.subtitle}>Gérez les jeux, les modes de partie et les scores.</p>
      <div className={styles.tabList} role="tablist" aria-label="Sections d'administration">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'create-game' && <CreateGamePanel />}
        {activeTab === 'add-game-type' && <AddGameTypePanel />}
        {activeTab === 'happy-hour' && <HappyHourPanel />}
        {activeTab === 'bonus' && <GrantBonusPanel />}
      </div>
    </div>
  )
}
