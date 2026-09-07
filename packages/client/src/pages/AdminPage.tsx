import { useState, type FormEvent } from 'react'
import SEOHead from '../components/SEOHead.tsx'
import { useGrantBonus } from '../hooks/useAdmin.ts'
import AssociationsPanel from '../components/admin/AssociationsPanel.tsx'
import GamesPanel from '../components/admin/GamesPanel.tsx'
import GameTypesPanel from '../components/admin/GameTypesPanel.tsx'
import styles from './AdminPage.module.css'

type Tab = 'games' | 'game-types' | 'bonus' | 'associations'

const TABS: { id: Tab; label: string }[] = [
  { id: 'games', label: 'Jeux' },
  { id: 'game-types', label: 'Type de partie' },
  { id: 'bonus', label: 'Bonus de points' },
  { id: 'associations', label: 'Associations' },
]

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
  const [activeTab, setActiveTab] = useState<Tab>('games')

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
        {activeTab === 'games' && <GamesPanel />}
        {activeTab === 'game-types' && <GameTypesPanel />}
        {activeTab === 'bonus' && <GrantBonusPanel />}
        {activeTab === 'associations' && <AssociationsPanel />}
      </div>
    </div>
  )
}
