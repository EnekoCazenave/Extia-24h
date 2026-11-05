import {beforeEach,describe,it,expect,vi} from 'vitest'
import type {FastifyRequest,FastifyReply} from 'fastify'
import {authenticate} from '../src/hooks/authenticate.js'
import {requireAdmin} from '../src/hooks/requireAdmin.js'
import {requireModerator} from '../src/hooks/requireModerator.js'
import {optionalAuthenticate} from '../src/hooks/optionalAuthenticate.js'
const findUnique=vi.hoisted(()=>vi.fn())
vi.mock('../src/lib/prisma.js',()=>({prisma:{user:{findUnique}}}))
function context(cookie:string|undefined='signed') {
  const request={cookies:{access_token:cookie},server:{jwt:{verify:vi.fn(()=>({sub:1,email:'old@example.invalid',roleId:2}))}},user:undefined} as unknown as FastifyRequest
  const reply={sent:false,code:vi.fn().mockReturnThis(),send:vi.fn(function(this:{sent:boolean}){this.sent=true})} as unknown as FastifyReply
  return {request,reply}
}
beforeEach(()=>vi.clearAllMocks())
describe('authentication uses current server roles',()=>{
  it('allows anonymous public access and resolves the current role when a cookie is present',async()=>{
    const anonymous=context('');await optionalAuthenticate(anonymous.request,anonymous.reply);expect(findUnique).not.toHaveBeenCalled();expect(anonymous.reply.code).not.toHaveBeenCalled()
    findUnique.mockResolvedValue({id:1,email:'now@example.invalid',roleId:1});const signed=context();await optionalAuthenticate(signed.request,signed.reply);expect(signed.request.user.roleId).toBe(1)
  })
  it('rejects missing and invalid cookies without reading a user',async()=>{
    const absent=context('');await authenticate(absent.request,absent.reply);expect(absent.reply.code).toHaveBeenCalledWith(401)
    const invalid=context();vi.mocked(invalid.request.server.jwt.verify).mockImplementation(()=>{throw Error('bad token')});await authenticate(invalid.request,invalid.reply)
    expect(invalid.reply.code).toHaveBeenCalledWith(401);expect(findUnique).not.toHaveBeenCalled()
  })
  it('rejects a deleted account even with a valid cookie',async()=>{
    findUnique.mockResolvedValue(null);const c=context();await authenticate(c.request,c.reply);expect(c.reply.code).toHaveBeenCalledWith(401)
  })
  it('revokes admin immediately despite an old admin token',async()=>{
    findUnique.mockResolvedValue({id:1,email:'now@example.invalid',roleId:1});const c=context();await requireAdmin(c.request,c.reply)
    expect(c.request.user.roleId).toBe(1);expect(c.reply.code).toHaveBeenCalledWith(403)
  })
  it('applies promotion and moderator access without replacing a token',async()=>{
    findUnique.mockResolvedValue({id:1,email:'now@example.invalid',roleId:2});const c=context();await requireAdmin(c.request,c.reply);expect(c.reply.code).not.toHaveBeenCalled()
    findUnique.mockResolvedValue({id:1,email:'now@example.invalid',roleId:3});const m=context();await requireModerator(m.request,m.reply);expect(m.reply.code).not.toHaveBeenCalled()
    await requireAdmin(m.request,m.reply);expect(m.reply.code).toHaveBeenCalledWith(403)
  })
  it('does not interpret a database failure as permission to use the token role',async()=>{
    findUnique.mockRejectedValue(Error('DB unavailable'));const c=context();await expect(authenticate(c.request,c.reply)).rejects.toThrow('DB unavailable');expect(c.request.user).toBeUndefined()
  })
})
