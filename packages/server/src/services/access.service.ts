import { prisma } from '../lib/prisma.js'
import { eventTransaction, EventError } from './event-scoring.service.js'

export async function accessUsers(search:string) {
  return prisma.user.findMany({
    where:search?{OR:[{login:{contains:search,mode:'insensitive'}},{email:{contains:search,mode:'insensitive'}}]}:{},
    select:{id:true,login:true,email:true,roleId:true},orderBy:[{login:'asc'},{id:'asc'}],
  })
}

export async function changeRole(actorId:number,userId:number,roleId:number,reason:string) {
  return eventTransaction(async tx=>{
    // Serializable isolation + retry protects the admin count against concurrent demotions.
    const actor=await tx.user.findUnique({where:{id:actorId},select:{roleId:true}})
    if(actor?.roleId!==2) throw new EventError('Droits administrateur requis',403)
    const user=await tx.user.findUnique({where:{id:userId},select:{id:true,roleId:true}})
    if(!user) throw new EventError('Utilisateur introuvable',404)
    if(user.roleId===roleId) return {changed:false}
    if(user.roleId===2 && await tx.user.count({where:{roleId:2}})<=1) throw new EventError('Le dernier administrateur doit conserver son accès',409)
    if(!await tx.role.findUnique({where:{id:roleId}})) throw new EventError('Rôle indisponible',400)
    await tx.user.update({where:{id:userId},data:{roleId}})
    await tx.roleChangeAudit.create({data:{actorId,userId,previousRoleId:user.roleId,roleId,reason}})
    return {changed:true}
  })
}

export async function roleHistory(userId:number) {
  return prisma.roleChangeAudit.findMany({where:{userId},select:{id:true,previousRoleId:true,roleId:true,reason:true,createdAt:true,actor:{select:{id:true,login:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}]})
}
