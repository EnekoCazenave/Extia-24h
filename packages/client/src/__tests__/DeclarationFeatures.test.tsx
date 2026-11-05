import {beforeEach,expect,it,vi} from 'vitest'
import {screen,waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '../test-utils.tsx'
import PlayGamePage from '../pages/PlayGamePage.tsx'
import {api} from '../services/api.ts'

const state=vi.hoisted(()=>({params:{} as {id?:string;sessionId?:string},proofRequired:true,changedConfig:false,submit:vi.fn()}))
vi.mock('../services/api.ts',()=>({api:{get:vi.fn(),put:vi.fn(),post:vi.fn()}}))
vi.mock('../hooks/useAuth.ts',()=>({useAuth:()=>({user:{id:1,login:'Alice'}})}))
vi.mock('../hooks/useUsers.ts',()=>({useUsers:()=>({data:[]})}))
vi.mock('../hooks/usePlatform.ts',()=>({usePlatform:()=>({data:{settings:{proofRequired:state.proofRequired}},isPending:false,isError:false})}))
vi.mock('react-router-dom',async original=>({...await original<typeof import('react-router-dom')>(),useParams:()=>state.params}))
const game={id:2,nom:'Tetris',imageUrl:null,happyHourStart:null,happyHourEnd:null,gameTypes:[{id:7,name:'Score',calculType:'NUMBER',calculConfig:{type:'NUMBER',multiplier:1},team:false}],totalScore:0}
vi.mock('../hooks/useGames.ts',()=>({useGame:(id:number)=>({data:id===2?(state.changedConfig?{...game,gameTypes:[{...game.gameTypes[0],calculType:'BOOLEAN',calculConfig:{type:'BOOLEAN',trueValue:10,falseValue:0}}]}:game):undefined,isLoading:false}),useSubmitPlay:()=>({mutateAsync:state.submit,isPending:false})}))
beforeEach(()=>{vi.clearAllMocks();state.params={id:'2'};state.proofRequired=true;state.changedConfig=false;state.submit.mockResolvedValue({status:'APPROVED'});vi.mocked(api.put).mockResolvedValue({data:{session:{status:'PENDING'}}})})

it('blocks a declaration without the required uploaded screenshot',async()=>{
  renderWithProviders(<PlayGamePage/>)
  await userEvent.type(screen.getByLabelText(/Score obtenu/),'120')
  await userEvent.click(screen.getByRole('button',{name:/Soumettre ma partie/}))
  expect(screen.getByRole('alert')).toHaveTextContent('Ajoutez une capture')
  expect(state.submit).not.toHaveBeenCalled()
})
it('prefills an existing declaration and keeps its proof when saving a correction',async()=>{
  state.params={sessionId:'15'}
  vi.mocked(api.get).mockResolvedValue({data:{session:{id:15,status:'REJECTED',gameId:2,input:{gameTypeId:7,calculType:'NUMBER',value:80,teamMemberIds:[],proofUrl:'/uploads/existing.png'}}}})
  renderWithProviders(<PlayGamePage/>)
  const score=await screen.findByLabelText(/Score obtenu/)
  await waitFor(()=>expect(score).toHaveValue(80))
  expect(screen.getByLabelText('Mode de jeu')).toBeDisabled()
  expect(screen.getByRole('link',{name:'Voir la preuve actuelle'})).toHaveAttribute('href','/uploads/existing.png')
  await userEvent.clear(score);await userEvent.type(score,'125')
  await userEvent.click(screen.getByRole('button',{name:'Enregistrer les modifications'}))
  await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/play/15',expect.objectContaining({value:125,proofUrl:'/uploads/existing.png',gameTypeId:7})))
  expect(state.submit).not.toHaveBeenCalled()
})
it('selects a game and its mode directly from the dedicated declaration page',async()=>{
  state.params={};state.proofRequired=false
  vi.mocked(api.get).mockResolvedValue({data:{games:[{id:2,nom:'Tetris'}]}})
  renderWithProviders(<PlayGamePage/>,{initialEntries:['/declarer']})
  await userEvent.selectOptions(await screen.findByLabelText('Jeu'),'2')
  expect(screen.getByLabelText('Mode de jeu')).toHaveValue('7')
  await userEvent.type(screen.getByLabelText(/Score obtenu/),'60')
  await userEvent.click(screen.getByRole('button',{name:/Soumettre ma partie/}))
  await waitFor(()=>expect(state.submit).toHaveBeenCalledWith(expect.objectContaining({gameTypeId:7,value:60})))
})

it('edits using the original scoring configuration and Happy Hour instead of current game rules',async()=>{
  state.params={sessionId:'16'};state.changedConfig=true;state.proofRequired=false
  vi.mocked(api.get).mockResolvedValue({data:{session:{id:16,status:'REJECTED',gameId:2,calculConfig:{type:'NUMBER',multiplier:2},happyHourMultiplier:2,input:{gameTypeId:7,calculType:'NUMBER',value:40,teamMemberIds:[]}}}})
  renderWithProviders(<PlayGamePage/>)
  const score=await screen.findByLabelText(/Score obtenu/)
  await waitFor(()=>expect(score).toHaveValue(40))
  expect(screen.getByText(/Happy Hour appliquée à la déclaration initiale/)).toBeInTheDocument()
  expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button',{name:'Enregistrer les modifications'}))
  await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/api/play/16',expect.objectContaining({calculType:'NUMBER',value:40})))
})
