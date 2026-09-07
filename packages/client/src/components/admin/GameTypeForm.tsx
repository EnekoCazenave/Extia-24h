import { useState, type FormEvent } from 'react'
import type { CalculConfig, CalculType, TimeTier } from '@extia-gaming/shared'
import styles from '../../pages/AdminPage.module.css'

export interface GameTypeFormValues {
  name: string
  win: string
  team: boolean
  calculConfig: CalculConfig
}

interface GameTypeFormProps {
  initialValues?: Partial<GameTypeFormValues>
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: GameTypeFormValues) => Promise<void>
  isPending: boolean
  showGameSelect?: boolean
  gameOptions?: Array<{ id: number; nom: string }>
  selectedGameId?: number
  onGameChange?: (id: number) => void
}

function initialCalculState(cfg: CalculConfig | undefined) {
  return {
    type: cfg?.type ?? 'BOOLEAN' as CalculType,
    trueValue: cfg?.type === 'BOOLEAN' ? cfg.trueValue : 10,
    falseValue: cfg?.type === 'BOOLEAN' ? cfg.falseValue : 0,
    multiplier: cfg?.type === 'NUMBER' ? cfg.multiplier : 1,
    tiers: cfg?.type === 'TIME' ? cfg.tiers : [{ timeSeconds: 60, points: 10 }] as TimeTier[],
  }
}

export default function GameTypeForm({
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit,
  isPending,
  showGameSelect = false,
  gameOptions = [],
  selectedGameId = 0,
  onGameChange,
}: GameTypeFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [win, setWin] = useState(initialValues?.win ?? '')
  const [team, setTeam] = useState(initialValues?.team ?? false)
  const init = initialCalculState(initialValues?.calculConfig)
  const [calculType, setCalculType] = useState<CalculType>(init.type)
  const [trueValue, setTrueValue] = useState<number>(init.trueValue)
  const [falseValue, setFalseValue] = useState<number>(init.falseValue)
  const [multiplier, setMultiplier] = useState<number>(init.multiplier)
  const [tiers, setTiers] = useState<TimeTier[]>(init.tiers)
  const [error, setError] = useState<string | null>(null)

  function buildCalculConfig(): CalculConfig | null {
    if (calculType === 'BOOLEAN') return { type: 'BOOLEAN', trueValue, falseValue }
    if (calculType === 'NUMBER') {
      if (multiplier <= 0) return null
      return { type: 'NUMBER', multiplier }
    }
    if (tiers.length === 0 || tiers.some((t) => t.timeSeconds <= 0)) return null
    return { type: 'TIME', tiers }
  }

  function updateTier(idx: number, patch: Partial<TimeTier>) {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }

  function addTier() { setTiers((prev) => [...prev, { timeSeconds: 60, points: 0 }]) }
  function removeTier(idx: number) { setTiers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx))) }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const calculConfig = buildCalculConfig()
    if (!calculConfig) { setError('Configuration de calcul invalide.'); return }
    if (showGameSelect && !selectedGameId) { setError('Sélectionnez un jeu.'); return }
    try {
      await onSubmit({ name, win, team, calculConfig })
    } catch {
      setError("Erreur lors de la soumission.")
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {showGameSelect && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gtf-game">Jeu *</label>
          <select
            className={styles.select}
            id="gtf-game"
            value={selectedGameId}
            onChange={(e) => onGameChange?.(parseInt(e.target.value, 10))}
            required
          >
            <option value={0}>Sélectionner un jeu…</option>
            {gameOptions.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
      )}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gtf-name">Nom du mode *</label>
        <input
          className={styles.input}
          id="gtf-name"
          type="text"
          required
          maxLength={100}
          placeholder="ex: 5v5 Classique"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <fieldset className={styles.fieldset}>
        <legend className={styles.fieldsetLegend}>Méthode de calcul *</legend>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gtf-calcul-type">Type</label>
          <select
            className={styles.select}
            id="gtf-calcul-type"
            value={calculType}
            onChange={(e) => setCalculType(e.target.value as CalculType)}
          >
            <option value="BOOLEAN">Booléen (oui / non)</option>
            <option value="NUMBER">Nombre (multiplicateur)</option>
            <option value="TIME">Temps (paliers)</option>
          </select>
        </div>

        {calculType === 'BOOLEAN' && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gtf-true">Points si vrai</label>
              <input
                className={styles.input}
                id="gtf-true"
                type="number"
                value={trueValue}
                onChange={(e) => setTrueValue(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gtf-false">Points si faux</label>
              <input
                className={styles.input}
                id="gtf-false"
                type="number"
                value={falseValue}
                onChange={(e) => setFalseValue(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
          </div>
        )}

        {calculType === 'NUMBER' && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gtf-mult">Multiplicateur</label>
            <input
              className={styles.input}
              id="gtf-mult"
              type="number"
              step="0.1"
              min="0.1"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value) || 0)}
              required
            />
            <span className={styles.hint}>Points = score saisi × multiplicateur.</span>
          </div>
        )}

        {calculType === 'TIME' && (
          <div className={styles.field}>
            <span className={styles.label}>Paliers de temps</span>
            <span className={styles.hint}>Temps (secondes) sous lequel le joueur gagne les points indiqués.</span>
            <div className={styles.tierList}>
              {tiers.map((tier, idx) => (
                <div key={idx} className={styles.tierRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`gtf-tier-time-${idx}`}>Temps (s)</label>
                    <input
                      className={styles.input}
                      id={`gtf-tier-time-${idx}`}
                      type="number"
                      min="1"
                      value={tier.timeSeconds}
                      onChange={(e) => updateTier(idx, { timeSeconds: parseInt(e.target.value, 10) || 0 })}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`gtf-tier-points-${idx}`}>Points</label>
                    <input
                      className={styles.input}
                      id={`gtf-tier-points-${idx}`}
                      type="number"
                      value={tier.points}
                      onChange={(e) => updateTier(idx, { points: parseInt(e.target.value, 10) || 0 })}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.removeTierBtn}
                    onClick={() => removeTier(idx)}
                    disabled={tiers.length <= 1}
                    aria-label={`Supprimer palier ${idx + 1}`}
                  >×</button>
                </div>
              ))}
            </div>
            <button type="button" className={styles.addTierBtn} onClick={addTier}>
              + Ajouter un palier
            </button>
          </div>
        )}
      </fieldset>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gtf-win">Condition de victoire *</label>
        <input
          className={styles.input}
          id="gtf-win"
          type="text"
          required
          placeholder="ex: Destruction du Nexus"
          value={win}
          onChange={(e) => setWin(e.target.value)}
        />
      </div>
      <div className={styles.checkRow}>
        <input
          className={styles.checkbox}
          id="gtf-team"
          type="checkbox"
          checked={team}
          onChange={(e) => setTeam(e.target.checked)}
        />
        <label className={styles.label} htmlFor="gtf-team">Mode équipe</label>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}
