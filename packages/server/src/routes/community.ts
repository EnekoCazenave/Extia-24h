import { reportingData, exportWorkbook } from '../services/reporting.service.js'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { GroupInputSchema, SettingsSchema, TaskInputSchema } from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../hooks/authenticate.js'
import { requireAdmin } from '../hooks/requireAdmin.js'
import { settleEvent, EventError } from '../services/event-scoring.service.js'
import { unregisterToEvent } from '../services/event.service.js'
import { playerSummary,listGroups,publicSettings,exportData } from '../services/community.service.js'

const id=z.coerce.number().int().positive().max(2147483647)
export async function communityRoutes(f:FastifyInstance) {
  const auth={preHandler:[authenticate]},admin={preHandler:[requireAdmin]}
  f.setErrorHandler((error,request,reply)=>{
    if(error instanceof z.ZodError) return reply.code(400).send({error:error.issues.map(i=>i.message).join('. ')})
    if(error instanceof EventError) return reply.code(error.statusCode).send({error:error.message})
    if(error instanceof Prisma.PrismaClientKnownRequestError) {
      if(error.code==='P2002') return reply.code(409).send({error:'Cet élément existe déjà'})
      if(error.code==='P2025') return reply.code(404).send({error:'Élément introuvable'})
      if(error.code==='P2003') return reply.code(400).send({error:'Référence invalide ou élément encore utilisé'})
    }
    request.log.error(error); return reply.code(error.statusCode??500).send({error:'Impossible de terminer cette opération'})
  })
  f.delete<{Params:{id:string;userId:string}}>('/api/admin/events/:id/participants/:userId',admin,async r=>{await unregisterToEvent(id.parse(r.params.userId),id.parse(r.params.id));return {ok:true}})
  f.post<{Params:{id:string}}>('/api/admin/events/:id/settle',admin,async r=>({awards:await settleEvent(id.parse(r.params.id),z.object({winnerId:z.number().int().positive().nullable()}).parse(r.body).winnerId)}))
  f.get('/api/settings',async()=>({settings:await publicSettings()}))
  f.put('/api/admin/settings',admin,async r=>{
    const value=SettingsSchema.parse(r.body),data={...value,eventStart:value.eventStart?new Date(value.eventStart):null,eventEnd:value.eventEnd?new Date(value.eventEnd):null}
    return {settings:await prisma.siteSettings.upsert({where:{id:1},create:{id:1,...data},update:data})}
  })
  f.get('/api/groups',async()=>({groups:await listGroups()}))
  f.post('/api/admin/groups',admin,async r=>({group:await prisma.organizationGroup.create({data:GroupInputSchema.parse(r.body)})}))
  f.put<{Params:{id:string}}>('/api/admin/groups/:id',admin,async r=>({group:await prisma.organizationGroup.update({where:{id:id.parse(r.params.id)},data:GroupInputSchema.parse(r.body)})}))
  f.post<{Params:{id:string}}>('/api/admin/groups/:id/points',admin,async r=>{
    const body=z.object({points:z.number().finite().min(-1e9).max(1e9).refine(v=>v!==0),reason:z.string().trim().min(1).max(500)}).parse(r.body)
    return {entry:await prisma.groupPoint.create({data:{...body,groupId:id.parse(r.params.id),grantedById:r.user.sub}})}
  })
  f.get<{Params:{id:string}}>('/api/admin/groups/:id/points',admin,async r=>({entries:await prisma.groupPoint.findMany({where:{groupId:id.parse(r.params.id)},orderBy:{createdAt:'desc'}})}))
  f.get('/api/users/me/dashboard',auth,async r=>({summary:await playerSummary(r.user.sub,true)}))
  f.put('/api/users/me/group',auth,async r=>{
    const {groupId}=z.object({groupId:z.number().int().positive().nullable()}).parse(r.body)
    if(groupId && !await prisma.organizationGroup.findFirst({where:{id:groupId,active:true}})) throw new EventError('Groupe indisponible',400)
    await prisma.user.update({where:{id:r.user.sub},data:{groupId}});return {ok:true}
  })
  f.get('/api/admin/kpis',admin,async()=>{const {kpis,participants,groups}=await reportingData();return {kpis,participants,groups}})
  f.get('/api/admin/report.xlsx',admin,async(_r,reply)=>reply.header('Cache-Control','no-store').header('Content-Disposition','attachment; filename="24h-rapport.xlsx"').type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(await exportWorkbook()))
  f.get<{Params:{kind:string}}>('/api/admin/exports/:kind',admin,async(r,reply)=>{
    const csv=await exportData(r.params.kind)
    if(csv===null) return reply.code(404).send({error:'Export inconnu'})
    return reply.header('Cache-Control','no-store').header('Content-Disposition',`attachment; filename="${r.params.kind}.csv"`).type('text/csv; charset=utf-8').send(csv)
  })
  f.get('/api/admin/tasks',admin,async()=>({tasks:await prisma.projectTask.findMany({orderBy:{id:'asc'}})}))
  f.post('/api/admin/tasks',admin,async r=>({task:await prisma.projectTask.create({data:TaskInputSchema.parse(r.body)})}))
  f.put<{Params:{id:string}}>('/api/admin/tasks/:id',admin,async r=>({task:await prisma.projectTask.update({where:{id:id.parse(r.params.id)},data:TaskInputSchema.parse(r.body)})}))
  f.delete<{Params:{id:string}}>('/api/admin/tasks/:id',admin,async r=>{await prisma.projectTask.delete({where:{id:id.parse(r.params.id)}});return {ok:true}})
}
