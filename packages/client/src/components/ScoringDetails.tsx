import { CalculConfigSchema, PlayInputSchema, scoreFields, previewCredits, type SavedScoring } from '@extia-gaming/shared'

export default function ScoringDetails({ data, participants, awarded }: {
  data?: SavedScoring & { config?: unknown; input?: unknown } | null
  participants: Array<{ id: number; login: string }>
  awarded?: Array<{ userId: number; score: number }>
}) {
  const config = CalculConfigSchema.safeParse(data?.config), input = PlayInputSchema.safeParse(data?.input)
  if (!config.success || !input.success) return null
  const rules = config.data.type === 'RULES' ? config.data : null
  const result = input.data
  return <details><summary>Détail du calcul et des résultats</summary>
    {rules && result.calculType === 'RULES' && <>
      {result.mode && <p>Mode : {rules.modes.find(m => m.key === result.mode)?.label}</p>}
      {participants.map(p => {
        const values = result.results?.find(r => r.userId === p.id)?.values ?? result.values
        return <div key={p.id}><strong>{p.login}</strong><ul>{scoreFields(rules).map(field => <li key={field.key}>{field.label} : {field.kind === 'boolean' ? (values[field.key] === undefined ? 'Non renseigné (ancienne déclaration)' : values[field.key] === 1 ? 'Oui' : 'Non') : field.kind === 'stage' ? (values[field.key] === 0 ? 'Début du jeu' : rules.items[values[field.key] - 1]?.label) : field.key === 'winnerId' ? participants.find(member => member.id === values.winnerId)?.login : values[field.key]}</li>)}</ul></div>
      })}
    </>}
    <p>Happy hour : ×{data?.happyHourMultiplier ?? 1}. {data?.version === 2 && 'Les gains finaux positifs sont arrondis à l’entier supérieur avant plafond.'}</p>
    <ul>{previewCredits(data, awarded ?? []).map(row => <li key={row.userId}>
      {participants.find(p => p.id === row.userId)?.login ?? row.userId} : calculé {row.calculated?.toLocaleString('fr-FR', { maximumFractionDigits: 6 }) ?? 'indisponible'} points
      {awarded?.length ? <> → crédité {row.score.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} points
        {row.limits.map(limit => <span key={limit.scope}> · Plafond {limit.scope === 'game' ? 'du jeu' : 'du type de partie'} : {limit.maximum.toLocaleString('fr-FR')}, déjà crédité : {limit.previous.toLocaleString('fr-FR')}, solde : {limit.remaining.toLocaleString('fr-FR')}</span>)}
        {row.difference !== null && row.difference !== 0 && !row.limits.length && ' · Écart historique à vérifier (plafond ou ajustement non documenté)'}
      </> : ' avant plafond cumulé'}
    </li>)}</ul>
  </details>
}
