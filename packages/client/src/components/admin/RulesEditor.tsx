import { type RulesConfig, type ScoringMethod } from '@extia-gaming/shared'
import styles from '../../pages/AdminPage.module.css'
import layout from './GameTypeForm.module.css'

const numbers: Array<{ key: keyof RulesConfig; label: string; methods: ScoringMethod[] }> = [
  { key: 'winPoints', label: 'Points de victoire', methods: ['MATCH','RUN','HADES','HUNT'] },
  { key: 'lossPoints', label: 'Points de défaite', methods: ['MATCH','RUN','HADES','HUNT'] },
  { key: 'difficultyStep', label: 'Coefficient supplémentaire par niveau de difficulté', methods: ['RUN','HADES'] },
  { key: 'firstWinBonus', label: 'Bonus de première réussite depuis zéro', methods: ['HADES'] },
  { key: 'completionBonus', label: 'Bonus de fin (Ligue / jeu terminé depuis le début)', methods: ['COUNTER','PROGRESSION'] },
  { key: 'resumedMultiplier', label: 'Multiplicateur pour sauvegarde reprise / Nouvelle partie +', methods: ['PROGRESSION'] },
  { key: 'maxRankPoints', label: 'Maximum de points (top 1)', methods: ['BATTLE_ROYALE'] },
  { key: 'scoreMultiplier', label: 'Points par unité de score', methods: ['SCORE'] },
  { key: 'attendancePoints', label: 'Contribution au pot par participant', methods: ['MINIGAME'] },
  { key: 'winnerShare', label: 'Part du pot réservée au vainqueur (0,05 = 5 %)', methods: ['MINIGAME'] },
  { key: 'communityPool', label: 'Pot des objectifs communs atteints', methods: ['MINECRAFT'] },
  { key: 'eligibilityScore', label: 'Score minimum pour partager le pot', methods: ['MINECRAFT'] },
]

export default function RulesEditor({ value, onChange, hideLimit = false }: { value: RulesConfig; onChange: (value: RulesConfig) => void; hideLimit?: boolean }) {
  function patch(change: Partial<RulesConfig>) { onChange({ ...value, ...change }) }
  function number(label: string, value: number, change: (v: number) => void, max = 1e9, step = 0.01, min = 0) {
    return <label className={styles.field}>{label}<input className={styles.input} type="number" min={min} max={max} step={step} required value={value} onChange={e => change(Number(e.target.value))} /></label>
  }
  return <div className={styles.rulesEditor}>
    <p className={styles.hint}>Les valeurs à zéro sont à définir par l’organisation. Les scores sont calculés sur le serveur puis soumis à modération.</p>
    <div className={layout.columns}>
    {numbers.filter(field => field.methods.includes(value.method)).map(field => <div key={field.key}>{number(field.label, value[field.key] as number, n => patch({ [field.key]: n }), field.key === 'winnerShare' ? 1 : undefined)}</div>)}
    </div>
    {value.method === 'RUN' && <fieldset className={styles.fieldset}><legend className={styles.fieldsetLegend}>Points supplémentaires par difficulté (facultatif)</legend>
      {value.difficultyPoints.map((points, i) => <div key={i}>{number(`Niveau ${i}`, points, n => patch({ difficultyPoints: value.difficultyPoints.map((v,j) => j === i ? n : v) }))}</div>)}
      <button type="button" onClick={() => patch({ difficultyPoints: [...value.difficultyPoints, 0] })}>Ajouter un niveau</button>
      <button type="button" onClick={() => patch({ difficultyPoints: value.difficultyPoints.slice(0,-1) })}>Retirer le dernier niveau</button>
    </fieldset>}
    {!hideLimit && <label className={styles.field}>Plafond cumulé individuel par jeu (vide = sans plafond)
      <input className={styles.input} type="number" min="0" step="any" value={value.maxPoints ?? ''} onChange={e => patch({ maxPoints: e.target.value === '' ? null : Number(e.target.value) })} />
    </label>}
    {value.method === 'MINECRAFT' && <label className={styles.field}>Répartition du pot commun<select className={styles.select} value={value.communitySplit} onChange={e => patch({ communitySplit: e.target.value as 'EQUAL' | 'PROPORTIONAL' })}><option value="EQUAL">À parts égales</option><option value="PROPORTIONAL">Proportionnellement aux scores</option></select></label>}
    <details className={layout.disclosure}><summary>Coefficients selon les participants <span>{value.participantCoefficients.length ? `${value.participantCoefficients.length} configuré(s)` : 'Aucun'}</span></summary><div className={layout.disclosureBody}>
      <p>Sans ligne : coefficient 1. Sinon, renseignez chaque taille de groupe autorisée.</p>
      {value.participantCoefficients.map((row, i) => <div key={i} className={styles.row}>
        {number('Participants', row.participants, n => patch({ participantCoefficients: value.participantCoefficients.map((r,j) => j === i ? { ...r, participants: n } : r) }), 1000, 1, 1)}
        {number('Coefficient', row.coefficient, n => patch({ participantCoefficients: value.participantCoefficients.map((r,j) => j === i ? { ...r, coefficient: n } : r) }))}
        <button type="button" onClick={() => patch({ participantCoefficients: value.participantCoefficients.filter((_,j) => j !== i) })}>Supprimer coefficient {i + 1}</button>
      </div>)}
      <button type="button" onClick={() => patch({ participantCoefficients: [...value.participantCoefficients, { participants: value.participantCoefficients.length + 1, coefficient: 1 }] })}>Ajouter un coefficient</button>
    </div></details>
    {['HADES','HUNT','COUNTER','PROGRESSION','SIMRACING','MINECRAFT'].includes(value.method) && <fieldset className={styles.fieldset}><legend className={styles.fieldsetLegend}>{value.method === 'PROGRESSION' ? 'Paliers dans l’ordre de progression' : 'Ressources, objectifs ou mesures'}</legend>
      {value.items.map((item, i) => <div key={i}>
        <label className={styles.field}>Nom<input className={styles.input} required value={item.label} onChange={e => patch({ items: value.items.map((r,j) => j === i ? { ...r, label: e.target.value } : r) })} /></label>
        <label className={styles.field}>Code pour l’import<input className={styles.input} pattern="[a-zA-Z0-9_-]+" required value={item.key} onChange={e => patch({ items: value.items.map((r,j) => j === i ? { ...r, key: e.target.value } : r) })} /></label>
        {number('Points par unité / palier', item.points, n => patch({ items: value.items.map((r,j) => j === i ? { ...r, points: n } : r) }))}
        {value.method === 'HUNT' && number('Points par unité en cas de défaite', item.lossPoints, n => patch({ items: value.items.map((r,j) => j === i ? { ...r, lossPoints: n } : r) }))}
        <button type="button" onClick={() => patch({ items: value.items.filter((_,j) => j !== i) })}>Supprimer {item.label}</button>
      </div>)}
      <button type="button" onClick={() => patch({ items: [...value.items, { key: `objectif_${Date.now()}`, label: `Objectif ${value.items.length + 1}`, points: 0, lossPoints: 0 }] })}>Ajouter un objectif / palier</button>
    </fieldset>}
    {value.method === 'HUNT' && <fieldset className={styles.fieldset}><legend className={styles.fieldsetLegend}>Barème de durée en cas de défaite</legend>
      {value.timeTiers.map((row, i) => <div key={i}>
        {number('Durée maximale (secondes)', row.seconds, n => patch({ timeTiers: value.timeTiers.map((r,j) => j === i ? { ...r, seconds: n } : r) }), 1e9, 1, 1)}
        {number('Points', row.points, n => patch({ timeTiers: value.timeTiers.map((r,j) => j === i ? { ...r, points: n } : r) }))}
        <button type="button" onClick={() => patch({ timeTiers: value.timeTiers.filter((_,j) => j !== i) })}>Supprimer durée {i + 1}</button>
      </div>)}
      <button type="button" onClick={() => patch({ timeTiers: [...value.timeTiers, { seconds: 60, points: 0 }] })}>Ajouter une durée</button>
    </fieldset>}
    <details className={layout.disclosure} open={value.method === 'TFT' ? true : undefined}><summary>Variantes du mode <span>{value.modes.length ? `${value.modes.length} configurée(s)` : 'Aucune'}</span></summary><div className={layout.disclosureBody}><p className={styles.hint}>Facultatif, obligatoire pour TFT.</p>
      {value.modes.map((mode, i) => <div key={i}>
        <label className={styles.field}>Nom du mode<input className={styles.input} required value={mode.label} onChange={e => patch({ modes: value.modes.map((r,j) => j === i ? { ...r, label: e.target.value } : r) })} /></label>
        {number('Coefficient du mode', mode.coefficient, n => patch({ modes: value.modes.map((r,j) => j === i ? { ...r, coefficient: n } : r) }))}
        {value.method === 'TFT' && <div>{mode.ranks.map((points, rank) => <div key={rank}>{number(`Points top ${rank + 1}`, points, n => patch({ modes: value.modes.map((r,j) => j === i ? { ...r, ranks: r.ranks.map((v,k) => k === rank ? n : v) } : r) }))}</div>)}
          <button type="button" onClick={() => patch({ modes: value.modes.map((r,j) => j === i ? { ...r, ranks: [...r.ranks, 0] } : r) })}>Ajouter un rang</button>
          <button type="button" onClick={() => patch({ modes: value.modes.map((r,j) => j === i ? { ...r, ranks: r.ranks.slice(0,-1) } : r) })}>Retirer le dernier rang</button>
        </div>}
        <button type="button" onClick={() => patch({ modes: value.modes.filter((_,j) => j !== i) })}>Supprimer {mode.label}</button>
      </div>)}
      <button type="button" onClick={() => patch({ modes: [...value.modes, { key: `mode_${Date.now()}`, label: 'Nouveau mode', coefficient: 1, ranks: [] }] })}>Ajouter un mode</button>
    </div></details>
  </div>
}
