import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { defaultRules, type RulesConfig } from '@extia-gaming/shared'
import RulesEditor from '../components/admin/RulesEditor.tsx'
import ScoringDetails from '../components/ScoringDetails.tsx'
import GameTypeForm from '../components/admin/GameTypeForm.tsx'

function Editor() {
  const [rules, setRules] = useState<RulesConfig>({ ...defaultRules('COUNTER'), items: [{ key: 'legacy_code', label: 'Ancien objectif', points: 10, lossPoints: 0 }] })
  return <RulesEditor value={rules} onChange={setRules} />
}
describe('Credit explanation and import codes', () => {
  it('generates new codes from labels, keeps old codes and exposes advanced editing', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    expect(screen.getByText('Options avancées de l’objectif').closest('details')).not.toHaveAttribute('open')
    const existing = screen.getByLabelText('Nom')
    await user.clear(existing); await user.type(existing, 'Nom modifié')
    expect(screen.getByLabelText('Code pour l’import')).toHaveValue('legacy_code')
    await user.click(screen.getByRole('button', { name: 'Ajouter un objectif / palier' }))
    const name = screen.getAllByLabelText('Nom')[1]
    await user.clear(name); await user.type(name, 'Ligue Pokémon')
    expect(screen.getAllByLabelText('Code pour l’import')[1]).toHaveValue('ligue_pokemon')
  })
  it('shows saved calculated and actual credited points with cap explanation', () => {
    render(<ScoringDetails participants={[{ id: 1, login: 'Alice' }]} awarded={[{ userId: 1, score: 2 }]} data={{ version: 2,
      config: defaultRules('MATCH'), input: { gameTypeId: 1, calculType: 'RULES', values: { won: 1 } }, awards: [{ userId: 1, score: 30 }],
      credits: [{ userId: 1, calculated: 30, requested: 30, score: 2, limits: [{ scope: 'type', maximum: 100, previous: 98, remaining: 2 }] }] }} />)
    expect(screen.getByText(/calculé 30 points/)).toHaveTextContent('crédité 2 points')
    expect(screen.getByText(/Plafond du type de partie/)).toHaveTextContent('déjà crédité : 98, solde : 2')
  })
  it('rejects fractional new type caps before submission', async () => {
    const user = userEvent.setup(), submit = vi.fn()
    render(<GameTypeForm initialValues={{ name: 'Mode', win: 'Victoire' }} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    await user.click(screen.getByText('Limites'))
    await user.selectOptions(screen.getByLabelText('Limiter par'), 'points')
    await user.type(screen.getByLabelText('Maximum de points par utilisateur'), '12.5')
    expect(screen.getByLabelText('Maximum de points par utilisateur')).toBeInvalid()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(submit).not.toHaveBeenCalled()
  })
})
