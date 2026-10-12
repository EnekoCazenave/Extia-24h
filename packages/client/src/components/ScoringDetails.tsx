import { CalculConfigSchema, PlayInputSchema, scoreFields } from '@extia-gaming/shared'

export default function ScoringDetails({ data, participants, awarded }: {
  data?: { config?: unknown; input?: unknown; awards?: Array<{ userId: number; score: number }>; happyHourMultiplier?: number } | null
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
        const values = { ...result.values, ...result.results?.find(r => r.userId === p.id)?.values }
        return <div key={p.id}><strong>{p.login}</strong><ul>{scoreFields(rules).map(field => <li key={field.key}>{field.label} : {field.kind === 'boolean' ? (values[field.key] === 1 ? 'Oui' : 'Non') : field.kind === 'stage' ? (values[field.key] === 0 ? 'Début du jeu' : rules.items[values[field.key] - 1]?.label) : field.key === 'winnerId' ? participants.find(member => member.id === values.winnerId)?.login : values[field.key]}</li>)}</ul></div>
      })}
    </>}
    <p>Happy hour : ×{data?.happyHourMultiplier ?? 1}. {awarded?.length ? 'Points attribués après plafond :' : 'Points calculés avant plafond cumulé :'}</p>
    <ul>{(awarded?.length ? awarded : data?.awards)?.map(a => <li key={a.userId}>{participants.find(p => p.id === a.userId)?.login ?? a.userId} : {(awarded?.length ? a.score : a.score * (data?.happyHourMultiplier ?? 1)).toLocaleString('fr-FR', { maximumFractionDigits: 6 })} points</li>)}</ul>
  </details>
}
