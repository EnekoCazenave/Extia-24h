self.addEventListener('push',event=>{
  let message
  try {message=event.data.json()} catch {return}
  event.waitUntil(self.registration.showNotification(message.title||'Extia Gaming',{body:message.body,tag:message.url,data:{url:message.url}}))
})
self.addEventListener('notificationclick',event=>{
  event.notification.close()
  const candidate=new URL(event.notification.data?.url||'/programme',self.location.origin)
  const url=candidate.origin===self.location.origin?candidate.href:new URL('/programme',self.location.origin).href
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{
    const client=windows.find(w=>w.url===url)
    if(client) return client.focus()
    return self.clients.openWindow(url)
  }))
})
