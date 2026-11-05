import {beforeEach,describe,expect,it,vi} from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import {communityRoutes} from '../src/routes/community.js'
const db=vi.hoisted(()=>({user:{findUnique:vi.fn(),findMany:vi.fn()},groupPoint:{create:vi.fn()},$queryRaw:vi.fn()}))
vi.mock('../src/lib/prisma.js',()=>({prisma:db}))
async function app() {
  const f=Fastify();await f.register(cookie);await f.register(jwt,{secret:'local-tests-only-secret-at-least-32-chars'});await f.register(communityRoutes);await f.ready();return f
}
beforeEach(()=>{vi.resetAllMocks();db.user.findUnique.mockResolvedValue({id:1,email:'admin@example.invalid',roleId:2})})
describe('admin routes protect operational identities',()=>{
  it('rejects anonymous users and non-admins before reading any account list or export',async()=>{
    const f=await app(),adminToken=f.jwt.sign({sub:1,email:'stale@example.invalid',roleId:2})
    const urls=['/api/admin/access/users','/api/admin/access/users/2/history','/api/admin/organizer-participants','/api/admin/organizer-participants/export/xlsx','/api/admin/organizer-participants/export/csv','/api/admin/groups/7/members']
    for(const url of urls)expect((await f.inject({url})).statusCode).toBe(401)
    db.user.findUnique.mockResolvedValue({id:1,email:'user@example.invalid',roleId:1})
    for(const url of urls)expect((await f.inject({url,cookies:{access_token:adminToken}})).statusCode).toBe(403)
    expect(db.user.findMany).not.toHaveBeenCalled();expect(db.$queryRaw).not.toHaveBeenCalled();await f.close()
  })
  it('returns redacted list and CSV for all accounts behind admin authentication',async()=>{
    const f=await app(),token=f.jwt.sign({sub:1,email:'admin@example.invalid',roleId:2})
    db.user.findMany.mockResolvedValue([{id:2,login:'Joueur',firstname:'SECRET-FIRST',lastname:'SECRET-LAST',statisticsConsent:false,statisticsConsentVersion:'2026-10-16',statisticsConsentUpdatedAt:new Date(),group:null}])
    const list=await f.inject({url:'/api/admin/organizer-participants',cookies:{access_token:token}})
    expect(list.statusCode).toBe(200);expect(list.json().participants).toHaveLength(1);expect(list.body).not.toContain('SECRET');expect(list.headers['cache-control']).toBe('no-store')
    const csv=await f.inject({url:'/api/admin/organizer-participants/export/csv?search=Joueur&groupId=none',cookies:{access_token:token}})
    expect(csv.statusCode).toBe(200);expect(csv.body.charCodeAt(0)).toBe(0xFEFF);expect(csv.body).toContain('"Pseudo";"Prénom";"Nom";"Groupe";"Catégorie"');expect(csv.body).toContain('"Joueur";"";"";"Sans groupe";""');expect(csv.body).not.toContain('SECRET');expect(csv.headers['content-disposition']).toContain('.csv')
    expect(db.user.findMany).toHaveBeenLastCalledWith(expect.objectContaining({where:{login:{contains:'Joueur',mode:'insensitive'},groupId:null}}));await f.close()
  })
  it('validates category/filter/role boundaries before writes',async()=>{
    const f=await app(),token=f.jwt.sign({sub:1,email:'admin@example.invalid',roleId:2})
    for(const url of ['/api/admin/organizer-participants?kind=INVALID','/api/admin/organizer-participants?groupId=-1','/api/admin/organizer-participants/export/json'])expect((await f.inject({url,cookies:{access_token:token}})).statusCode).toBe(400)
    expect((await f.inject({method:'PUT',url:'/api/admin/access/users/2/role',cookies:{access_token:token},payload:{roleId:4,reason:'test'}})).statusCode).toBe(400);expect(db.user.findMany).not.toHaveBeenCalled();await f.close()
  })
  it('rounds positive group gains upward and retains negative corrections',async()=>{
    const f=await app(),token=f.jwt.sign({sub:1,email:'admin@example.invalid',roleId:2});db.groupPoint.create.mockImplementation(async({data})=>data)
    for(const [input,stored] of [[0.2,1],[4.1,5],[-0.2,-0.2]]){
      const r=await f.inject({method:'POST',url:'/api/admin/groups/7/points',cookies:{access_token:token},payload:{points:input,reason:'Correction test'}})
      expect(r.statusCode).toBe(200);expect(r.json().entry.points).toBe(stored)
    }
    await f.close()
  })
})
