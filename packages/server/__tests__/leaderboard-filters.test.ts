import {describe,it,expect,vi,beforeEach} from 'vitest'
import type {FastifyRequest,FastifyReply} from 'fastify'
const service=vi.hoisted(()=>vi.fn())
vi.mock('../src/services/leaderboard.service.js',()=>({getFilteredLeaderboard:service,getGlobalLeaderboard:vi.fn(),getTopGamesByScore:vi.fn(),retrieveLeaderBoardById:vi.fn(),getPersonalSessions:vi.fn()}))
import {filteredLeaderboard} from '../src/controllers/leaderboard.controller.js'
describe('Filtres serveur du classement',()=>{
 beforeEach(()=>{service.mockReset();service.mockResolvedValue([])})
 it.each(['0','-1','2junk','9007199254740993','2147483648'])('refuse un identifiant groupe invalide %s sans requête',async groupId=>{
   const reply={code:vi.fn().mockReturnThis(),send:vi.fn()}
   await filteredLeaderboard({query:{groupId}} as FastifyRequest<{Querystring:{groupId:string}}>,reply as unknown as FastifyReply)
   expect(reply.code).toHaveBeenCalledWith(400);expect(service).not.toHaveBeenCalled()
 })
 it('transmet les filtres combinés au service avant le calcul des rangs',async()=>{
   const reply={send:vi.fn()}
   await filteredLeaderboard({query:{groupId:'3',gameId:'4',team:'false'}} as FastifyRequest<{Querystring:{groupId:string;gameId:string;team:string}}>,reply as unknown as FastifyReply)
   expect(service).toHaveBeenCalledWith({groupId:3,gameId:4,gameTypeId:undefined,team:false,limit:100})
 })
})
