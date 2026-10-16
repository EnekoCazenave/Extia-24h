import { useState,type FormEvent } from 'react'
import { type GroupView,type ProjectTask } from '@extia-gaming/shared'
import { usePlatform,usePlatformAction,type PublicSettings,points,dateTime } from '../../hooks/usePlatform.ts'
import { api } from '../../services/api.ts'
import { GroupSelect } from '../CommunityContent.tsx'
import s from '../Platform.module.css'

export function SettingsPanel() {
  const query=usePlatform<{settings:PublicSettings}>('/api/settings'),action=usePlatformAction(),[saved,setSaved]=useState(false),cfg=query.data?.settings
  const local=(v:string|null)=>v?new Date(Date.parse(v)-new Date(v).getTimezoneOffset()*60000).toISOString().slice(0,16):''
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setSaved(false);const d=new FormData(e.currentTarget),datetime=(key:string)=>d.get(key)?new Date(String(d.get(key))).toISOString():null
    const payload={notifyStartDiscord:d.get('notifyStartDiscord')==='on',notifyEndDiscord:d.get('notifyEndDiscord')==='on',startReminderMinutes:Number(d.get('startReminderMinutes')),endReminderMinutes:Number(d.get('endReminderMinutes')),eventStart:datetime('eventStart'),eventEnd:datetime('eventEnd'),discordUrl:String(d.get('discordUrl')??'').trim()||null,honorTiers:d.getAll('tierName').map((name,i)=>({name:String(name),points:Number(d.getAll('tierPoints')[i])}))}
    if(await action.run(()=>api.put('/api/admin/settings',payload)))setSaved(true)
  }
  return <section className={s.section}><h2>Accueil et période des 24 heures</h2>{!cfg?<p>Chargement…</p>:<form className={s.form} onSubmit={submit}>
    <p>Les horaires délimitent le programme principal ; les événements Before restent consultables.</p>
    <label className={s.field}>Début des 24 heures<input name="eventStart" type="datetime-local" defaultValue={local(cfg.eventStart)}/></label><label className={s.field}>Fin des 24 heures<input name="eventEnd" type="datetime-local" defaultValue={local(cfg.eventEnd)}/></label>
    <label className={s.field}>Lien Discord de l’événement<input name="discordUrl" type="url" placeholder="https://discord.gg/…" defaultValue={cfg.discordUrl??''}/></label>
    <fieldset><legend>Notifications Discord des 24 heures</legend>
      <p>Les annonces utilisent le salon Discord configuré sur le serveur. Sans connexion, les choix sont enregistrés mais aucun message n’est envoyé.</p>
      <label className={s.field}><span><input type="checkbox" name="notifyStartDiscord" defaultChecked={cfg.notifyStartDiscord??false}/> Annoncer le début des 24 heures</span></label>
      <label className={s.field}>Minutes avant le début des 24 heures<input name="startReminderMinutes" type="number" required min="0" max="10080" step="1" defaultValue={cfg.startReminderMinutes??0}/></label>
      <label className={s.field}><span><input type="checkbox" name="notifyEndDiscord" defaultChecked={cfg.notifyEndDiscord??false}/> Annoncer la fin des 24 heures</span></label>
      <label className={s.field}>Minutes avant la fin des 24 heures<input name="endReminderMinutes" type="number" required min="0" max="10080" step="1" defaultValue={cfg.endReminderMinutes??0}/></label>
      <p>0 = à l’heure prévue. Maximum : 7 jours. Renseignez les dates des 24 heures pour programmer les annonces.</p>
    </fieldset>
    <HonorTierFields initial={cfg.honorTiers??[]}/>
    {action.error&&<p role="alert">{action.error}</p>}{saved&&<p role="status">Paramètres enregistrés.</p>}<button className={s.button} disabled={action.busy}>Enregistrer</button>
  </form>}</section>
}
export function GroupsPanel() {
  const query=usePlatform<{groups:GroupView[]}>('/api/groups'),action=usePlatformAction(),[selected,setSelected]=useState('')
  const history=usePlatform<{entries:Array<{id:number;points:number;reason:string;createdAt:string;grantedById:number}>}>(`/api/admin/groups/${selected||0}/points`,Boolean(selected))
  async function create(e:FormEvent<HTMLFormElement>) {e.preventDefault();const form=e.currentTarget,d=new FormData(form);if(await action.run(()=>api.post('/api/admin/groups',{name:d.get('name'),kind:d.get('kind'),active:true})))form.reset()}
  async function grant(e:FormEvent<HTMLFormElement>) {e.preventDefault();const form=e.currentTarget,d=new FormData(form);if(await action.run(()=>api.post(`/api/admin/groups/${selected}/points`,{points:Number(d.get('points')),reason:d.get('reason')})))form.reset()}
  return <section className={s.section}><h2>Agences, alumni et partenaires</h2>{action.error&&<p role="alert">{action.error}</p>}
    <form className={s.form} onSubmit={create}><label className={s.field}>Nom du groupe<input name="name" required maxLength={100}/></label><label className={s.field}>Catégorie<select name="kind"><option value="AGENCY">Agence</option><option value="ALUMNI">Alumni</option><option value="PARTNER">Partenaire</option></select></label><button className={s.button} disabled={action.busy}>Créer le groupe</button></form>
    <ul>{query.data?.groups.map(group=><li key={group.id}>{group.name} : {points(group.totalPoints)} points <button className={s.button} disabled={action.busy} onClick={()=>action.run(()=>api.put(`/api/admin/groups/${group.id}`,{name:group.name,kind:group.kind,active:!group.active}))}>{group.active?'Archiver':'Réactiver'}</button><button className={s.button} onClick={()=>setSelected(String(group.id))}>Historique</button></li>)}</ul>
    <h3>Attribuer ou corriger des points sans comptes individuels</h3><GroupSelect value={selected} onChange={setSelected}/>
    <form className={s.form} onSubmit={grant}><label className={s.field}>Points (négatifs pour une correction)<input name="points" type="number" min="-1000000000" max="1000000000" step="any" required/></label><label className={s.field}>Motif<input name="reason" required maxLength={500}/></label><button className={s.button} disabled={!selected||action.busy}>Enregistrer l’attribution</button></form>
    <ul>{history.data?.entries.map(row=><li key={row.id}>{dateTime(row.createdAt)} · {points(row.points)} points · {row.reason} · administrateur n° {row.grantedById}</li>)}</ul>
  </section>
}
interface ReportView {
  kpis:{participants:number;activePlayers:number;groups:number;approved:number;pending:number;rejected:number;totalPoints:number;registrations:number;present:number}
  participants:Array<{id:number;login:string;groupId:number|null;group?:{name:string};totalPoints:number;approved:number;pending:number;rejected:number}>
  groups:Array<{id:number;name:string;members:number;activePlayers:number;playerPoints:number;manualPoints:number;totalPoints:number}>
}
export function ExportsPanel() {
  const query=usePlatform<ReportView>('/api/admin/kpis'),action=usePlatformAction(),[search,setSearch]=useState(''),[group,setGroup]=useState('')
  const generalQuery=usePlatform<{settings:PublicSettings}>('/api/settings'),general=generalQuery.data?.settings
  const data=query.data
  const rows=data?.participants.filter(u=>(!group||(group==='none'?u.groupId===null:String(u.groupId)===group)) && u.login.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')))??[]
  async function download() {await action.run(async()=>{const {data}=await api.get('/api/admin/report.xlsx',{responseType:'blob'});const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download='24h-rapport.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}
  return <section className={s.section}>
    <section aria-labelledby="general-event-totals-title">
      <h2 id="general-event-totals-title">Bilan général de l’événement</h2>
      <p>Tous les inscrits sont comptés dans les effectifs et les totaux de points nécessaires au suivi de l’événement, y compris sans consentement aux statistiques facultatives. Le nombre d’inscrits correspond aux comptes créés sur le site.</p>
      {generalQuery.isError&&<p role="alert">Impossible de charger le bilan général.</p>}
      {general&&<div className={s.grid}>{[['Participants inscrits',general.participantCount],['Points des parties',general.gamePoints],['Points des événements',general.eventPoints],['Bonus individuels',general.bonusPoints],['Bonus collectifs',general.groupBonusPoints],['Total des points',general.totalPoints]].map(([label,value])=><article className={s.card} key={label}><h3>{label}</h3><strong>{points(Number(value))}</strong></article>)}</div>}
    </section>
    <h2>Statistiques avec consentement et export Excel</h2>
    <p>Un seul classeur avec synthèse, participants, groupes, parties, points, événements, inscriptions, jeux, types de partie et paliers. Toutes les feuilles sont filtrables. Les indicateurs et les exports incluent uniquement les participants ayant consenti aux statistiques. Ils ne contiennent ni nom, ni prénom, ni email, ni preuve de résultat. Les classements de compétition restent indépendants de ce choix.</p>
    <button className={s.button} disabled={action.busy} onClick={download}>{action.busy?'Préparation…':'Télécharger le rapport complet (.xlsx)'}</button>
    {action.error&&<p role="alert">{action.error}</p>}{query.isError&&<p role="alert">Impossible de charger les indicateurs.</p>}
    {data&&<><div className={s.grid}>{[['Participants consentants',data.kpis.participants],['Joueurs actifs',data.kpis.activePlayers],['Points validés',data.kpis.totalPoints],['Parties validées',data.kpis.approved],['En attente',data.kpis.pending],['Refusées',data.kpis.rejected],['Inscriptions',data.kpis.registrations],['Présences confirmées',data.kpis.present]].map(([label,value])=><article className={s.card} key={label}><h3>{label}</h3><strong>{Number(value).toLocaleString('fr-FR',{maximumFractionDigits:0})}</strong></article>)}</div>
    <h3>Participants</h3><div className={s.actions}><label className={s.field}>Rechercher un pseudo<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pseudo"/></label><label className={s.field}>Appartenance<select value={group} onChange={e=>setGroup(e.target.value)}><option value="">Tous les groupes</option><option value="none">Sans groupe</option>{data.groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></label></div>
    <p>{rows.length} personne(s) · {points(rows.reduce((sum,u)=>sum+u.totalPoints,0))} points dans la sélection. Ces filtres ne réduisent pas le classeur complet.</p>
    <div style={{overflowX:'auto'}}><table className={s.reportTable}><thead><tr><th>Pseudo</th><th>Groupe</th><th>Points</th><th>Parties validées</th><th>En attente</th><th>Refusées</th></tr></thead><tbody>{rows.map(u=><tr key={u.id}><td>{u.login}</td><td>{u.group?.name??'Sans groupe'}</td><td>{points(u.totalPoints)}</td><td>{u.approved}</td><td>{u.pending}</td><td>{u.rejected}</td></tr>)}</tbody></table></div>
    <h3>Groupes</h3><div style={{overflowX:'auto'}}><table className={s.reportTable}><thead><tr><th>Groupe</th><th>Membres</th><th>Joueurs actifs</th><th>Points des membres</th><th>Bonus du groupe</th><th>Total points</th></tr></thead><tbody>{data.groups.map(g=><tr key={g.id}><td>{g.name}</td><td>{g.members}</td><td>{g.activePlayers}</td><td>{points(g.playerPoints)}</td><td>{points(g.manualPoints)}</td><td>{points(g.totalPoints)}</td></tr>)}</tbody></table></div></>}
  </section>
}
export function KanbanPanel() {
  const query=usePlatform<{tasks:ProjectTask[]}>('/api/admin/tasks'),action=usePlatformAction()
  async function create(e:FormEvent<HTMLFormElement>) {e.preventDefault();const form=e.currentTarget,d=new FormData(form);if(await action.run(()=>api.post('/api/admin/tasks',{title:d.get('title'),description:d.get('description'),assignee:d.get('assignee'),status:'TODO'})))form.reset()}
  return <section className={s.section}><h2>Suivi du projet</h2><form className={s.form} onSubmit={create}><label className={s.field}>Tâche<input name="title" required maxLength={150}/></label><label className={s.field}>Description<textarea name="description" maxLength={5000}/></label><label className={s.field}>Responsable<input name="assignee" maxLength={100}/></label><button className={s.button} disabled={action.busy}>Ajouter</button></form>{action.error&&<p role="alert">{action.error}</p>}
    <div className={s.grid}>{(['TODO','IN_PROGRESS','DONE'] as const).map(status=><section key={status}><h3>{{TODO:'À faire',IN_PROGRESS:'En cours',DONE:'Terminé'}[status]}</h3>{query.data?.tasks.filter(task=>task.status===status).map(task=><article className={s.card} key={task.id}><h4>{task.title}</h4><p>{task.description}</p><p>{task.assignee}</p><label className={s.field}>État<select value={task.status} disabled={action.busy} onChange={e=>action.run(()=>api.put(`/api/admin/tasks/${task.id}`,{...task,status:e.target.value}))}><option value="TODO">À faire</option><option value="IN_PROGRESS">En cours</option><option value="DONE">Terminé</option></select></label><button className={s.button} disabled={action.busy} onClick={()=>{if(confirm('Supprimer cette tâche ?'))void action.run(()=>api.delete(`/api/admin/tasks/${task.id}`))}}>Supprimer</button></article>)}</section>)}</div>
  </section>
}

function HonorTierFields({initial}:{initial:Array<{name:string;points:number}>}) {
  const [tiers,setTiers]=useState(initial.map((t,i)=>({...t,key:i})))
  return <fieldset><legend>Paliers honorifiques</legend><p>Seuils du total individuel validé (parties, événements et bonus). Aucun point supplémentaire n’est attribué par un palier.</p>
    {tiers.map((t,i)=><div className={s.actions} key={t.key}>
      <label className={s.field}>Nom du palier {i+1}<input name="tierName" required maxLength={100} value={t.name} onChange={e=>setTiers(v=>v.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/></label>
      <label className={s.field}>Seuil de points {i+1}<input name="tierPoints" type="number" required min="0.000001" max="1000000000" step="any" value={t.points||''} onChange={e=>setTiers(v=>v.map((x,j)=>j===i?{...x,points:Number(e.target.value)}:x))}/></label>
      <button type="button" className={s.button} onClick={()=>setTiers(v=>v.filter((_,j)=>j!==i))}>Supprimer le palier {i+1}</button>
    </div>)}<button type="button" className={s.button} disabled={tiers.length>=100} onClick={()=>setTiers(v=>[...v,{name:'',points:0,key:Math.max(-1,...v.map(t=>t.key))+1}])}>Ajouter un palier</button>
  </fieldset>
}
