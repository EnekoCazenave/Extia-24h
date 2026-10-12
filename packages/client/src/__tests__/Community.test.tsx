import { describe,it,expect,vi,beforeEach } from 'vitest'
import { screen,waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import {PlayerExtras,GroupSelect} from '../components/CommunityContent.tsx'
import { ExportsPanel,KanbanPanel,SettingsPanel } from '../components/admin/CommunityPanels.tsx'
import { api } from '../services/api.ts'

const fixtures=vi.hoisted(()=>({data:{} as Record<string,unknown>}))
vi.mock('../hooks/usePlatform.ts',async original=>({...await original<typeof import('../hooks/usePlatform.ts')>(),usePlatform:(path:string)=>({data:fixtures.data[path],isLoading:false,isError:false})}))
vi.mock('../services/api.ts',()=>({api:{post:vi.fn().mockResolvedValue({}),put:vi.fn().mockResolvedValue({}),delete:vi.fn().mockResolvedValue({}),get:vi.fn()}}))
const event={id:1,name:'Quiz caritatif',description:'Un quiz ensemble',startsAt:new Date(Date.now()-60000).toISOString(),endsAt:new Date(Date.now()+60000).toISOString(),capacity:10,_count:{userEvents:2},videoGame:null,twitchUrl:null,attendancePoints:10,winnerShare:0.05,cancelledAt:null,settledAt:null}
describe('Parcours événementiels',()=>{
  beforeEach(()=>{vi.clearAllMocks();fixtures.data={'/api/events':{events:[event]},'/api/events/mine':{registrations:[]},'/api/settings':{settings:{eventStart:null,eventEnd:null}},'/api/groups':{groups:[]}}})
  it('enregistre les paliers et le lien Discord dans les paramètres',async()=>{
    renderWithProviders(<SettingsPanel/>);
    await userEvent.type(screen.getByLabelText('Lien Discord de l’événement'),'https://discord.gg/extia')
    await userEvent.click(screen.getByRole('button',{name:'Ajouter un palier'}))
    await userEvent.type(screen.getByLabelText('Nom du palier 1'),'Expert')
    await userEvent.type(screen.getByLabelText('Seuil de points 1'),'500')
    await userEvent.click(screen.getByRole('button',{name:'Enregistrer'}))
    await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/admin/settings',{notifyStartDiscord:false,notifyEndDiscord:false,startReminderMinutes:0,endReminderMinutes:0,eventStart:null,eventEnd:null,discordUrl:'https://discord.gg/extia',honorTiers:[{name:'Expert',points:500}]}))
  })
  it('enregistre les annonces Discord et leurs délais indépendants',async()=>{
    renderWithProviders(<SettingsPanel/>);
    await userEvent.click(screen.getByLabelText('Annoncer le début des 24 heures'))
    await userEvent.click(screen.getByLabelText('Annoncer la fin des 24 heures'))
    await userEvent.clear(screen.getByLabelText('Minutes avant le début des 24 heures'))
    await userEvent.type(screen.getByLabelText('Minutes avant le début des 24 heures'),'60')
    await userEvent.clear(screen.getByLabelText('Minutes avant la fin des 24 heures'))
    await userEvent.type(screen.getByLabelText('Minutes avant la fin des 24 heures'),'15')
    await userEvent.click(screen.getByRole('button',{name:'Enregistrer'}))
    await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/admin/settings',expect.objectContaining({notifyStartDiscord:true,notifyEndDiscord:true,startReminderMinutes:60,endReminderMinutes:15})))
  })
  it('affiche les points événementiels et bonus dans le détail personnel',()=>{
    fixtures.data['/api/users/me/dashboard']={summary:{user:{id:7,login:'Alice',group:null},games:[],events:[{id:1,points:9.5,event:{name:'Quiz'}}],bonuses:[{id:1,points:10,reason:'Before'}]}}
    renderWithProviders(<PlayerExtras userId={7} details/>);expect(screen.getByText('Quiz : 9,5 points')).toBeInTheDocument();expect(screen.getByText('Before : 10 points')).toBeInTheDocument()
  })
  it('permet de choisir une agence active',async()=>{
    fixtures.data['/api/groups']={groups:[{id:2,name:'Paris',kind:'AGENCY',active:true},{id:3,name:'Ancienne',kind:'AGENCY',active:false}]}
    const change=vi.fn();renderWithProviders(<GroupSelect value="" onChange={change}/>)
    await userEvent.selectOptions(screen.getByRole('combobox'),'2');expect(change).toHaveBeenCalledWith('2');expect(screen.queryByText(/Ancienne/)).not.toBeInTheDocument()
  })
  it('déplace une tâche dans le Kanban',async()=>{
    fixtures.data['/api/admin/tasks']={tasks:[{id:1,title:'Préparer le live',description:'',assignee:'Alice',status:'TODO'}]}
    renderWithProviders(<KanbanPanel/>);await userEvent.selectOptions(screen.getByLabelText('État'),'DONE');await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/admin/tasks/1',expect.objectContaining({status:'DONE'})))
  })
  it('propose un rapport Excel complet',()=>{
    renderWithProviders(<ExportsPanel/>);expect(screen.getByRole('button',{name:/Télécharger le rapport complet/})).toBeInTheDocument()
  })
})
