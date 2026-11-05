import {useState,type FormEvent} from 'react'
import {ACCESS_ROLES} from '@extia-gaming/shared'
import {usePlatform,usePlatformAction,dateTime} from '../../hooks/usePlatform.ts'
import {useAuth} from '../../hooks/useAuth.ts'
import {api} from '../../services/api.ts'
import type {UserPublic} from '@extia-gaming/shared'
import s from '../Platform.module.css'

interface AccessUser {id:number;login:string;email:string;roleId:number}
interface RoleEntry {id:number;previousRoleId:number;roleId:number;reason:string;createdAt:string;actor:{id:number;login:string}}
const roleName=(id:number)=>ACCESS_ROLES.find(r=>r.id===id)?.name??`Rôle ${id}`
export default function AccessPanel() {
  const [search,setSearch]=useState(''),[selected,setSelected]=useState<AccessUser|null>(null),action=usePlatformAction(),auth=useAuth()
  const query=usePlatform<{users:AccessUser[]}>(`/api/admin/access/users?search=${encodeURIComponent(search.trim())}`)
  const history=usePlatform<{entries:RoleEntry[]}>(`/api/admin/access/users/${selected?.id??0}/history`,Boolean(selected))
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!selected)return
    const d=new FormData(e.currentTarget),roleId=Number(d.get('roleId')),reason=String(d.get('reason')).trim()
    if(roleId===selected.roleId)return
    if(!confirm(`Changer le rôle de ${selected.login} (${selected.email}) : ${roleName(selected.roleId)} → ${roleName(roleId)} ? Le changement prend effet immédiatement.`))return
    if(await action.run(async()=>{
      await api.put(`/api/admin/access/users/${selected.id}/role`,{roleId,reason})
      if(auth.user?.id===selected.id)auth.updateUser((await api.get<{user:UserPublic}>('/auth/me')).data.user)
    }))setSelected({...selected,roleId})
  }
  return <section className={s.section}><h2>Utilisateurs et accès</h2><p>Recherchez un compte par pseudo ou email. Tout changement de rôle est confirmé et journalisé avec son motif. Le dernier administrateur conserve son accès.</p>
    <label className={s.field}>Rechercher un pseudo ou un email<input maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/></label>
    {query.isLoading&&<p role="status">Chargement des comptes…</p>}{query.isError&&<p role="alert">Impossible de charger les comptes. <button className={s.button} onClick={()=>void query.refetch()}>Réessayer</button></p>}{query.data?.users.length===0&&<p>Aucun compte ne correspond à votre recherche.</p>}
    <div style={{overflowX:'auto'}}><table className={s.reportTable}><thead><tr><th>Pseudo</th><th>Email</th><th>Rôle</th><th>Action</th></tr></thead><tbody>{query.data?.users.map(u=><tr key={u.id}><td>{u.login}</td><td>{u.email}</td><td>{roleName(u.roleId)}</td><td><button className={s.button} onClick={()=>setSelected(u)}>Gérer les accès de {u.login}</button></td></tr>)}</tbody></table></div>
    {action.error&&<p role="alert">{action.error}</p>}
    {selected&&<><form key={`${selected.id}-${selected.roleId}`} className={s.form} onSubmit={save}><h3>Accès de {selected.login}</h3><label className={s.field}>Nouveau rôle<select name="roleId" defaultValue={selected.roleId}>{ACCESS_ROLES.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label className={s.field}>Motif du changement<textarea name="reason" required maxLength={500}/></label><button className={s.button} disabled={action.busy}>Confirmer le changement de rôle</button></form>
      <h3>Historique des accès de {selected.login}</h3>{history.isLoading&&<p role="status">Chargement de l’historique…</p>}{history.isError&&<p role="alert">Impossible de charger l’historique. <button className={s.button} onClick={()=>void history.refetch()}>Réessayer</button></p>}{history.data?.entries.length===0&&<p>Aucun changement de rôle enregistré.</p>}<ul>{history.data?.entries.map(e=><li key={e.id}>{dateTime(e.createdAt)} · {e.actor.login} · {roleName(e.previousRoleId)} → {roleName(e.roleId)} · {e.reason}</li>)}</ul>
    </>}
  </section>
}
