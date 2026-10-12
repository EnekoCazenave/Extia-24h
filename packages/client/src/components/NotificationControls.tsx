import { useEffect,useState } from 'react'
import { api } from '../services/api.ts'
import { usePlatform,usePlatformAction } from '../hooks/usePlatform.ts'
import s from './Platform.module.css'

function applicationKey(value:string) {
  const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))
}
export default function NotificationControls({userId}:{userId?:number}) {
  const config=usePlatform<{publicKey:string|null}>('/api/notifications/config',Boolean(userId))
  const action=usePlatformAction()
  const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false)
  const supported='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&window.isSecureContext
  useEffect(()=>{
    let current=true
    setReady(false);setEnabled(false)
    if(userId&&supported) navigator.serviceWorker.getRegistration('/').then(reg=>reg?.pushManager.getSubscription()).then(async sub=>{const subscribed=sub?(await api.post<{subscribed:boolean}>('/api/notifications/status',{endpoint:sub.endpoint})).data.subscribed:false;if(current){setEnabled(subscribed);setReady(true)}}).catch(()=>{if(current)setReady(true)})
    return()=>{current=false}
  },[userId,supported])
  if(!userId) return null
  async function toggle() {
    await action.run(async()=>{
      if(!enabled&&await Notification.requestPermission()!=='granted') throw new Error('Autorisez les notifications dans les réglages du navigateur pour activer les rappels.')
      const registration=await navigator.serviceWorker.register('/notifications-sw.js')
      await navigator.serviceWorker.ready
      if(enabled) {
        const sub=await registration.pushManager.getSubscription()
        if(sub){await api.delete('/api/subscribe',{data:{endpoint:sub.endpoint}});await sub.unsubscribe()}
        setEnabled(false);return
      }
      const existing=await registration.pushManager.getSubscription()
      const sub=existing ?? await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey(config.data!.publicKey!)})
      try {await api.post('/api/subscribe',sub.toJSON());setEnabled(true)} catch(e) {if(!existing)await sub.unsubscribe();throw e}
    })
  }
  return <div className={s.card}><h3>🔔 Mes rappels</h3>
    <p>Recevoir un rappel pour les événements auxquels je suis inscrit, sur cet appareil.</p>
    {supported&&(enabled||config.data?.publicKey)?<button className={s.button} disabled={action.busy||!ready} onClick={toggle}>{enabled?'Désactiver les notifications':'Activer les notifications'}</button>:<p>{supported?'Les notifications push ne sont pas encore configurées par l’organisation.':'Ce navigateur ou cette connexion ne permet pas les notifications push.'}</p>}

    {action.error&&<p role="alert">{action.error}</p>}
  </div>
}
