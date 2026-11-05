import {useState} from 'react'
import {GROUP_KINDS, GROUP_KIND_LABELS, groupKindLabel, type GroupView} from '@extia-gaming/shared'
import {usePlatform,usePlatformAction,points,dateTime,type PlayerSummary} from '../hooks/usePlatform.ts'
import {api} from '../services/api.ts'
import s from './Platform.module.css'
export function GroupSelect({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  const query=usePlatform<{groups:GroupView[]}>('/api/groups')
  return <label className={s.field}>Provenance : agence, alumni ou partenaire (facultatif)<select name="groupId" value={value} onChange={e=>onChange(e.target.value)}><option value="">Non renseignée</option>{GROUP_KINDS.map(kind=><optgroup key={kind} label={GROUP_KIND_LABELS[kind]}>{query.data?.groups.filter(g=>g.active&&g.kind===kind).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>)}</select></label>
}
export function GroupsLeaderboard() {
  const query=usePlatform<{groups:GroupView[]}>('/api/groups')
  const [kind,setKind]=useState('')
  const groups=query.data?.groups.filter(g=>!kind||g.kind===kind).sort((a,b)=>b.totalPoints-a.totalPoints||a.id-b.id)
  return <section className={s.section}><h2>Classement des agences et groupes</h2><label className={s.field}>Catégorie<select value={kind} onChange={e=>setKind(e.target.value)}><option value="">Toutes les catégories</option>{GROUP_KINDS.map(k=><option key={k} value={k}>{GROUP_KIND_LABELS[k]}</option>)}</select></label>{query.isLoading&&<p role="status">Chargement des groupes…</p>}{groups?.length===0&&<p>Aucun groupe pour ces critères.</p>}{query.isError&&<p role="alert">Classement indisponible.</p>}<div className={s.table}><table><thead><tr><th>Groupe</th><th>Joueurs</th><th>Points Before / agence</th><th>Points joueurs</th><th>Total</th></tr></thead><tbody>{groups?.map(g=><tr key={g.id}><td>{g.name} · {groupKindLabel(g.kind)}</td><td className={s.numberCell}>{g.members}</td><td className={s.numberCell}>{points(g.manualPoints)}</td><td className={s.numberCell}>{points(g.playerPoints)}</td><td className={s.numberCell}>{points(g.totalPoints)}</td></tr>)}</tbody></table></div></section>
}

export function PlayerExtras({userId,details=false}:{userId:number;details?:boolean}) {
 const query=usePlatform<{summary:PlayerSummary}>('/api/users/me/dashboard',true,userId),action=usePlatformAction(),[group,setGroup]=useState<string|null>(null),summary=query.data?.summary
 if(!summary)return query.isError?<p role="alert">Détail des points indisponible.</p>:null
 return <section className={s.section}>{details?<><h2>Détail des points acquis</h2><ul>{summary.games.map(g=><li key={`g${g.id}`}>{dateTime(g.playedAt)} · {g.gameType.videoGame.nom} / {g.gameType.name} : {points(g.score)} points</li>)}{summary.events.map(e=><li key={`e${e.id}`}>{e.event.name} : {points(e.points)} points</li>)}{summary.bonuses.map(b=><li key={`b${b.id}`}>{b.reason??'Bonus'} : {points(b.points)} points</li>)}</ul></>:<><h2>Mon groupe</h2><GroupSelect value={group??String(summary.user.group?.id??'')} onChange={setGroup}/><button className={s.button} disabled={group===null||action.busy} onClick={()=>action.run(()=>api.put('/api/users/me/group',{groupId:group?Number(group):null}))}>Enregistrer mon groupe</button>{action.error&&<p role="alert">{action.error}</p>}</>}</section>
}

export function GroupFilter({value,onChange}:{value?:number;onChange:(value:number|undefined)=>void}) {
  const query=usePlatform<{groups:GroupView[]}>('/api/groups')
  return <label className={s.field}>Agence ou groupe<select aria-label="Agence ou groupe" value={value??''} onChange={e=>onChange(e.target.value?Number(e.target.value):undefined)}><option value="">Tous les joueurs</option>{GROUP_KINDS.map(kind=><optgroup key={kind} label={GROUP_KIND_LABELS[kind]}>{query.data?.groups.filter(g=>g.kind===kind).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>)}</select>{query.isError&&<span role="alert">Groupes indisponibles.</span>}</label>
}
