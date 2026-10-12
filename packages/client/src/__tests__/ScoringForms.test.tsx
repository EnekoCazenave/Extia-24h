import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalculConfigSchema, defaultRules, methodLabels, type ScoringMethod, type RulesConfig } from '@extia-gaming/shared'
import RulesPlayFields, { type RulesDraft } from '../components/RulesPlayFields.tsx'
import GameTypeForm from '../components/admin/GameTypeForm.tsx'

function PlayForm({ config, onSubmit = () => {} }: { config: RulesConfig; onSubmit?: (draft: RulesDraft) => void }) {
  const [draft, setDraft] = useState<RulesDraft>({ values: {} })
  return <form onSubmit={e => { e.preventDefault(); onSubmit(draft) }}><RulesPlayFields config={config} value={draft} onChange={setDraft} participants={[{id:1,login:'Alice'},{id:2,login:'Bob'}]} /><button>Enregistrer</button></form>
}

describe('Formulaires de calcul', () => {
  it('ouvre une section repliée contenant un champ invalide sans perdre ses valeurs', () => {
    const config = { ...defaultRules('MATCH'), participantCoefficients: [{ participants: 2, coefficient: 1.25 }] }
    render(<GameTypeForm initialValues={{ name: 'Duel', win: 'Victoire', calculConfig: config }} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={vi.fn()} />)
    const participants = screen.getByLabelText('Participants')
    const section = participants.closest('details')!
    expect(section.open).toBe(false)
    fireEvent.change(participants, { target: { value: '0' } })
    fireEvent.invalid(participants)
    expect(section.open).toBe(true)
    expect(screen.getByLabelText('Coefficient')).toHaveValue(1.25)
  })
  it.each(Object.keys(methodLabels) as ScoringMethod[])('sélectionne directement %s dans Type et conserve le barème en modification', async method => {
    const submit = vi.fn().mockResolvedValue(undefined), user = userEvent.setup()
    const props = { submitLabel: 'Enregistrer', pendingLabel: 'En cours', isPending: false, onSubmit: submit }
    const view = render(<GameTypeForm {...props} initialValues={{ name: 'Mode', win: 'Victoire' }} />)
    await user.selectOptions(screen.getByLabelText('Type'), method)
    expect(screen.queryByLabelText('Méthode')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ calculConfig: defaultRules(method) }))
    view.unmount()
    const config = { ...defaultRules(method), participantCoefficients: [{ participants: 2, coefficient: 1.25 }] }
    render(<GameTypeForm {...props} initialValues={{ name: 'Mode', win: 'Victoire', calculConfig: config }} />)
    expect(screen.getByLabelText('Type')).toHaveValue(method)
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({ calculConfig: config }))
  })
  it('enregistre les multiplicateurs au centième, y compris en dessous de 0,1', async () => {
    const submit = vi.fn().mockResolvedValue(undefined), user = userEvent.setup()
    render(<GameTypeForm initialValues={{ name: 'Mode', win: 'Victoire' }} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    await user.selectOptions(screen.getByLabelText('Type'), 'NUMBER')
    const input = screen.getByLabelText('Multiplicateur')
    for (const value of ['1.25', '0.05']) {
      await user.clear(input)
      await user.type(input, value)
      expect(input).toBeValid()
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
      expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({ calculConfig: { type: 'NUMBER', multiplier: Number(value) } }))
    }
  })
  it('conserve les points décimaux des types booléen et temps jusque dans la validation serveur', async () => {
    const submit = vi.fn().mockResolvedValue(undefined), user = userEvent.setup()
    render(<GameTypeForm initialValues={{ name: 'Mode', win: 'Victoire' }} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    for (const [type, label, expected] of [
      ['BOOLEAN', 'Points si vrai', { type: 'BOOLEAN', trueValue: 2.75, falseValue: 0 }],
      ['TIME', 'Points', { type: 'TIME', tiers: [{ timeSeconds: 60, points: 2.75 }] }],
    ] as const) {
      await user.selectOptions(screen.getByLabelText('Type'), type)
      await user.clear(screen.getByLabelText(label))
      await user.type(screen.getByLabelText(label), '2.75')
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
      const config = submit.mock.lastCall?.[0].calculConfig
      expect(config).toEqual(expected)
      expect(CalculConfigSchema.safeParse(config).success).toBe(true)
    }
  })
  it('enregistre les coefficients de difficulté, de participants et de mode au centième', async () => {
    const submit = vi.fn().mockResolvedValue(undefined), user = userEvent.setup()
    render(<GameTypeForm initialValues={{ name: 'Run', win: 'Victoire', calculConfig: defaultRules('RUN') }} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    await user.click(screen.getByText('Coefficients selon les participants'))
    await user.click(screen.getByText('Variantes du mode'))
    await user.click(screen.getByRole('button', { name: 'Ajouter un coefficient' }))
    await user.click(screen.getByRole('button', { name: 'Ajouter un mode' }))
    for (const label of ['Coefficient supplémentaire par niveau de difficulté', 'Coefficient', 'Coefficient du mode']) {
      const input = screen.getByLabelText(label)
      await user.clear(input)
      await user.type(input, '1.25')
      expect(input).toBeValid()
    }
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ calculConfig: expect.objectContaining({
      difficultyStep: 1.25,
      participantCoefficients: [{ participants: 1, coefficient: 1.25 }],
      modes: [expect.objectContaining({ coefficient: 1.25 })],
    }) }))
    await user.clear(screen.getByLabelText('Participants'))
    await user.type(screen.getByLabelText('Participants'), '1.25')
    expect(screen.getByLabelText('Participants')).toBeInvalid()
  })
  it('choisit un plafond de points exclusif et le retire avec un champ vide', async () => {
    const submit=vi.fn().mockResolvedValue(undefined), user=userEvent.setup()
    render(<GameTypeForm initialValues={{name:'Duel',win:'Victoire',maxPlaysPerUser:3}} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    await user.click(screen.getByText('Limites'))
    await user.selectOptions(screen.getByLabelText('Limiter par'),'points')
    const input=screen.getByLabelText('Maximum de points par utilisateur')
    expect(input).toHaveValue(null)
    await user.type(input,'125.5')
    await user.click(screen.getByRole('button',{name:'Enregistrer'}))
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({maxPointsPerUser:125.5,maxPlaysPerUser:null}))
    await user.clear(input)
    await user.click(screen.getByRole('button',{name:'Enregistrer'}))
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({maxPointsPerUser:null,maxPlaysPerUser:null}))
  })
  it('enregistre une limite et permet de la retirer en vidant le champ', async () => {
    const submit = vi.fn().mockResolvedValue(undefined), user = userEvent.setup()
    render(<GameTypeForm initialValues={{name:'Duel',win:'Victoire',maxPlaysPerUser:3}} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    await user.click(screen.getByText('Limites'))
    const input=screen.getByLabelText('Maximum de parties par utilisateur')
    expect(input).toHaveValue(3)
    await user.clear(input); await user.type(input,'5')
    await user.click(screen.getByRole('button',{name:'Enregistrer'}))
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({maxPlaysPerUser:5}))
    await user.clear(input)
    await user.click(screen.getByRole('button',{name:'Enregistrer'}))
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({maxPlaysPerUser:null}))
  })
  it('permet de configurer le barème Battle Royale sans saisie technique', async () => {
    const submit = vi.fn().mockResolvedValue(undefined), user = userEvent.setup()
    render(<GameTypeForm initialValues={{name:'BR',win:'Top atteint',calculConfig:defaultRules('BATTLE_ROYALE')}} submitLabel="Enregistrer" pendingLabel="En cours" isPending={false} onSubmit={submit} />)
    await user.clear(screen.getByLabelText('Maximum de points (top 1)'))
    await user.type(screen.getByLabelText('Maximum de points (top 1)'), '80')
    await user.click(screen.getByRole('button', {name:'Enregistrer'}))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({calculConfig:expect.objectContaining({method:'BATTLE_ROYALE',maxRankPoints:80})}))
  })
  it('présente les 22 boss nommés et conserve les deux paliers sélectionnés', async () => {
    const submit = vi.fn(), user = userEvent.setup()
    const config = {...defaultRules('PROGRESSION'),items:Array.from({length:22},(_,i)=>({key:`boss${i}`,label:`Boss ${i+1}`,points:10,lossPoints:0}))}
    render(<PlayForm config={config} onSubmit={submit} />)
    await user.selectOptions(screen.getByLabelText('Palier initial'),'3')
    await user.selectOptions(screen.getByLabelText('Palier final'),'22')
    await user.selectOptions(screen.getByLabelText('Sauvegarde reprise / Nouvelle partie +'),'1')
    await user.click(screen.getByRole('button', {name:'Enregistrer'}))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({values:{start:3,end:22,resumed:1}}))
  })
  it('importe les mesures par participant et refuse un doublon', async () => {
    const user = userEvent.setup(), submit = vi.fn()
    render(<PlayForm config={defaultRules('SIMRACING')} onSubmit={submit} />)
    const file = new File([''], 'course.csv', {type:'text/csv'})
    Object.defineProperty(file,'text',{value:async()=> 'userId;item_objectif\n1;100\n2;200'})
    await user.upload(screen.getByLabelText('Importer les résultats (CSV)'),file)
    await waitFor(()=>expect(screen.getByLabelText('Alice : Objectif à configurer')).toHaveValue(100))
    await user.click(screen.getByRole('button', {name:'Enregistrer'}))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({results:[{userId:1,values:{item_objectif:100}},{userId:2,values:{item_objectif:200}}]}))
    const bad = new File([''], 'doublon.csv', {type:'text/csv'})
    Object.defineProperty(bad,'text',{value:async()=> 'userId;item_objectif\n1;100\n1;200'})
    await user.upload(screen.getByLabelText('Importer les résultats (CSV)'),bad)
    expect(await screen.findByRole('alert')).toHaveTextContent('sans doublon')
    expect(screen.getByLabelText('Bob : Objectif à configurer')).toHaveValue(200)
  })
  it('TFT présente un classement individuel pour chaque joueur du lobby', () => {
    render(<PlayForm config={defaultRules('TFT')} />)
    expect(screen.getByLabelText('Alice : Classement atteint (1 = premier)')).toBeInTheDocument()
    expect(screen.getByLabelText('Bob : Classement atteint (1 = premier)')).toBeInTheDocument()
    expect(screen.getByRole('option',{name:'Double Up'})).toBeInTheDocument()
  })
})
