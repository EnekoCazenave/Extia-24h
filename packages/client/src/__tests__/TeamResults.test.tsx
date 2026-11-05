import {useState} from 'react'
import {describe,expect,it} from 'vitest'
import {render,screen,waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {computeAwards,defaultRules,PlayInputSchema} from '@extia-gaming/shared'
import RulesPlayFields,{type RulesDraft} from '../components/RulesPlayFields.tsx'

const config=defaultRules('TFT')
function TeamForm() {
  const [draft,setDraft]=useState<RulesDraft>({values:{}})
  const [participants,setParticipants]=useState([{id:1,login:'Alice'},{id:2,login:'Bob'}])
  return <><RulesPlayFields config={config} value={draft} onChange={setDraft} participants={participants}/>
    <button onClick={()=>setParticipants(previous=>previous.filter(p=>p.id!==2))}>Retirer Bob</button>
    <output data-testid="draft">{JSON.stringify(draft)}</output></>
}
describe('Résultats après modification de l’équipe',()=>{
  it('retire les résultats du coéquipier retiré et conserve le rang déjà saisi',async()=>{
    const user=userEvent.setup()
    render(<TeamForm/>)
    await user.selectOptions(screen.getByLabelText('Mode'),'standard')
    await user.type(screen.getByLabelText('Alice : Classement atteint (1 = premier)'),'2')
    await user.type(screen.getByLabelText('Bob : Classement atteint (1 = premier)'),'4')
    await user.click(screen.getByRole('button',{name:'Retirer Bob'}))
    await waitFor(()=>expect(JSON.parse(screen.getByTestId('draft').textContent!).results).toEqual([{userId:1,values:{rank:2}}]))
    const input=PlayInputSchema.parse({calculType:'RULES',gameTypeId:1,...JSON.parse(screen.getByTestId('draft').textContent!)})
    expect(()=>computeAwards(config,input,[1])).not.toThrow()
    expect(screen.getByLabelText('Alice : Classement atteint (1 = premier)')).toHaveValue(2)
  })
})
