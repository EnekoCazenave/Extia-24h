import { z } from 'zod'
export const HonorTiersSchema=z.array(z.object({name:z.string().trim().min(1).max(100),points:z.number().finite().positive().max(1e9)})).max(100).refine(t=>new Set(t.map(x=>x.points)).size===t.length && new Set(t.map(x=>x.name.toLowerCase())).size===t.length,'Chaque palier doit avoir un nom et un seuil uniques')
export type HonorTier=z.infer<typeof HonorTiersSchema>[number]
export interface HonorProgress {totalPoints:number;current:HonorTier|null;next:HonorTier|null;remaining:number}
export const SettingsSchema=z.object({notifyStartDiscord:z.boolean().optional(),notifyEndDiscord:z.boolean().optional(),startReminderMinutes:z.number().int().min(0).max(10080).optional(),endReminderMinutes:z.number().int().min(0).max(10080).optional(),honorTiers:HonorTiersSchema.optional(),discordUrl:z.string().url().max(500).refine(v=>{const u=new URL(v);return u.protocol==='https:' && ['discord.gg','discord.com','www.discord.com'].includes(u.hostname)},'Lien Discord HTTPS requis').nullable().optional(),eventStart:z.string().datetime().nullable(),eventEnd:z.string().datetime().nullable()}).refine(v=>(!v.eventStart&&!v.eventEnd)||(v.eventStart&&v.eventEnd&&v.eventEnd>v.eventStart),'Renseignez une période cohérente')
export type SiteSettings=z.infer<typeof SettingsSchema>
export const GroupInputSchema = z.object({ name: z.string().trim().min(1).max(100), kind: z.enum(['AGENCY','ALUMNI','PARTNER']), active: z.boolean().default(true) })
export const TaskInputSchema = z.object({title:z.string().trim().min(1).max(150),description:z.string().max(5000).default(''),assignee:z.string().max(100).default(''),status:z.enum(['TODO','IN_PROGRESS','DONE']).default('TODO')})
export interface GroupView {id:number;name:string;kind:string;active:boolean;manualPoints:number;playerPoints:number;totalPoints:number;members:number}
export interface ProjectTask {id:number;title:string;description:string;assignee:string;status:'TODO'|'IN_PROGRESS'|'DONE'}
