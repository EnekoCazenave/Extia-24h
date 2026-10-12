import { useState, type FormEvent } from 'react'
import { CalculConfigSchema, defaultRules, methodLabels, type ScoringMethod, type CalculConfig, type CalculType, type TimeTier } from '@extia-gaming/shared'
import RulesEditor from './RulesEditor.tsx'
import styles from '../../pages/AdminPage.module.css'
import layout from './GameTypeForm.module.css'

export interface GameTypeFormValues {
  name: string
  win: string
  team: boolean
  maxPlaysPerUser: number | null
  maxPointsPerUser: number | null
  calculConfig: CalculConfig
}

interface GameTypeFormProps {
  initialValues?: Partial<GameTypeFormValues>
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: GameTypeFormValues) => Promise<void>
  isPending: boolean
  onCancel?: () => void
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
  onCancel,
  showGameSelect = false,
  gameOptions = [],
  selectedGameId = 0,
  onGameChange,
}: GameTypeFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [win, setWin] = useState(initialValues?.win ?? '')
  const [team, setTeam] = useState(initialValues?.team ?? false)
  const [limitType, setLimitType] = useState<'plays' | 'points'>(initialValues?.maxPointsPerUser != null ? 'points' : 'plays')
  const [maxPlays, setMaxPlays] = useState((initialValues?.maxPointsPerUser ?? initialValues?.maxPlaysPerUser)?.toString() ?? '')
  const init = initialCalculState(initialValues?.calculConfig)
  const [calculType, setCalculType] = useState<CalculType>(init.type)
  const [trueValue, setTrueValue] = useState<number>(init.trueValue)
  const [falseValue, setFalseValue] = useState<number>(init.falseValue)
  const [multiplier, setMultiplier] = useState<number>(init.multiplier)
  const [tiers, setTiers] = useState<TimeTier[]>(init.tiers)
  const [rules, setRules] = useState(initialValues?.calculConfig?.type === 'RULES' ? initialValues.calculConfig : defaultRules('MATCH'))
  const [error, setError] = useState<string | null>(null)

  function buildCalculConfig(): CalculConfig | null {
    if (calculType === 'RULES') { const parsed = CalculConfigSchema.safeParse(rules); return parsed.success ? parsed.data : null }
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
      const maxPlaysPerUser = limitType !== 'plays' || maxPlays === '' ? null : Number(maxPlays)
      const maxPointsPerUser = limitType !== 'points' || maxPlays === '' ? null : Number(maxPlays)
      if (maxPlaysPerUser !== null && (!Number.isInteger(maxPlaysPerUser) || maxPlaysPerUser < 1 || maxPlaysPerUser > 2147483647)) {
        setError('Le maximum de parties doit être un entier supérieur ou égal à 1.'); return
      }
      if (maxPointsPerUser !== null && (!Number.isFinite(maxPointsPerUser) || maxPointsPerUser < 0.000001 || maxPointsPerUser > 1e9 || Math.abs(maxPointsPerUser * 1e6 - Math.round(maxPointsPerUser * 1e6)) > 0.00001)) {
        setError('Le maximum de points doit être positif, avec au plus six décimales.'); return
      }
      await onSubmit({ name, win, team, calculConfig, maxPlaysPerUser, maxPointsPerUser })
    } catch {
      setError("Erreur lors de la soumission.")
    }
  }

  return (
    <form className={layout.form} onSubmit={handleSubmit} onInvalidCapture={e => {
      let parent = (e.target as HTMLElement).parentElement
      while (parent && parent !== e.currentTarget) {
        if (parent instanceof HTMLDetailsElement) parent.open = true
        parent = parent.parentElement
      }
    }}>
      <p className={layout.intro}>Définissez le mode et les points qu’il rapporte.</p>
      <section className={layout.section} aria-labelledby="gtf-mode-heading">
      <h4 id="gtf-mode-heading" className={layout.heading}>Le mode de jeu</h4>
      <div className={showGameSelect ? layout.columns : undefined}>
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
      </div>
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

      </section>
      <fieldset className={layout.scoring}>
        <legend className={layout.heading}>Le barème</legend>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gtf-calcul-type">Type</label>
          <select
            className={styles.select}
            id="gtf-calcul-type"
            value={calculType === 'RULES' ? rules.method : calculType}
            onChange={(e) => {
              const selected = e.target.value
              if (selected === 'BOOLEAN' || selected === 'NUMBER' || selected === 'TIME') {
                setCalculType(selected)
              } else {
                setCalculType('RULES')
                if (selected !== rules.method) setRules(defaultRules(selected as ScoringMethod))
              }
            }}
          >
            <option value="BOOLEAN">Booléen (oui / non)</option>
            <option value="NUMBER">Nombre (multiplicateur)</option>
            <option value="TIME">Temps (paliers)</option>
            {Object.entries(methodLabels).map(([method, label]) => <option key={method} value={method}>{label}</option>)}
          </select>
        </div>

        {calculType === 'RULES' && <RulesEditor value={rules} onChange={setRules} hideLimit />}
        {calculType === 'BOOLEAN' && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gtf-true">Points si vrai</label>
              <input
                className={styles.input}
                id="gtf-true"
                type="number"
                step="0.01"
                value={trueValue}
                onChange={(e) => setTrueValue(Number(e.target.value))}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gtf-false">Points si faux</label>
              <input
                className={styles.input}
                id="gtf-false"
                type="number"
                step="0.01"
                value={falseValue}
                onChange={(e) => setFalseValue(Number(e.target.value))}
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
              step="0.01"
              min="0.01"
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
                      step="0.01"
                      value={tier.points}
                      onChange={(e) => updateTier(idx, { points: Number(e.target.value) })}
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
      <details className={layout.disclosure}>
        <summary>Limites <span>{maxPlays === '' ? 'Illimité pour ce type' : maxPlays + (limitType === 'plays' ? ' partie(s) par utilisateur' : ' points par utilisateur')}{calculType === 'RULES' && rules.maxPoints != null ? ' · Plafond par jeu actif' : ''}</span></summary>
        <div className={layout.disclosureBody}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gtf-limit-type">Limiter par</label>
        <select className={styles.select} id="gtf-limit-type" value={limitType} onChange={e => { setLimitType(e.target.value as 'plays' | 'points'); setMaxPlays('') }}>
          <option value="plays">Nombre de parties</option>
          <option value="points">Nombre de points</option>
        </select>
        <label className={styles.label} htmlFor="gtf-max-plays">{limitType === 'plays' ? 'Maximum de parties par utilisateur' : 'Maximum de points par utilisateur'}</label>
        <input className={styles.input} id="gtf-max-plays" type="number" min={limitType === 'plays' ? 1 : 0.000001} max={limitType === 'plays' ? 2147483647 : 1e9} step={limitType === 'plays' ? 1 : 0.000001} placeholder="Illimité" value={maxPlays} onChange={e => setMaxPlays(e.target.value)} aria-describedby="gtf-max-plays-help" />
        <span className={styles.hint} id="gtf-max-plays-help">Laisser vide pour rester illimité. {limitType === 'plays' ? 'Les parties validées et en attente comptent ; les refusées ne comptent pas.' : 'Les points validés sont plafonnés pour ce type de partie. La dernière partie rapporte uniquement le solde disponible.'}</span>
      </div>

        {calculType === 'RULES' && <label className={styles.field}>Plafond cumulé individuel par jeu (vide = sans plafond)
          <input className={styles.input} type="number" min="0" step="any" value={rules.maxPoints ?? ''} onChange={e => setRules({ ...rules, maxPoints: e.target.value === '' ? null : Number(e.target.value) })} />
          <span className={styles.hint}>Ce plafond par jeu est distinct de la limite de ce type de partie.</span>
        </label>}
        </div>
      </details>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={layout.actions}>
      {onCancel && <button type="button" className={layout.cancel} onClick={onCancel} disabled={isPending}>Annuler</button>}
      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </button>
      </div>
    </form>
  )
}
