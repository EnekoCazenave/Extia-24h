import {beforeEach,describe,it,expect,vi} from 'vitest'
import {screen,waitFor,within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '../test-utils.tsx'
import {GroupsPanel,ExportsPanel} from '../components/admin/CommunityPanels.tsx'
import AccessPanel from '../components/admin/AccessPanel.tsx'
import {api} from '../services/api.ts'
const fixture=vi.hoisted(()=>({data:{} as Record<string,unknown>}))
vi.mock('../hooks/usePlatform.ts',async original=>({...await original<typeof import('../hooks/usePlatform.ts')>(),usePlatform:(path:string)=>({data:fixture.data[path],isLoading:false,isError:false,refetch:vi.fn()})}))
vi.mock('../hooks/useAuth.ts',()=>({useAuth:()=>({user:{id:99},updateUser:vi.fn()})}))
vi.mock('../services/api.ts',()=>({api:{post:vi.fn().mockResolvedValue({}),put:vi.fn().mockResolvedValue({}),delete:vi.fn().mockResolvedValue({}),get:vi.fn()}}))
beforeEach(()=>{vi.clearAllMocks();vi.spyOn(window,'confirm').mockReturnValue(true);fixture.data={'/api/groups':{groups:[{id:7,name:'Paris',kind:'AGENCY',active:true,members:0,totalPoints:10}]}}})
describe('group management',()=>{
  it('prefills editing and saves name/category without creating another group',async()=>{
    const u=userEvent.setup();renderWithProviders(<GroupsPanel/>);await u.click(screen.getByRole('button',{name:'Modifier Paris'}))
    expect(screen.getByLabelText('Nom du groupe')).toHaveValue('Paris');await u.clear(screen.getByLabelText('Nom du groupe'));await u.type(screen.getByLabelText('Nom du groupe'),'Campus');await u.selectOptions(screen.getByLabelText('Catégorie'),'STUDENT');await u.click(screen.getByRole('button',{name:'Enregistrer les modifications'}))
    await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/admin/groups/7',{name:'Campus',kind:'STUDENT',active:true}));expect(api.post).not.toHaveBeenCalled()
  })
  it('archives, reactivates and requires confirmation before deletion',async()=>{
    const u=userEvent.setup();renderWithProviders(<GroupsPanel/>);await u.click(screen.getByRole('button',{name:'Archiver Paris'}));await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/admin/groups/7',expect.objectContaining({active:false})))
    await u.click(screen.getByRole('button',{name:'Supprimer Paris'}));expect(window.confirm).toHaveBeenCalled();await waitFor(()=>expect(api.delete).toHaveBeenCalledWith('/api/admin/groups/7'))
  })
  it('shows author, reason, date and separates member points from collective history',async()=>{
    fixture.data['/api/admin/groups/7/points']={entries:[{id:1,points:10,reason:'Before quiz',createdAt:'2026-10-29T12:00:00Z',grantedById:99,author:{login:'Organisateur'}}]};fixture.data['/api/admin/groups/7/members']={members:[]}
    const u=userEvent.setup();renderWithProviders(<GroupsPanel/>);await u.click(screen.getByRole('button',{name:'Historique de Paris'}));expect(screen.getByText(/Before quiz.*Organisateur/)).toBeInTheDocument();expect(screen.getByRole('heading',{name:'Points individuels des membres actuels'})).toBeInTheDocument();expect(screen.getByText('Aucun membre dans ce groupe.')).toBeInTheDocument()
  })
})
describe('access management',()=>{
  it('requires confirmation and a reason and displays role audit history',async()=>{
    fixture.data['/api/admin/access/users?search=']={users:[{id:2,login:'Alice',email:'alice@example.invalid',roleId:1}]};fixture.data['/api/admin/access/users/2/history']={entries:[]}
    const u=userEvent.setup();renderWithProviders(<AccessPanel/>);await u.click(screen.getByRole('button',{name:'Gérer les accès de Alice'}));await u.selectOptions(screen.getByLabelText('Nouveau rôle'),'3');await u.type(screen.getByLabelText('Motif du changement'),'Renfort modération');await u.click(screen.getByRole('button',{name:'Confirmer le changement de rôle'}))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Alice'));await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/admin/access/users/2/role',{roleId:3,reason:'Renfort modération'}));expect(screen.getByText('Aucun changement de rôle enregistré.')).toBeInTheDocument()
  })
  it('does not write after confirmation is cancelled',async()=>{
    vi.mocked(window.confirm).mockReturnValue(false);fixture.data['/api/admin/access/users?search=']={users:[{id:2,login:'Alice',email:'alice@example.invalid',roleId:1}]}
    const u=userEvent.setup();renderWithProviders(<AccessPanel/>);await u.click(screen.getByRole('button',{name:'Gérer les accès de Alice'}));await u.selectOptions(screen.getByLabelText('Nouveau rôle'),'2');await u.type(screen.getByLabelText('Motif du changement'),'Admin');await u.click(screen.getByRole('button',{name:'Confirmer le changement de rôle'}));expect(api.put).not.toHaveBeenCalled()
  })
})
describe('organizer list',()=>{
  it('shows non-consenting accounts with empty name cells and a selection export',()=>{
    fixture.data['/api/admin/organizer-participants?']={participants:[{id:2,login:'Sans consentement',firstname:'',lastname:'',group:'Paris',kind:'AGENCY',category:'Agence'}]}
    renderWithProviders(<ExportsPanel/>);const region=screen.getByRole('region',{name:'Liste des participants pour les organisateurs'}),cells=within(region).getByText('Sans consentement').closest('tr')!.querySelectorAll('td')
    expect(cells[1]).toHaveTextContent('');expect(cells[2]).toHaveTextContent('');expect(within(region).getByRole('button',{name:'Exporter la sélection (.xlsx)'})).toBeInTheDocument();expect(within(region).getByRole('button',{name:'Télécharger la liste complète (.xlsx)'})).toBeInTheDocument()
  })
})
