import { CreateSubscriptionNotificationSchema } from '@extia-gaming/shared'
import webpush from 'web-push'
import nodemailer from 'nodemailer'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export interface NotificationConfig {publicKey:string|null;emailReady?:boolean;discordReady?:boolean}
function validWebsite() {
  try { const u=new URL(process.env.PUBLIC_SITE_URL??''); return ['https:','http:'].includes(u.protocol) } catch { return false }
}
function validWebhook() {
  try { const u=new URL(process.env.DISCORD_WEBHOOK_URL??'');return u.protocol==='https:'&&u.hostname==='discord.com'&&/^\/api\/webhooks\/\d+\/[\w-]+$/.test(u.pathname) } catch {return false}
}
export function notificationConfig():NotificationConfig {
  return {
    publicKey:process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT?process.env.VAPID_PUBLIC_KEY:null,
    emailReady:Boolean(process.env.SMTP_HOST&&process.env.SMTP_FROM&&validWebsite()),
    discordReady:validWebhook()&&validWebsite(),
  }
}
interface Delivery {title:string;body:string;url:string}
export interface NotificationSender {
  push:(subscription:{endpoint:string;p256dh:string;auth:string},message:Delivery)=>Promise<unknown>
  email?:(address:string,message:Delivery)=>Promise<unknown>
  discord?:(message:Delivery)=>Promise<unknown>
}
function sender():NotificationSender {
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT??587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:10000,disableFileAccess:true,disableUrlAccess:true})
  const absolute=(m:Delivery)=>new URL(m.url,process.env.PUBLIC_SITE_URL).href
  return {
    push:(s,m)=>webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},JSON.stringify(m),{TTL:600,timeout:10000,vapidDetails:{subject:process.env.VAPID_SUBJECT!,publicKey:process.env.VAPID_PUBLIC_KEY!,privateKey:process.env.VAPID_PRIVATE_KEY!}}),
    email:(address,m)=>transport.sendMail({from:process.env.SMTP_FROM,to:address,subject:m.title,text:`${m.body}\n\n${absolute(m)}`}),
    discord:async m=>{
      const url=new URL(process.env.DISCORD_WEBHOOK_URL!);url.searchParams.set('wait','true')
      const res=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:`${m.title}\n${m.body}\n${absolute(m)}`,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(10000)})
      if(!res.ok)throw new Error('Discord delivery failed')
    },
  }
}
export async function dispatchReminders(delivery:NotificationSender=sender(),now=new Date(),config:NotificationConfig=notificationConfig()) {
  const events=await prisma.event.findMany({where:{settledAt:null,startsAt:{gt:new Date(now.getTime()-5*60000),lte:new Date(now.getTime()+10080*60000)}},include:{userEvents:{where:{isPresent:null},include:{user:{include:{subscriptionNotifications:true}}}}}})
  for(const event of events) {
    if(!reminderDue(event.startsAt,event.reminderMinutes,now))continue
    const message={title:`Extia Gaming : ${event.name}`,body:`${event.name} commence à ${event.startsAt.toLocaleTimeString('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'})}. Retrouvez les détails et confirmez votre présence pendant l’événement.`,url:`/programme/${event.id}`}
    for(const registration of event.userEvents) {
      const user=registration.user
      if(event.notifyPush&&config.publicKey) for(const sub of user.subscriptionNotifications.filter(s=>CreateSubscriptionNotificationSchema.safeParse({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}}).success)) {
        const key={eventId:event.id,subscriptionId:sub.id}
        await prisma.eventNotificationDelivery.createMany({data:[key],skipDuplicates:true})
        const claimed=await prisma.eventNotificationDelivery.updateMany({where:{...key,sentAt:null,attempts:{lt:3},OR:[{leaseUntil:null},{leaseUntil:{lt:now}}]},data:{leaseUntil:new Date(now.getTime()+60000),attempts:{increment:1}}})
        if(!claimed.count)continue
        try {
          await delivery.push(sub,message)
          await prisma.eventNotificationDelivery.update({where:{eventId_subscriptionId:key},data:{sentAt:new Date(),leaseUntil:null}})
        } catch(error) {
          const status=(error as {statusCode?:number}).statusCode
          if(status===404||status===410)await prisma.subscriptionNotification.deleteMany({where:{id:sub.id}})
        }
      }
      if(event.notifyEmail&&config.emailReady&&delivery.email)await channel(event.id,`email:${user.id}`,()=>delivery.email!(user.email,message),now)
    }
    if(event.notifyDiscord&&config.discordReady&&delivery.discord)await channel(event.id,'discord',()=>delivery.discord!(message),now)
  }
  if(config.discordReady&&delivery.discord)await dispatchSiteAnnouncements(delivery.discord,now)
}
async function channel(eventId:number,destination:string,send:()=>Promise<unknown>,now:Date) {
  const key={eventId,destination}
  await prisma.eventChannelDelivery.createMany({data:[key],skipDuplicates:true})
  const claimed=await prisma.eventChannelDelivery.updateMany({where:{...key,sentAt:null,attempts:{lt:3},OR:[{leaseUntil:null},{leaseUntil:{lt:now}}]},data:{leaseUntil:new Date(now.getTime()+60000),attempts:{increment:1}}})
  if(!claimed.count)return
  try {await send();await prisma.eventChannelDelivery.update({where:{eventId_destination:key},data:{sentAt:new Date(),leaseUntil:null}})}
  catch { /* Retry after the lease; never persist provider messages or credentials. */ }
}
// A short grace period covers scheduler ticks at minute zero without announcing old events.
export function reminderDue(at:Date,minutes:number,now:Date) {
  return now.getTime()>=at.getTime()-minutes*60000 && now.getTime()<at.getTime()+5*60000
}
async function dispatchSiteAnnouncements(send:(message:Delivery)=>Promise<unknown>,now:Date) {
  const settings=await prisma.siteSettings.findUnique({where:{id:1}})
  if(!settings)return
  const announcements=[
    {kind:'start',enabled:settings.notifyStartDiscord,at:settings.eventStart,minutes:settings.startReminderMinutes,label:'Début'},
    {kind:'end',enabled:settings.notifyEndDiscord,at:settings.eventEnd,minutes:settings.endReminderMinutes,label:'Fin'},
  ]
  for(const item of announcements) {
    if(!item.enabled||!item.at||!reminderDue(item.at,item.minutes,now))continue
    // The boundary date identifies an edition; changing the lead time cannot duplicate a sent announcement.
    const key={kind:item.kind,scheduledAt:item.at}
    await prisma.siteNotificationDelivery.createMany({data:[key],skipDuplicates:true})
    const claimed=await prisma.siteNotificationDelivery.updateMany({where:{...key,sentAt:null,attempts:{lt:3},OR:[{leaseUntil:null},{leaseUntil:{lt:now}}]},data:{leaseUntil:new Date(now.getTime()+60000),attempts:{increment:1}}})
    if(!claimed.count)continue
    const date=item.at.toLocaleString('fr-FR',{timeZone:'Europe/Paris',dateStyle:'long',timeStyle:'short'})
    try {
      await send({title:`Extia Gaming : ${item.label.toLowerCase()} des 24 heures`,body:`${item.label} des 24 heures : ${date} (heure de Paris). ${item.kind==='start'?'Retrouvez le programme et rejoignez-nous !':'Merci à toutes et à tous pour votre participation !'}`,url:'/programme'})
      await prisma.siteNotificationDelivery.update({where:{kind_scheduledAt:key},data:{sentAt:new Date(),leaseUntil:null}})
    } catch { /* Retry after the lease without storing provider responses or secrets. */ }
  }
}
export function startNotifications(app:FastifyInstance) {
  const config=notificationConfig()
  if(process.env.NODE_ENV==='test'||(!config.publicKey&&!config.emailReady&&!config.discordReady))return
  let running:Promise<void>|null=null
  const tick=()=>{if(!running)running=dispatchReminders().catch(error=>app.log.error(error,'Notification scheduler failed')).finally(()=>{running=null})}
  const timer=setInterval(tick,30000);timer.unref()
  app.addHook('onReady',async()=>{tick()})
  app.addHook('onClose',async()=>{clearInterval(timer);await running})
}
