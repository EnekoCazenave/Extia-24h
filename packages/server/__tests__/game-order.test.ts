import {beforeEach,describe,it,expect,vi} from 'vitest'
import {ReorderGamesSchema} from '@extia-gaming/shared'
const tx=vi.hoisted(()=>({$executeRaw:vi.fn(),videoGame:{findMany:vi.fn(),update:vi.fn()}}))
const transaction=vi.hoisted(()=>vi.fn())
vi.mock('../src/lib/prisma.js',()=>({prisma:{$transaction:transaction}}))
import {reorderGames} from '../src/services/admin.service.js'
describe('Ordre atomique des jeux',()=>{
 beforeEach(()=>{vi.clearAllMocks();tx.videoGame.findMany.mockResolvedValue([{id:1},{id:2},{id:3}]);transaction.mockImplementation(async cb=>cb(tx))})
 it.each([[1,2],[1,2,9],[1,1,2]])('refuse un catalogue incomplet, inconnu ou dupliqué %j avant toute écriture',async(...ids)=>{
   await expect(reorderGames(ids)).rejects.toThrow('GAME_ORDER_CONFLICT')
   expect(tx.videoGame.update).not.toHaveBeenCalled()
 })
 it('verrouille et écrit le catalogue complet dans une transaction',async()=>{
   await reorderGames([3,1,2])
   expect(tx.$executeRaw).toHaveBeenCalledTimes(1)
   expect(tx.videoGame.update.mock.calls.map(c=>c[0])).toEqual([{where:{id:3},data:{sortOrder:0}},{where:{id:1},data:{sortOrder:1}},{where:{id:2},data:{sortOrder:2}}])
   expect(transaction).toHaveBeenCalledWith(expect.any(Function),{isolationLevel:'Serializable'})
 })
 it('propage une erreur d’écriture à la transaction pour annulation',async()=>{
   tx.videoGame.update.mockRejectedValueOnce(new Error('write failure'))
   await expect(reorderGames([3,1,2])).rejects.toThrow('write failure')
   expect(tx.videoGame.update).toHaveBeenCalledTimes(1)
 })
 it('valide le contrat API',()=>{
   expect(ReorderGamesSchema.safeParse({gameIds:[1,1]}).success).toBe(false)
   expect(ReorderGamesSchema.safeParse({gameIds:[1,-2]}).success).toBe(false)
   expect(ReorderGamesSchema.safeParse({gameIds:[2,1]}).success).toBe(true)
 })
})
