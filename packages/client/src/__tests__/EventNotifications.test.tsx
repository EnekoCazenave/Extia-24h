import {describe,it,expect,vi} from 'vitest'
import {render,screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventForm,{createEmptyEventDraft} from '../components/programme/EventForm.tsx'
vi.mock('../hooks/usePlatform.ts',()=>({usePlatform:()=>({data:{publicKey:null,emailReady:false,discordReady:false}})}))
describe('Canaux des rappels',()=>{
  it('conserve les canaux choisis même sans fournisseur connecté',async()=>{
    const save=vi.fn().mockResolvedValue(undefined),draft={...createEmptyEventDraft(),name:'Quiz',description:'Soirée quiz'}
    render(<EventForm initialValue={draft} initialGameName="" games={[]} gamesLoading={false} isSaving={false} onSubmit={save} onCancel={()=>{}}/>)
    await userEvent.click(screen.getByRole('checkbox',{name:/Email aux inscrits/}))
    await userEvent.click(screen.getByRole('checkbox',{name:/Message dans le salon Discord/}))
    await userEvent.click(screen.getByRole('checkbox',{name:/Notification push/}))
    await userEvent.clear(screen.getByLabelText('Délai du rappel (minutes avant le début)'))
    await userEvent.type(screen.getByLabelText('Délai du rappel (minutes avant le début)'),'25')
    await userEvent.click(screen.getByRole('button',{name:'Enregistrer'}))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({notifyPush:false,notifyEmail:true,notifyDiscord:true,reminderMinutes:25}))
    expect(screen.getByText('Rappel avant le début')).toBeInTheDocument()
  })
})
