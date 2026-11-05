import { useEffect, useState } from 'react'
import { scoreFields, type RulesConfig, type RuleValues, type PlayInput } from '@extia-gaming/shared'
import styles from '../pages/PlayGamePage.module.css'

export type RulesDraft = { values: RuleValues; mode?: string; results?: Extract<PlayInput, { calculType: 'RULES' }>['results'] }

export default function RulesPlayFields({ config, value, onChange, participants }: {
  config: RulesConfig; value: RulesDraft; onChange: (v: RulesDraft) => void; participants: Array<{ id: number; login: string }>
}) {
  const [importError, setImportError] = useState('')
  const [preview, setPreview] = useState<RulesDraft['results']>()
  const fields = scoreFields(config)
  const participantKey = participants.map(p=>p.id).join(',')
  useEffect(()=>{setPreview(undefined);setImportError('')},[value.mode,participantKey,config])
  useEffect(()=>{
    if (!value.results) return
    const ids=new Set(participantKey.split(',').map(Number))
    const results=value.results.filter(result=>ids.has(result.userId))
    if (results.length !== value.results.length) onChange({...value,results})
  },[participantKey,value,onChange])
  function fieldValue(values: RuleValues, key:string, raw:string):RuleValues {
    const next={...values}; if(raw==='') delete next[key]; else next[key]=Number(raw); return next
  }
  const individual = ['MINECRAFT','SIMRACING','SCORE','TFT'].includes(config.method)
  function valuesForm(values: RuleValues, change: (v: RuleValues) => void, prefix: string, collective = false) {
    return fields.filter(f => collective ? f.key === 'communityCompleted' : f.key !== 'communityCompleted').map(field => <label className={styles.field} key={field.key}>
      {field.label}
      {field.kind === 'boolean' ? <select className={styles.select} aria-label={`${prefix}${field.label}`} value={values[field.key] ?? ''} required onChange={e => change(fieldValue(values,field.key,e.target.value))}><option value="">Choisir…</option><option value="0">Non</option><option value="1">Oui</option></select>
        : field.kind === 'stage' ? <select className={styles.select} aria-label={`${prefix}${field.label}`} value={values[field.key] ?? ''} required onChange={e => change(fieldValue(values,field.key,e.target.value))}><option value="">Choisir…</option><option value="0">Début du jeu</option>{config.items.map((item,i) => <option key={item.key} value={i + 1}>{i + 1}. {item.label}</option>)}</select>
        : field.key === 'winnerId' ? <select className={styles.select} value={values.winnerId ?? ''} required onChange={e => change({ ...values, winnerId: Number(e.target.value) })}><option value="">Sélectionner le vainqueur…</option>{participants.map(p => <option key={p.id} value={p.id}>{p.login}</option>)}</select>
        : <input className={styles.input} type="number" aria-label={`${prefix}${field.label}`} min={field.key === 'rank' ? 1 : 0} max={field.key === 'rank' && config.method === 'TFT' ? config.modes.find(m=>m.key === value.mode)?.ranks.length : 1000000000} step={field.key === 'rank' ? 1 : 'any'} required value={values[field.key] ?? ''} onChange={e => change(fieldValue(values,field.key,e.target.value))} />}
    </label>)
  }
  async function importFile(file?: File) {
    if (!file) return
    setImportError('')
    setPreview(undefined)
    try {
      if (file.size > 1024 * 1024) throw new Error('Fichier trop volumineux (maximum 1 Mo).')
      const lines = (await file.text()).replace(/^\uFEFF/, '').trim().split(/\r?\n/)
      if (lines.length < 2) throw new Error('Le fichier doit contenir un en-tête et les résultats.')
      const separator = lines[0].includes(';') ? ';' : ','
      const headers = lines.shift()!.split(separator).map(v => v.trim())
      const expected = ['userId', ...fields.filter(f => f.key !== 'communityCompleted').map(f => f.key)]
      if (headers.length !== expected.length || new Set(headers).size !== headers.length || expected.some(h => !headers.includes(h))) throw new Error('Colonnes attendues : ' + expected.join(';'))
      const results = lines.map((line, index) => {
        const cells = line.split(separator).map(v => v.trim())
        if (cells.length !== headers.length || cells.some(c => c === '' || !Number.isFinite(Number(c)) || Number(c) < 0)) throw new Error(`Ligne ${index + 2} : chaque cellule doit contenir un nombre positif ou nul.`)
        const row = Object.fromEntries(headers.map((h,i) => [h, Number(cells[i])]))
        const { userId, ...values } = row
        for (const field of fields.filter(f=>f.key !== 'communityCompleted')) {
          const number=values[field.key]
          if (number > 1e9 || (field.kind === 'boolean' && number !== 0 && number !== 1) || (field.kind === 'stage' && (!Number.isInteger(number) || number > config.items.length))) throw new Error(`Ligne ${index + 2} : valeur invalide pour ${field.key}.`)
        }
        if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error(`Ligne ${index + 2} : identifiant joueur invalide.`)
        if (config.method === 'TFT') {
          const mode = config.modes.find(m => m.key === value.mode)
          if (!mode) throw new Error('Sélectionnez le mode avant l’import TFT.')
          if (!Number.isInteger(values.rank) || values.rank < 1 || values.rank > mode.ranks.length) throw new Error(`Ligne ${index + 2} : rang attendu entre 1 et ${mode.ranks.length}.`)
        }
        return { userId, values }
      })
      if (results.length !== participants.length || new Set(results.map(r => r.userId)).size !== participants.length || results.some(r => !participants.some(p => p.id === r.userId))) throw new Error('Le fichier doit contenir une ligne pour chacun des participants sélectionnés, sans doublon.')
      setPreview(results)
    } catch (err) { setImportError(err instanceof Error ? err.message : 'Import invalide') }
  }
  function downloadTemplate() {
    const keys = fields.filter(f => f.key !== 'communityCompleted').map(f => f.key)
    const csv = [['userId', ...keys].join(';'), ...participants.map(p => [p.id, ...keys.map(() => '')].join(';'))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'resultats.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return <fieldset className={styles.resultsFields}><legend>Résultats de la partie</legend>
    <p>Participants de l’événement : {participants.length}. Une seule déclaration par groupe. Les points sont validés automatiquement et peuvent être contrôlés par la modération.</p>
    {config.method === 'SCORE' && <p className={styles.hint}>Saisissez le score affiché dans Tetris. Conversion : score × {config.scoreMultiplier.toLocaleString('fr-FR', { maximumFractionDigits: 9 })} points par unité, puis coefficients éventuels.</p>}
    {config.method === 'PROGRESSION' && <p className={styles.hint}>Les points correspondent aux nouveaux paliers franchis, du palier initial exclu au palier final inclus.{config.completionBonus > 0 && ' Commencer au début ne suffit pas pour le bonus : déclarez « Oui » uniquement si le boss de fin est vaincu.'}</p>}
    {config.modes.length > 0 && <label className={styles.field}>Mode<select className={styles.select} value={value.mode ?? ''} required onChange={e => onChange({ ...value, mode: e.target.value })}><option value="">Choisir…</option>{config.modes.map(mode => <option key={mode.key} value={mode.key}>{mode.label}</option>)}</select></label>}
    {config.method === 'MINECRAFT' && valuesForm(value.values, values => onChange({ ...value, values }), '', true)}
    {individual ? <>
      <p className={styles.hint}>Saisissez les résultats de chaque participant ci-dessous. Aucun fichier n’est nécessaire.</p>
      {participants.map(p => <fieldset className={styles.resultsFields} key={p.id}><legend>{p.login} (n° {p.id})</legend>{valuesForm(value.results?.find(r => r.userId === p.id)?.values ?? {}, values => onChange({ ...value, results: participants.map(member => ({ userId: member.id, values: member.id === p.id ? values : value.results?.find(r => r.userId === member.id)?.values ?? {} })) }), `${p.login} : `)}</fieldset>)}
      <details><summary>Import CSV facultatif</summary>
      <button type="button" onClick={downloadTemplate}>Télécharger le modèle CSV</button>
      <label className={styles.field}>Importer les résultats (CSV)<input type="file" accept=".csv,text/csv" onChange={e => { const file=e.target.files?.[0]; e.target.value=''; void importFile(file) }} /></label>
      <p className={styles.hint}>Sélectionnez tous les participants avant l’import. Adaptez votre export au modèle. Saisissez uniquement les résultats de cette session, pas les totaux déjà déclarés.</p>
      <p className={styles.hint}>Colonnes : {['userId', ...fields.filter(f=>f.key !== 'communityCompleted').map(f=>f.key)].join(';')}. Les numéros des joueurs figurent au-dessus des champs. Séparateurs acceptés : point-virgule ou virgule.</p>
      {preview && <div><h3>Aperçu de l’import</h3><ul>{preview.map(row=><li key={row.userId}>{participants.find(p=>p.id===row.userId)?.login} (n° {row.userId}) : {Object.entries(row.values).map(([key,val])=>`${key} = ${val}`).join(', ')}</li>)}</ul><button type="button" onClick={()=>{
        if (preview.length !== participants.length || preview.some(row=>!participants.some(p=>p.id===row.userId))) { setImportError('Les participants ont changé. Importez de nouveau le fichier.'); setPreview(undefined); return }
        onChange({...value, results:preview}); setPreview(undefined)
      }}>Appliquer les résultats importés</button></div>}
      {importError && <p role="alert">{importError}</p>}
      </details>
    </> : valuesForm(value.values, values => onChange({ ...value, values }), '')}
  </fieldset>
}
