import { useState } from 'react'
import { scoreFields, type RulesConfig, type RuleValues, type PlayInput } from '@extia-gaming/shared'
import styles from '../pages/PlayGamePage.module.css'

export type RulesDraft = { values: RuleValues; mode?: string; results?: Extract<PlayInput, { calculType: 'RULES' }>['results'] }

export default function RulesPlayFields({ config, value, onChange, participants }: {
  config: RulesConfig; value: RulesDraft; onChange: (v: RulesDraft) => void; participants: Array<{ id: number; login: string }>
}) {
  const [importError, setImportError] = useState('')
  const fields = scoreFields(config)
  const individual = ['MINECRAFT','SIMRACING','SCORE','TFT'].includes(config.method)
  function valuesForm(values: RuleValues, change: (v: RuleValues) => void, prefix: string, collective = false) {
    return fields.filter(f => collective ? f.key === 'communityCompleted' : f.key !== 'communityCompleted').map(field => <label className={styles.field} key={field.key}>
      {field.label}
      {field.kind === 'boolean' ? <select className={styles.select} aria-label={`${prefix}${field.label}`} value={values[field.key] ?? ''} required onChange={e => change({ ...values, [field.key]: Number(e.target.value) })}><option value="">Choisir…</option><option value="0">Non</option><option value="1">Oui</option></select>
        : field.kind === 'stage' ? <select className={styles.select} aria-label={`${prefix}${field.label}`} value={values[field.key] ?? ''} required onChange={e => change({ ...values, [field.key]: Number(e.target.value) })}><option value="">Choisir…</option><option value="0">Début du jeu</option>{config.items.map((item,i) => <option key={item.key} value={i + 1}>{i + 1}. {item.label}</option>)}</select>
        : field.key === 'winnerId' ? <select className={styles.select} value={values.winnerId ?? ''} required onChange={e => change({ ...values, winnerId: Number(e.target.value) })}><option value="">Sélectionner le vainqueur…</option>{participants.map(p => <option key={p.id} value={p.id}>{p.login}</option>)}</select>
        : <input className={styles.input} type="number" aria-label={`${prefix}${field.label}`} min="0" max="1000000000" step="any" required value={values[field.key] ?? ''} onChange={e => change({ ...values, [field.key]: Number(e.target.value) })} />}
    </label>)
  }
  async function importFile(file?: File) {
    if (!file) return
    setImportError('')
    try {
      if (file.size > 1024 * 1024) throw new Error('Fichier trop volumineux (maximum 1 Mo).')
      const lines = (await file.text()).replace(/^\uFEFF/, '').trim().split(/\r?\n/)
      const separator = lines[0].includes(';') ? ';' : ','
      const headers = lines.shift()!.split(separator).map(v => v.trim())
      const expected = ['userId', ...fields.filter(f => f.key !== 'communityCompleted').map(f => f.key)]
      if (headers.length !== expected.length || new Set(headers).size !== headers.length || expected.some(h => !headers.includes(h))) throw new Error('Colonnes attendues : ' + expected.join(';'))
      const results = lines.map(line => {
        const cells = line.split(separator).map(v => v.trim())
        if (cells.length !== headers.length || cells.some(c => c === '' || !Number.isFinite(Number(c)) || Number(c) < 0)) throw new Error('Chaque cellule doit contenir un nombre positif ou nul.')
        const row = Object.fromEntries(headers.map((h,i) => [h, Number(cells[i])]))
        const { userId, ...values } = row
        return { userId, values }
      })
      if (results.length !== participants.length || new Set(results.map(r => r.userId)).size !== participants.length || results.some(r => !participants.some(p => p.id === r.userId))) throw new Error('Le fichier doit contenir une ligne pour chacun des participants sélectionnés, sans doublon.')
      onChange({ ...value, results })
    } catch (err) { setImportError(err instanceof Error ? err.message : 'Import invalide') }
  }
  function downloadTemplate() {
    const keys = fields.filter(f => f.key !== 'communityCompleted').map(f => f.key)
    const csv = [['userId', ...keys].join(';'), ...participants.map(p => [p.id, ...keys.map(() => 0)].join(';'))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'resultats.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return <fieldset><legend>Résultats de la partie</legend>
    <p>Participants de l’événement : {participants.length}. Une seule déclaration par groupe, puis validation par la modération.</p>
    {config.modes.length > 0 && <label className={styles.field}>Mode<select className={styles.select} value={value.mode ?? ''} required onChange={e => onChange({ ...value, mode: e.target.value })}><option value="">Choisir…</option>{config.modes.map(mode => <option key={mode.key} value={mode.key}>{mode.label}</option>)}</select></label>}
    {config.method === 'MINECRAFT' && valuesForm(value.values, values => onChange({ ...value, values }), '', true)}
    {individual ? <>
      <button type="button" onClick={downloadTemplate}>Télécharger le modèle CSV</button>
      <label className={styles.field}>Importer les résultats (CSV)<input type="file" accept=".csv,text/csv" onChange={e => { void importFile(e.target.files?.[0]) }} /></label>
      <p className={styles.hint}>Sélectionnez tous les participants avant l’import. Adaptez votre export au modèle. Saisissez uniquement les résultats de cette session, pas les totaux déjà déclarés.</p>
      {importError && <p role="alert">{importError}</p>}
      {participants.map(p => <fieldset key={p.id}><legend>{p.login} (n° {p.id})</legend>{valuesForm(value.results?.find(r => r.userId === p.id)?.values ?? {}, values => onChange({ ...value, results: participants.map(member => ({ userId: member.id, values: member.id === p.id ? values : value.results?.find(r => r.userId === member.id)?.values ?? {} })) }), `${p.login} : `)}</fieldset>)}
    </> : valuesForm(value.values, values => onChange({ ...value, values }), '')}
  </fieldset>
}
