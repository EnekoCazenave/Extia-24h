import {expect,it,vi} from 'vitest'
import {render,screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventForm,{createEmptyEventDraft} from '../components/programme/EventForm.tsx'
vi.mock('../hooks/usePlatform.ts',()=>({usePlatform:()=>({data:{}})}))
function setup(){const save=vi.fn().mockResolvedValue(undefined);render(<EventForm initialValue={{...createEmptyEventDraft(),name:'Direct',description:'Le direct'}} initialGameName="" games={[]} gamesLoading={false} isSaving={false} onSubmit={save} onCancel={()=>{}}/>);return save}
it('creates an open programme item without registrations, points or attendee reminders',async()=>{
  const save=setup()
  await userEvent.click(screen.getByRole('checkbox',{name:'Inscription nécessaire'}))
  expect(screen.getByRole('checkbox',{name:'Attribuer des points'})).not.toBeChecked()
  expect(screen.getByRole('checkbox',{name:'Attribuer des points'})).toBeDisabled()
  expect(screen.queryByLabelText('Nombre de places')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Nombre de points gagnés')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button',{name:'Enregistrer'}))
  expect(save).toHaveBeenCalledWith(expect.objectContaining({registrationRequired:false,awardsPoints:false,pointsEarned:0,notifyPush:false,notifyEmail:false}))
})
it('keeps registration available for a programme item without points',async()=>{
  const save=setup()
  await userEvent.click(screen.getByRole('checkbox',{name:'Attribuer des points'}))
  expect(screen.getByLabelText('Nombre de places')).toBeInTheDocument()
  expect(screen.queryByLabelText('Nombre de points gagnés')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button',{name:'Enregistrer'}))
  expect(save).toHaveBeenCalledWith(expect.objectContaining({registrationRequired:true,awardsPoints:false,pointsEarned:0}))
})
