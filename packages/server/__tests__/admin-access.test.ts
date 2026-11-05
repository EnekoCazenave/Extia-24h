import {beforeEach,describe,expect,it,vi} from 'vitest'
import {Prisma} from '@prisma/client'
import {changeRole,accessUsers,roleHistory} from '../src/services/access.service.js'
import {deleteEmptyGroup,groupHistory,toCsv} from '../src/services/community.service.js'
import {GroupInputSchema,GROUP_KINDS,RoleChangeSchema} from '@extia-gaming/shared'
const db=vi.hoisted(()=>({
  user:{findUnique:vi.fn(),findMany:vi.fn(),count:vi.fn(),update:vi.fn()},role:{findUnique:vi.fn()},roleChangeAudit:{create:vi.fn(),findMany:vi.fn()},
  organizationGroup:{findUnique:vi.fn(),delete:vi.fn()},groupPoint:{findMany:vi.fn()},$transaction:vi.fn(),
}))
vi.mock('../src/lib/prisma.js',()=>({prisma:db}))
beforeEach(()=>{
  vi.resetAllMocks();db.$transaction.mockImplementation(async work=>work(db));db.role.findUnique.mockResolvedValue({id:1});db.user.count.mockResolvedValue(2)
  db.user.findUnique.mockImplementation(async({where}:{where:{id:number}})=>({id:where.id,roleId:2}))
})
describe('access control administration',()=>{
  it('updates role and audit together using a serializable transaction',async()=>{
    await expect(changeRole(1,2,3,'Équipe de modération')).resolves.toEqual({changed:true})
    expect(db.user.update).toHaveBeenCalledWith({where:{id:2},data:{roleId:3}})
    expect(db.roleChangeAudit.create).toHaveBeenCalledWith({data:{actorId:1,userId:2,previousRoleId:2,roleId:3,reason:'Équipe de modération'}})
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})
  })
  it('refuses to demote the last admin and does not write an audit',async()=>{
    db.user.count.mockResolvedValue(1);await expect(changeRole(1,1,1,'Départ')).rejects.toThrow('dernier administrateur')
    expect(db.user.update).not.toHaveBeenCalled();expect(db.roleChangeAudit.create).not.toHaveBeenCalled()
  })
  it('rechecks actor permissions inside the same transaction',async()=>{
    db.user.findUnique.mockResolvedValue({roleId:1});await expect(changeRole(1,2,3,'Accès')).rejects.toThrow('Droits administrateur requis');expect(db.user.update).not.toHaveBeenCalled()
  })
  it('retries serialization conflicts before checking the last admin again',async()=>{
    const conflict=new Prisma.PrismaClientKnownRequestError('concurrent role change',{code:'P2034',clientVersion:'test'})
    db.$transaction.mockRejectedValueOnce(conflict).mockImplementation(async work=>work(db));db.user.count.mockResolvedValue(1)
    await expect(changeRole(1,2,1,'Départ')).rejects.toThrow('dernier administrateur');expect(db.$transaction).toHaveBeenCalledTimes(2);expect(db.user.update).not.toHaveBeenCalled()
  })
  it('does not record an unchanged role and refuses invalid input',async()=>{
    expect(await changeRole(1,2,2,'Inchangé')).toEqual({changed:false});expect(db.roleChangeAudit.create).not.toHaveBeenCalled()
    expect(RoleChangeSchema.safeParse({roleId:4,reason:'test'}).success).toBe(false);expect(RoleChangeSchema.safeParse({roleId:1,reason:'  '}).success).toBe(false)
  })
  it('selects only admin-required account fields and an author pseudo for audit',async()=>{
    await accessUsers('name@example.invalid');expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{OR:[{login:{contains:'name@example.invalid',mode:'insensitive'}},{email:{contains:'name@example.invalid',mode:'insensitive'}}]},select:{id:true,login:true,email:true,roleId:true}}))
    await roleHistory(2);expect(db.roleChangeAudit.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{userId:2},select:expect.objectContaining({actor:{select:{id:true,login:true}}})}))
  })
})
describe('organization groups',()=>{
  it.each(GROUP_KINDS)('accepts category %s',kind=>expect(GroupInputSchema.parse({name:'Groupe',kind}).kind).toBe(kind))
  it.each([{users:1,points:0},{users:0,points:1}])('refuses deletion when members or credit history exist (%j)',async counts=>{
    db.organizationGroup.findUnique.mockResolvedValue({id:7,_count:counts});await expect(deleteEmptyGroup(7)).rejects.toThrow('Archivez-le');expect(db.organizationGroup.delete).not.toHaveBeenCalled()
  })
  it('deletes only an empty group inside a serializable transaction',async()=>{
    db.organizationGroup.findUnique.mockResolvedValue({id:7,_count:{users:0,points:0}});await deleteEmptyGroup(7)
    expect(db.organizationGroup.delete).toHaveBeenCalledWith({where:{id:7}});expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function),{isolationLevel:'Serializable'})
  })
  it('resolves a readable author without exposing private user fields',async()=>{
    db.groupPoint.findMany.mockResolvedValue([{id:1,grantedById:2,points:10,reason:'Quiz',createdAt:new Date()}]);db.user.findMany.mockResolvedValue([{id:2,login:'Organisateur'}])
    expect((await groupHistory(7))[0].author?.login).toBe('Organisateur');expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({select:{id:true,login:true}}))
  })
  it('exports UTF8 BOM, semicolons, escaped quotes/newlines and neutralizes formulas',()=>{
    const csv=toCsv([{Pseudo:'=FORMULA()',Nom:'Élodie "test"\nligne',Vide:''}],['Pseudo','Nom','Vide'])
    expect(csv.charCodeAt(0)).toBe(0xFEFF);expect(csv).toContain('"Pseudo";"Nom";"Vide"\r\n');expect(csv).toContain('"\'=FORMULA()";"Élodie ""test""\nligne";""')
  })
})
