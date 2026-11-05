import {describe,it,expect,vi} from 'vitest'
import userEvent from '@testing-library/user-event'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../test-utils.tsx'
import LeaderboardPage from '../pages/LeaderboardPage.tsx'
const filtered=vi.hoisted(()=>vi.fn(()=>({data:[],isLoading:false,isError:false})))
vi.mock('../hooks/useAuth.ts',()=>({useAuth:()=>({user:{id:1}})}))
vi.mock('../hooks/useGames.ts',()=>({useGames:()=>({data:[{id:1,nom:'TFT',gameTypes:[]}]})}))
vi.mock('../hooks/useLeaderboard.ts',()=>({useFilteredLeaderboard:filtered}))
vi.mock('../hooks/usePlatform.ts',()=>({usePlatform:()=>({data:{groups:[{id:2,name:'Paris',kind:'AGENCY',active:true,totalPoints:10,members:2,manualPoints:0,playerPoints:10}]}}),usePlatformAction:()=>({}),points:(v:number)=>String(v),dateTime:()=>''}))
describe('Parcours classement',()=>{
 it('affiche le lien personnel en tête, sépare les groupes et transmet les filtres combinés',async()=>{
   const user=userEvent.setup();renderWithProviders(<LeaderboardPage />)
   expect(screen.getByRole('link',{name:'Mon classement et mes parties'})).toHaveAttribute('href','/classement/me')
   expect(screen.queryByRole('heading',{name:'Classement des agences et groupes'})).not.toBeInTheDocument()
   await user.selectOptions(screen.getByLabelText('Agence ou groupe'),'2')
   await user.selectOptions(screen.getByLabelText('Jeu'),'1')
   expect(filtered).toHaveBeenLastCalledWith({gameId:1,gameTypeId:undefined,team:undefined,groupId:2})
   await user.click(screen.getByRole('button',{name:'Agences et groupes'}))
   expect(screen.getByRole('heading',{name:'Classement des agences et groupes'})).toBeInTheDocument()
   expect(screen.queryByLabelText('Jeu')).not.toBeInTheDocument()
   await user.click(screen.getByRole('button',{name:'Joueurs'}))
   expect(screen.getByLabelText('Agence ou groupe')).toHaveValue('2')
   await user.click(screen.getByRole('button',{name:'Réinitialiser'}))
   expect(filtered).toHaveBeenLastCalledWith({gameId:undefined,gameTypeId:undefined,team:undefined,groupId:undefined})
 })
})
