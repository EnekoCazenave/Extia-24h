import { useState,type FormEvent } from 'react'
import { GROUP_KINDS,GROUP_KIND_LABELS,groupKindLabel,type GroupView,type ProjectTask } from '@extia-gaming/shared'
import { usePlatform,usePlatformAction,type PublicSettings,points,dateTime } from '../../hooks/usePlatform.ts'
import { api } from '../../services/api.ts'
import s from '../Platform.module.css'

export function SettingsPanel() {
  const query=usePlatform<{settings:PublicSettings}>('/api/settings'),action=usePlatformAction(),[saved,setSaved]=useState(false),cfg=query.data?.settings
  const local=(v:string|null)=>v?new Date(Date.parse(v)-new Date(v).getTimezoneOffset()*60000).toISOString().slice(0,16):''
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setSaved(false);const d=new FormData(e.currentTarget),datetime=(key:string)=>d.get(key)?new Date(String(d.get(key))).toISOString():null
    const payload={homeSubtitle:String(d.get('homeSubtitle')??'').trim(),proofRequired:d.get('proofRequired')==='on',notifyStartDiscord:d.get('notifyStartDiscord')==='on',notifyEndDiscord:d.get('notifyEndDiscord')==='on',startReminderMinutes:Number(d.get('startReminderMinutes')),endReminderMinutes:Number(d.get('endReminderMinutes')),eventStart:datetime('eventStart'),eventEnd:datetime('eventEnd'),discordUrl:String(d.get('discordUrl')??'').trim()||null,homeVideoUrl:String(d.get('homeVideoUrl')??'').trim()||null,honorTiers:d.getAll('tierName').map((name,i)=>({name:String(name),points:Number(d.getAll('tierPoints')[i])}))}
    if(await action.run(()=>api.put('/api/admin/settings',payload)))setSaved(true)
  }
  return <section className={s.section}><h2>Accueil et période des 24 heures</h2>{!cfg?<p>Chargement…</p>:<form className={s.form} onSubmit={submit}>
    <label className={s.field}>Texte sous le logo de l’accueil<textarea name="homeSubtitle" rows={3} maxLength={1000} defaultValue={cfg.homeSubtitle??'24 heures de compétition, de jeux et de fair-play. Que le meilleur gagne !'}/></label>
    <label className={s.field}><span><input name="proofRequired" type="checkbox" defaultChecked={cfg.proofRequired??false}/> Exiger une capture d’écran pour les déclarations et leur validation</span></label>
    <p>À activer après la phase de test. Une preuve déjà jointe reste utilisable lors d’une modification.</p>
    <p>Les horaires délimitent le programme principal ; les événements Before restent consultables.</p>
    <label className={s.field}>Début des 24 heures<input name="eventStart" type="datetime-local" defaultValue={local(cfg.eventStart)}/></label><label className={s.field}>Fin des 24 heures<input name="eventEnd" type="datetime-local" defaultValue={local(cfg.eventEnd)}/></label>
    <label className={s.field}>Lien Discord de l’événement<input name="discordUrl" type="url" placeholder="https://discord.gg/…" defaultValue={cfg.discordUrl??''}/></label>
    <label className={s.field}>Vidéo YouTube de l’accueil<input name="homeVideoUrl" type="url" placeholder="https://www.youtube.com/watch?v=…" defaultValue={cfg.homeVideoUrl??''}/></label>
    <p>Liens acceptés : youtube.com/watch, youtu.be, /embed ou /shorts. Laissez vide pour afficher la vidéo par défaut.</p>
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
  const query=usePlatform<{groups:GroupView[]}>('/api/groups'),action=usePlatformAction(),[selected,setSelected]=useState(''),[editing,setEditing]=useState<GroupView|null>(null)
  const history=usePlatform<{entries:Array<{id:number;points:number;reason:string;createdAt:string;grantedById:number;author:{login:string}|null}>}>(`/api/admin/groups/${selected||0}/points`,Boolean(selected))
  const members=usePlatform<{members:Array<{id:number;login:string;gamePoints:number;eventPoints:number;bonusPoints:number}>}>(`/api/admin/groups/${selected||0}/members`,Boolean(selected))
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();const form=e.currentTarget,d=new FormData(form),payload={name:d.get('name'),kind:d.get('kind'),active:editing?.active??true}
    if(await action.run(()=>editing?api.put(`/api/admin/groups/${editing.id}`,payload):api.post('/api/admin/groups',payload))){setEditing(null);form.reset()}
  }
  async function grant(e:FormEvent<HTMLFormElement>) {e.preventDefault();const form=e.currentTarget,d=new FormData(form);if(await action.run(()=>api.post(`/api/admin/groups/${selected}/points`,{points:Number(d.get('points')),reason:d.get('reason')})))form.reset()}
  async function remove(group:GroupView) {
    if(!confirm(`Supprimer définitivement le groupe « ${group.name} » ? La suppression est possible uniquement sans membres ni historique de crédits.`))return
    if(await action.run(()=>api.delete(`/api/admin/groups/${group.id}`))){if(selected===String(group.id))setSelected('');if(editing?.id===group.id)setEditing(null)}
  }
  return <section className={s.section}><h2>Groupes et provenances</h2>{action.error&&<p role="alert">{action.error}</p>}
    <form key={editing?.id??'create'} className={s.form} onSubmit={save}><h3>{editing?`Modifier ${editing.name}`:'Créer un groupe'}</h3><label className={s.field}>Nom du groupe<input name="name" required maxLength={100} defaultValue={editing?.name??''}/></label><label className={s.field}>Catégorie<select name="kind" defaultValue={editing?.kind??'AGENCY'}>{GROUP_KINDS.map(kind=><option key={kind} value={kind}>{GROUP_KIND_LABELS[kind]}</option>)}</select></label><div className={s.actions}><button className={s.button} disabled={action.busy}>{editing?'Enregistrer les modifications':'Créer le groupe'}</button>{editing&&<button type="button" className={s.button} onClick={()=>setEditing(null)}>Annuler la modification</button>}</div></form>
    {query.isLoading&&<p role="status">Chargement des groupes…</p>}{query.isError&&<p role="alert">Impossible de charger les groupes. <button className={s.button} onClick={()=>void query.refetch()}>Réessayer</button></p>}
    {query.data?.groups.length===0&&<p>Aucun groupe créé.</p>}
    <ul>{query.data?.groups.map(group=><li key={group.id}><strong>{group.name}</strong> · {groupKindLabel(group.kind)} · {group.active?'Actif':'Archivé'} · {group.members} membre(s) · {points(group.totalPoints)} points <div className={s.actions}><button className={s.button} disabled={action.busy} onClick={()=>setEditing(group)}>Modifier {group.name}</button><button className={s.button} disabled={action.busy} onClick={()=>action.run(()=>api.put(`/api/admin/groups/${group.id}`,{name:group.name,kind:group.kind,active:!group.active}))}>{group.active?'Archiver':'Réactiver'} {group.name}</button><button className={s.button} onClick={()=>setSelected(String(group.id))}>Historique de {group.name}</button><button className={s.button} disabled={action.busy||group.members>0} onClick={()=>void remove(group)}>Supprimer {group.name}</button></div></li>)}</ul>
    <h3>Attributions collectives et historique</h3><p>Les crédits collectifs sont distincts des points individuels. Les gains positifs sont arrondis à l’entier supérieur ; les corrections négatives conservent leur valeur. L’archivage conserve les membres et tous les crédits.</p>
    <label className={s.field}>Groupe à consulter<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choisir un groupe</option>{query.data?.groups.map(g=><option key={g.id} value={g.id}>{g.name}{g.active?'':' (archivé)'}</option>)}</select></label>
    <form className={s.form} onSubmit={grant}><label className={s.field}>Points (négatifs pour une correction)<input name="points" type="number" min="-1000000000" max="1000000000" step="any" required/></label><label className={s.field}>Motif<input name="reason" required maxLength={500}/></label><button className={s.button} disabled={!selected||action.busy}>Enregistrer l’attribution</button></form>
    {selected&&<><h4>Crédits du groupe</h4>{history.isLoading&&<p role="status">Chargement de l’historique…</p>}{history.isError&&<p role="alert">Impossible de charger l’historique. <button className={s.button} onClick={()=>void history.refetch()}>Réessayer</button></p>}{history.data?.entries.length===0&&<p>Aucun crédit collectif pour ce groupe.</p>}<ul>{history.data?.entries.map(row=><li key={row.id}>{dateTime(row.createdAt)} · {points(row.points)} points · {row.reason} · {row.author?.login??`Administrateur n° ${row.grantedById}`}</li>)}</ul>
    <h4>Points individuels des membres actuels</h4>{members.isLoading&&<p role="status">Chargement des membres…</p>}{members.isError&&<p role="alert">Impossible de charger les points des membres. <button className={s.button} onClick={()=>void members.refetch()}>Réessayer</button></p>}{members.data?.members.length===0&&<p>Aucun membre dans ce groupe.</p>}<div style={{overflowX:'auto'}}><table className={s.reportTable}><thead><tr><th>Pseudo</th><th>Parties</th><th>Événements</th><th>Bonus individuels</th><th>Total individuel</th></tr></thead><tbody>{members.data?.members.map(m=><tr key={m.id}><td>{m.login}</td><td>{points(m.gamePoints)}</td><td>{points(m.eventPoints)}</td><td>{points(m.bonusPoints)}</td><td>{points(m.gamePoints+m.eventPoints+m.bonusPoints)}</td></tr>)}</tbody></table></div></>}
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
    <OrganizerParticipantsPanel/>
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
interface OrganizerParticipant {id:number;login:string;firstname:string;lastname:string;groupId:number|null;group:string;kind:string;category:string}
function OrganizerParticipantsPanel() {
  const [search,setSearch]=useState(''),[group,setGroup]=useState(''),[kind,setKind]=useState(''),action=usePlatformAction()
  const filters=new URLSearchParams()
  if(search.trim())filters.set('search',search.trim())
  if(group)filters.set('groupId',group)
  if(kind)filters.set('kind',kind)
  const query=usePlatform<{participants:OrganizerParticipant[]}>(`/api/admin/organizer-participants?${filters}`)
  const groups=usePlatform<{groups:GroupView[]}>('/api/groups')
  async function download(format:'xlsx'|'csv',selection:boolean) {
    await action.run(async()=>{const {data}=await api.get(`/api/admin/organizer-participants/export/${format}${selection?'?'+filters:''}`,{responseType:'blob'});const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=`24h-liste-organisateurs.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})
  }
  return <section aria-labelledby="organizer-participants-title"><h2 id="organizer-participants-title">Liste des participants pour les organisateurs</h2>
    <p>Tous les comptes figurent dans cette liste opérationnelle. Le prénom et le nom apparaissent uniquement avec un consentement aux statistiques actuellement valide ; sinon ces cellules restent vides. Aucun email n’est exporté.</p>
    <div className={s.actions}><button className={s.button} disabled={action.busy} onClick={()=>void download('xlsx',false)}>Télécharger la liste complète (.xlsx)</button><button className={s.button} disabled={action.busy} onClick={()=>void download('xlsx',true)}>Exporter la sélection (.xlsx)</button><button className={s.button} disabled={action.busy} onClick={()=>void download('csv',true)}>Exporter la sélection (.csv)</button></div>
    <div className={s.actions}><label className={s.field}>Rechercher dans la liste organisateurs<input maxLength={100} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pseudo"/></label><label className={s.field}>Groupe des participants<select value={group} onChange={e=>setGroup(e.target.value)}><option value="">Tous les groupes</option><option value="none">Sans groupe</option>{groups.data?.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label className={s.field}>Catégorie des participants<select value={kind} onChange={e=>setKind(e.target.value)}><option value="">Toutes les catégories</option>{GROUP_KINDS.map(k=><option key={k} value={k}>{GROUP_KIND_LABELS[k]}</option>)}</select></label></div>
    {action.error&&<p role="alert">{action.error}</p>}{query.isLoading&&<p role="status">Chargement des participants…</p>}{query.isError&&<p role="alert">Impossible de charger la liste. <button className={s.button} onClick={()=>void query.refetch()}>Réessayer</button></p>}
    {query.data&&<><p>{query.data.participants.length} participant(s) dans la sélection.</p>{query.data.participants.length===0?<p>Aucun participant ne correspond aux filtres.</p>:<div style={{overflowX:'auto'}}><table className={s.reportTable}><thead><tr><th>Pseudo</th><th>Prénom</th><th>Nom</th><th>Groupe</th><th>Catégorie</th></tr></thead><tbody>{query.data.participants.map(u=><tr key={u.id}><td>{u.login}</td><td>{u.firstname}</td><td>{u.lastname}</td><td>{u.group}</td><td>{u.category}</td></tr>)}</tbody></table></div>}</>}
  </section>
}
