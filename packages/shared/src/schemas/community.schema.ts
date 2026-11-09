import { z } from 'zod'
export const HonorTiersSchema=z.array(z.object({name:z.string().trim().min(1).max(100),points:z.number().finite().positive().max(1e9)})).max(100).refine(t=>new Set(t.map(x=>x.points)).size===t.length && new Set(t.map(x=>x.name.toLowerCase())).size===t.length,'Chaque palier doit avoir un nom et un seuil uniques')
export type HonorTier=z.infer<typeof HonorTiersSchema>[number]
export interface HonorProgress {totalPoints:number;current:HonorTier|null;next:HonorTier|null;remaining:number}
export function youtubeVideoId(url:string):string|null {
  let u:URL
  try {u=new URL(url)} catch {return null}
  if(u.protocol!=='https:')return null
  const host=u.hostname.replace(/^(www\.|m\.)/,''),valid=(id:string|null|undefined)=>id&&/^[\w-]{11}$/.test(id)?id:null
  if(host==='youtu.be')return valid(u.pathname.split('/')[1])
  if(host!=='youtube.com'&&host!=='youtube-nocookie.com')return null
  const [,kind,id]=u.pathname.split('/')
  return kind==='watch'?valid(u.searchParams.get('v')):['embed','shorts','live'].includes(kind)?valid(id):null
}
export const youtubeEmbedUrl=(url:string)=>{const id=youtubeVideoId(url);return id?`https://www.youtube.com/embed/${id}`:null}
export const DEFAULT_HOME_VIDEO_URL='https://www.youtube.com/watch?v=b-qNl-lpJMI'
export const SettingsSchema=z.object({proofRequired:z.boolean().optional(),homeSubtitle:z.string().trim().max(1000).nullable().optional(),notifyStartDiscord:z.boolean().optional(),notifyEndDiscord:z.boolean().optional(),startReminderMinutes:z.number().int().min(0).max(10080).optional(),endReminderMinutes:z.number().int().min(0).max(10080).optional(),honorTiers:HonorTiersSchema.optional(),discordUrl:z.string().url().max(500).refine(v=>{const u=new URL(v);return u.protocol==='https:' && ['discord.gg','discord.com','www.discord.com'].includes(u.hostname)},'Lien Discord HTTPS requis').nullable().optional(),homeVideoUrl:z.string().trim().url().max(500).refine(v=>youtubeVideoId(v)!==null,'Lien de vidéo YouTube HTTPS requis').nullable().optional(),eventStart:z.string().datetime().nullable(),eventEnd:z.string().datetime().nullable()}).refine(v=>(!v.eventStart&&!v.eventEnd)||(v.eventStart&&v.eventEnd&&v.eventEnd>v.eventStart),'Renseignez une période cohérente')
export type SiteSettings=z.infer<typeof SettingsSchema>
export const GROUP_KINDS = ['AGENCY','ALUMNI','PARTNER','STUDENT','CANDIDATE','CLIENT','EXTIAN_GUEST'] as const
export const GROUP_KIND_LABELS: Record<typeof GROUP_KINDS[number],string> = {AGENCY:'Agence',ALUMNI:'Alumni',PARTNER:'Partenaire',STUDENT:'Etudiant',CANDIDATE:'Candidat',CLIENT:'Client',EXTIAN_GUEST:'+1 d’Extien'}
export const groupKindLabel = (kind:string):string => GROUP_KIND_LABELS[kind as keyof typeof GROUP_KIND_LABELS] ?? kind
export const GroupInputSchema = z.object({ name: z.string().trim().min(1).max(100), kind: z.enum(GROUP_KINDS), active: z.boolean().default(true) })
export const ACCESS_ROLES = [{id:1,name:'Utilisateur'},{id:3,name:'Modérateur'},{id:2,name:'Administrateur'}] as const
export const RoleChangeSchema = z.object({roleId:z.union([z.literal(1),z.literal(2),z.literal(3)]),reason:z.string().trim().min(1).max(500)})
export const TaskInputSchema = z.object({title:z.string().trim().min(1).max(150),description:z.string().max(5000).default(''),assignee:z.string().max(100).default(''),status:z.enum(['TODO','IN_PROGRESS','DONE']).default('TODO')})
export interface GroupView {id:number;name:string;kind:string;active:boolean;manualPoints:number;playerPoints:number;totalPoints:number;members:number}
export interface ProjectTask {id:number;title:string;description:string;assignee:string;status:'TODO'|'IN_PROGRESS'|'DONE'}
