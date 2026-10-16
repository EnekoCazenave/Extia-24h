import {useState} from 'react'
import type {GroupView} from '@extia-gaming/shared'
import {usePlatform,usePlatformAction,points,dateTime,type PlayerSummary} from '../hooks/usePlatform.ts'
import {api} from '../services/api.ts'
import s from './Platform.module.css'
export function GroupSelect({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  const query=usePlatform<{groups:GroupView[]}>('/api/groups')
  return <label className={s.field}>Provenance : agence, alumni ou partenaire (facultatif)<select name="groupId" value={value} onChange={e=>onChange(e.target.value)}><option value="">Non renseignée</option>{query.data?.groups.filter(g=>g.active).map(g=><option key={g.id} value={g.id}>{g.name} ({g.kind==='AGENCY'?'Agence':g.kind==='ALUMNI'?'Alumni':'Partenaire'})</option>)}</select></label>
}
export function GroupsLeaderboard() {
  const query=usePlatform<{groups:GroupView[]}>('/api/groups')
  return <section className={s.section}><h2>Classement des agences et groupes</h2>{query.isError&&<p role="alert">Classement indisponible.</p>}<div className={s.table}><table><thead><tr><th>Groupe</th><th>Joueurs</th><th>Points Before / agence</th><th>Points joueurs</th><th>Total</th></tr></thead><tbody>{query.data?.groups.slice().sort((a,b)=>b.totalPoints-a.totalPoints).map(g=><tr key={g.id}><td>{g.name}</td><td>{g.members}</td><td>{points(g.manualPoints)}</td><td>{points(g.playerPoints)}</td><td>{points(g.totalPoints)}</td></tr>)}</tbody></table></div></section>
}

export function PlayerExtras({userId,details=false}:{userId:number;details?:boolean}) {
 const query=usePlatform<{summary:PlayerSummary}>('/api/users/me/dashboard',true,userId),action=usePlatformAction(),[group,setGroup]=useState<string|null>(null),summary=query.data?.summary
 if(!summary)return query.isError?<p role="alert">Détail des points indisponible.</p>:null
 return <section className={s.section}>{details?<><h2>Détail des points acquis</h2><ul>{summary.games.map(g=><li key={`g${g.id}`}>{dateTime(g.playedAt)} · {g.gameType.videoGame.nom} / {g.gameType.name} : {points(g.score)} points</li>)}{summary.events.map(e=><li key={`e${e.id}`}>{e.event.name} : {points(e.points)} points</li>)}{summary.bonuses.map(b=><li key={`b${b.id}`}>{b.reason??'Bonus'} : {points(b.points)} points</li>)}</ul></>:<><h2>Mon groupe</h2><GroupSelect value={group??String(summary.user.group?.id??'')} onChange={setGroup}/><button className={s.button} disabled={group===null||action.busy} onClick={()=>action.run(()=>api.put('/api/users/me/group',{groupId:group?Number(group):null}))}>Enregistrer mon groupe</button>{action.error&&<p role="alert">{action.error}</p>}</>}</section>
}
